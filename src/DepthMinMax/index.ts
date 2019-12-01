import {
    Effect,
    Scene,
    Vector3,
    ShaderMaterial,
    RenderTargetTexture,
    SceneLoader,
    DirectionalLight,
    StandardMaterial,
    Color3,
    Color4,
    ShadowGenerator,
    Quaternion,
    Matrix
} from "babylonjs";

import {
    OBJFileLoader
} from "babylonjs-loaders";

import SampleBase from "../SampleBase";

export default class Sample extends SampleBase {

    protected sun: DirectionalLight = <any>null;

    public create(): void {
        this.scene.ambientColor = new Color3(1, 1, 1);
        this.scene.clearColor = new Color4(0.17773, 0.41797, 0.65234);
        //this.scene.autoClear = false;

        this.camera.position.x = 100;
        this.camera.position.y = 5;
        this.camera.position.z = 5;

        this.camera.setTarget(Vector3.Zero());

        this.sun = new DirectionalLight("sun", new Vector3(32, -30, 22), this.scene);
        this.sun.intensity = 1;

        this.make();
    }

    protected make(): void {
        //OBJFileLoader.COMPUTE_NORMALS = true;
        OBJFileLoader.OPTIMIZE_WITH_UV = true;
        OBJFileLoader.MATERIAL_LOADING_FAILS_SILENTLY = false;
        //OBJFileLoader.INVERT_Y  = false;
        OBJFileLoader.INVERT_TEXTURE_Y  = false;

        const stdMat = this.makeShader();

        var shadowGenerator = new ShadowGenerator(1024, this.sun);
        var renderList = shadowGenerator.getShadowMap()!.renderList!;
        shadowGenerator.usePercentageCloserFiltering  = true;
        shadowGenerator.bias = 0.007;
        shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH;

        this.sun.shadowMinZ = -80;
        this.sun.shadowMaxZ = 150;
        //this.sun.shadowOrthoScale = 0;

        SceneLoader.Append("./resources/3d/powerplant/", "powerplant.obj", this.scene, (scene: Scene) => {
            scene.meshes.forEach((m) => {
                /*const texture = (m.material as StandardMaterial).diffuseTexture as Texture;
                const newMat = stdMat.clone("cloned");
                newMat.backFaceCulling = false;
                newMat.setTexture("textureSampler", texture as Texture);
                m.material = newMat;*/

                const mat = m.material as StandardMaterial;
                mat.diffuseColor = new Color3(1., 1., 1.);
                mat.ambientColor = new Color3(0.3, 0.3, 0.3);
                mat.ambientTexture = null;
                mat.backFaceCulling = false; // Some meshes have incorrect winding orders... use no backface culling for now
                mat.freeze();

                m.receiveShadows = true;

                renderList.push(m);
            });

            this.addSkybox("Clouds.dds");

            scene.freeActiveMeshes();

            let lastTime = new Date().getTime();

            scene.onBeforeRenderObservable.add(() => {
                let curTime = new Date().getTime();
                let delta = (curTime - lastTime) / 1000;
                let rotY = this.XMScalarModAngle(delta * 0.25);

                let rotation = Quaternion.RotationAxis(new Vector3(0.0, 1.0, 0.0), rotY);
                let matrix = new Matrix();
                Matrix.FromQuaternionToRef(rotation, matrix);
                let lightDir = this.sun.direction;
                lightDir = Vector3.TransformCoordinates(lightDir, matrix);
                this.sun.direction = lightDir;

                lastTime = curTime;
            });
        });
    }

    protected makeShader(): ShaderMaterial {
        Effect.ShadersStore.ppStdVertexShader = `
            precision highp float;

            attribute vec3 position;
            attribute vec3 normal;
            attribute vec2 uv;

            uniform mat4 world;
            uniform mat4 view;
            uniform mat4 projection;
            uniform mat4 worldViewProjection;

            varying vec2 vUV;
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
                vec3 positionUpdated = position;

                vec4 worldPos = world * vec4(positionUpdated, 1.0);
                vNormal = normalize(vec3(world * vec4(normal, 0.0)));
                vPosition = worldPos.xyz;
                vUV = uv;

                gl_Position = projection * view * worldPos;
            }
        `;

        Effect.ShadersStore.ppStdFragmentShader = `
            precision highp float;

            uniform sampler2D textureSampler;

            varying vec2 vUV;
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main(void)
            {
                vec4 c = texture2D(textureSampler, vUV);
                if (c.a < 0.3) discard;
                gl_FragColor = vec4(c.rgb, 1.0);
            }
        `;

        const stdMaterial = new ShaderMaterial(
            'standard material',
            this.scene,
            'ppStd',
            {
                attributes: [ 'position', 'normal', 'uv' ],
                uniforms: [ 'world', 'worldView', 'worldViewProjection', 'view', 'projection', ]
            }
        );

        return stdMaterial;
    }
}
