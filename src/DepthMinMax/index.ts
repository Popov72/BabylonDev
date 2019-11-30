import {
    Effect,
    Scene,
    Vector3,
    HemisphericLight,
    Mesh,
    ShaderMaterial,
    RenderTargetTexture,
    SceneLoader,
    TargetCamera,
    DirectionalLight,
    StandardMaterial,
    Texture,
    Color4
} from "babylonjs";

import {
    OBJFileLoader
} from "babylonjs-loaders";

export default class Sample {
    public static CreateScene(scene: Scene): void {
        let camera = scene.activeCamera as TargetCamera;

        scene.clearColor = new Color4(0.17773, 0.41797, 0.65234);

        camera.position.x = 100;
        camera.position.y = 5;
        camera.position.z = 5;

        camera.setTarget(Vector3.Zero());

        /*var light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
        light.intensity = 0.5;

        var sun = new DirectionalLight("sun", new Vector3(32, -30, 22), scene);
        sun.intensity = 1;*/

        Sample.make(scene, []);
    }

    protected static make(scene: Scene, meshes: Array<Mesh>): void {
        //OBJFileLoader.COMPUTE_NORMALS = true;
        OBJFileLoader.OPTIMIZE_WITH_UV = true;
        OBJFileLoader.MATERIAL_LOADING_FAILS_SILENTLY = false;
        //OBJFileLoader.INVERT_Y  = false;
        OBJFileLoader.INVERT_TEXTURE_Y  = false;

        const stdMat = this.makeShader(scene);

        SceneLoader.Append("./resources/3d/powerplant/", "powerplant.obj", scene, function(scene) {
            scene.meshes.forEach((m) => {
                const texture = (m.material as StandardMaterial).diffuseTexture as Texture;
                const newMat = stdMat.clone("cloned");
                //newMat.backFaceCulling = false;
                newMat.setTexture("textureSampler", texture as Texture);
                m.material = newMat;
            });
        });
    }

    protected static makeShader(scene: Scene): ShaderMaterial {
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
            scene,
            'ppStd',
            {
                attributes: [ 'position', 'normal', 'uv' ],
                uniforms: [ 'world', 'worldView', 'worldViewProjection', 'view', 'projection', ]
            }
        );

        return stdMaterial;
    }
}
