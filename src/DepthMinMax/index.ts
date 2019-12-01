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
    Matrix,
    Texture,
    Viewport
} from "babylonjs";

import {
    OBJFileLoader
} from "babylonjs-loaders";

import SampleBase from "../SampleBase";

export default class Sample extends SampleBase {

    protected sunDir:       Vector3;
    protected ambientColor: Color3;
    protected splitScreens: Array<any>;

    constructor(scene: Scene) {
        super(scene);

        this.splitScreens = [];
        this.sunDir = new Vector3(32, -30, 22);
        this.ambientColor = new Color3(0.3, 0.3, 0.3);
    }

    public create(): void {
        this.scene.ambientColor = new Color3(1, 1, 1);
        this.scene.clearColor = new Color4(0.17773, 0.41797, 0.65234);
        this.scene.autoClear = false;

        this.camera.position.x = 100;
        this.camera.position.y = 5;
        this.camera.position.z = 5;

        this.camera.setTarget(Vector3.Zero());

        this.make();
    }

    public render(): void {
        const w = this.engine.getRenderWidth(),
              h = this.engine.getRenderHeight(),
              stepx = w / this.splitScreens.length;

        let splitStd = null;

        for (let i = 0; i < this.splitScreens.length; ++i) {
            const split = this.splitScreens[i];

            this.engine.enableScissor(stepx * i, 0, stepx * (i + 1), h);

            switch(split.type) {
                case "std": {
                    for (let m = 0; m < this.scene.meshes.length; ++m) {
                        const mesh = this.scene.meshes[m];
                        if (!mesh.metadata) { continue; }
                        mesh.material = mesh.metadata.matOrig;
                    }
                    this.scene.render();
                    splitStd = split;
                    break;
                }

                case "csm": {
                    for (let m = 0; m < this.scene.meshes.length; ++m) {
                        const mesh = this.scene.meshes[m];
                        if (!mesh.metadata) { continue; }
                        mesh.material = mesh.metadata.mat;
                    }
                    this.scene.render();
                    break;
                }
            }
        }

        if (splitStd) {
            splitStd.reset(this);
        }
    }

    protected makeSplitForStandardShadow(): any {
        let split: any = {};

        split.type = 'std';
        split.usePercentageCloserFiltering = true;
        split.bias = 0.007;
        split.filteringQuality = ShadowGenerator.QUALITY_HIGH;
        split.shadowTextureSize = 1024;
        split.sun = new DirectionalLight("sun", this.sunDir, this.scene);
        split.sun.intensity = 1;
        split.sun.shadowMinZ = -80;
        split.sun.shadowMaxZ = 150;

        split.reset = function(sample: Sample) {
            sample.scene.meshes.forEach((m) => {
                if (!m.metadata) { return; }
                m.receiveShadows = true;
                m.material = m.metadata.matOrig;
            });
        }

        split.enable = function(sample: Sample) {
            const shadowGenerator = new ShadowGenerator(this.shadowTextureSize, this.sun),
                  renderList = shadowGenerator.getShadowMap()!.renderList!;

            shadowGenerator.usePercentageCloserFiltering = this.usePercentageCloserFiltering;
            shadowGenerator.bias = this.bias;
            shadowGenerator.filteringQuality = this.filteringQuality;

            sample.scene.meshes.forEach((m) => {
                if (!m.metadata) { return; }
                renderList.push(m);
            });

            this.reset(sample);
        };

        split.disable = function(sample: Sample) {
            sample.scene.meshes.forEach((m) => {
                m.receiveShadows = false;
            });
            split.shadowGenerator.dispose();
        };

        split.updateLightDirection = function(sample: Sample) {
            this.sun.direction = sample.sunDir;
        };

        return split;
    }

    protected makeSplitForCSM(): any {
        let split: any = {};

        split.type = 'csm';

        split.enable = function(sample: Sample) {
            sample.scene.meshes.forEach((m) => {
                if (!m.metadata) { return; }
                m.receiveShadows = false;
                m.material = m.metadata.mat;
            });
        };

        split.disable = (sample: Sample) => {
        };

        split.updateLightDirection = function(sample: Sample) {
            sample.scene.meshes.forEach((m) => {
                if (!m.metadata) { return; }
                m.metadata.mat.setVector3("lightDirection", sample.sunDir);
            });
        };

        return split;
    }

    protected addSplit(split: any): void {
        split.enable(this);

        this.splitScreens.push(split);
    }

    protected removeSplit(index: number): void {
        this.splitScreens[index].disable(this);

        this.splitScreens.splice(index, 1);
    }

    protected async make() {
        //OBJFileLoader.COMPUTE_NORMALS = true;
        //OBJFileLoader.INVERT_Y  = false;
        OBJFileLoader.OPTIMIZE_WITH_UV = true;
        OBJFileLoader.MATERIAL_LOADING_FAILS_SILENTLY = false;
        OBJFileLoader.INVERT_TEXTURE_Y  = false;

        const stdMat = this.makeShader();

        await SceneLoader.AppendAsync("./resources/3d/powerplant/", "powerplant.obj", this.scene);

        this.scene.meshes.forEach((m) => {
            const matOrig = m.material as StandardMaterial,
                  texture = matOrig.diffuseTexture as Texture,
                  newMat = stdMat.clone("cloned");

            newMat.backFaceCulling = false;
            newMat.setTexture("textureSampler", texture as Texture);
            newMat.setVector3("lightDirection", this.sunDir);
            newMat.setColor3("ambientColor", this.ambientColor);
            newMat.freeze();

            m.metadata = {};
            m.metadata.matOrig = matOrig;
            m.metadata.mat = newMat;

            matOrig.diffuseColor = new Color3(1., 1., 1.);
            matOrig.ambientColor = this.ambientColor;
            matOrig.ambientTexture = null;
            matOrig.backFaceCulling = false; // Some meshes have incorrect winding orders... use no backface culling for now
            matOrig.freeze();
        });

        this.addSkybox("Clouds.dds");

        //scene.freeActiveMeshes();

        /*let lastTime = new Date().getTime();
        let matrix = new Matrix();

        this.scene.onBeforeRenderObservable.add(() => {
            let curTime = new Date().getTime();
            let delta = (curTime - lastTime) / 1000;
            let rotY = this.XMScalarModAngle(delta * 0.25);

            let rotation = Quaternion.RotationAxis(new Vector3(0.0, 1.0, 0.0), rotY);

            Matrix.FromQuaternionToRef(rotation, matrix);
            Vector3.TransformCoordinatesToRef(this.sunDir, matrix, this.sunDir);

            this.splitScreens.forEach((s) => s.updateLightDirection(this));

            lastTime = curTime;
        });*/

        this.addSplit(this.makeSplitForStandardShadow());
        this.addSplit(this.makeSplitForCSM());

        return Promise.resolve(0);
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
            uniform vec3 lightDirection;
            uniform vec3 ambientColor;

            varying vec2 vUV;
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main(void)
            {
                vec3 lightVectorW = normalize(-lightDirection);
                float ndl = max(0., dot(vNormal, lightVectorW));
                vec4 baseColor = texture2D(textureSampler, vUV);
                vec3 diffuse = clamp(ndl + ambientColor, 0.0, 1.0)*baseColor.rgb;
                vec4 c = vec4(diffuse, 1.0);
                //if (c.a < 0.3) discard;
                gl_FragColor = c;
            }
        `;

        const stdMaterial = new ShaderMaterial(
            'standard material',
            this.scene,
            'ppStd',
            {
                attributes: [ 'position', 'normal', 'uv' ],
                uniforms: [ 'world', 'worldView', 'worldViewProjection', 'view', 'projection', 'lightDirection']
            }
        );

        return stdMaterial;
    }
}
