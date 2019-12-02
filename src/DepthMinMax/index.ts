import {
    Effect,
    Scene,
    Vector3,
    ShaderMaterial,
    RenderTargetTexture,
    DirectionalLight,
    StandardMaterial,
    Color3,
    Color4,
    ShadowGenerator,
    Quaternion,
    Matrix,
    Texture,
    Mesh,
    UniversalCamera,
    Engine,
    Viewport
} from "babylonjs";

import SampleBase from "../SampleBase";
import { lightsFragmentFunctions } from "babylonjs/Shaders/ShadersInclude/lightsFragmentFunctions";

enum enumSplitMode {
    SIDE_BY_SIDE,
    LINEAR
}

export default class Sample extends SampleBase {

    protected sunDir:       Vector3;
    protected ambientColor: Color3;
    protected splitScreens: Array<any>;
    protected splitMode:    enumSplitMode;

    constructor(engine: Engine, canvas: HTMLCanvasElement) {
        super(engine, canvas);

        this.splitScreens = [];
        this.splitMode = enumSplitMode.LINEAR;

        this.sunDir = new Vector3(32, -30, 22);
        this.ambientColor = new Color3(0.3, 0.3, 0.3);

        (window as any).ss = this.splitScreens;
    }

    public async create() {
        this.makeSplitForStandardShadow("s1").then((split) => {
            this.addSplit(split);
        });

        this.makeSplitForCSM("csm1").then((split) => {
            this.addSplit(split);
        });

        /*this.makeSplitForStandardShadow("s2").then((split) => {
            this.addSplit(split);
        });*/

        return Promise.resolve(0);
    }

    public onBeforeRender(deltaTime: number): void {
        super.onBeforeRender(deltaTime);

        let matrix = new Matrix();

        let rotY = this.XMScalarModAngle(deltaTime * 0.25);

        let rotation = Quaternion.RotationAxis(new Vector3(0.0, 1.0, 0.0), rotY);

        Matrix.FromQuaternionToRef(rotation, matrix);
        Vector3.TransformCoordinatesToRef(this.sunDir, matrix, this.sunDir);

        //this.splitScreens.forEach((split) => split.updateLightDirection(this.sunDir));
    }

    public render(): void {
        const w = this.engine.getRenderWidth(),
              h = this.engine.getRenderHeight(),
              stepx = w / this.splitScreens.length;

        for (let i = 0; i < this.splitScreens.length; ++i) {
            const split = this.splitScreens[i];

            switch(this.splitMode) {
                case enumSplitMode.SIDE_BY_SIDE:
                    (split.scene.activeCamera as UniversalCamera).viewport = new Viewport(i / this.splitScreens.length, 0, 1 / this.splitScreens.length, 1);
                    break;
                case enumSplitMode.LINEAR:
                    if (this.splitScreens.length > 1) {
                        split.scene.onBeforeDrawPhaseObservable.addOnce(() => {
                            this.engine.enableScissor(stepx * i, 0, stepx * (i + 1), h);
                        });
                        split.scene.onAfterDrawPhaseObservable.addOnce(() => {
                            this.engine.disableScissor();
                        });
                    }
                    break;
            }

            split.scene.render();
        }

    }

    protected createSceneAndCamera(): [Scene, UniversalCamera] {
        const [scene, camera] = super.createSceneAndCamera();

        scene.ambientColor = new Color3(1, 1, 1);
        scene.clearColor = new Color4(0.17773, 0.41797, 0.65234);
        scene.autoClear = false;

        camera.position.x = 100;
        camera.position.y = 5;
        camera.position.z = 5;

        camera.setTarget(Vector3.Zero());

        return [scene, camera];
    }

    protected async makeSplitForStandardShadow(name: string) {
        let split: any = {};

        const [scene, camera] = this.createSceneAndCamera();

        split.type = 'std';
        split.name = name;

        split.scene = scene;
        split.scene.metadata = { "name": name };

        split.filter = ShadowGenerator.FILTER_CLOSEEXPONENTIALSHADOWMAP;
        if (name == "s2") {
            split.filter = ShadowGenerator.FILTER_PCF;
        }
        split.bias = 0.007;
        split.filteringQuality = ShadowGenerator.QUALITY_HIGH;
        split.shadowTextureSize = 1024;

        split.sun = new DirectionalLight("sun", this.sunDir.clone(), split.scene);
        split.sun.intensity = 1;
        split.sun.shadowMinZ = -80;
        split.sun.shadowMaxZ = 150;

        await this.loadObj(split.scene, "./resources/3d/powerplant/", "powerplant.obj");

        this.addSkybox("Clouds.dds", split.scene);

        split.scene.meshes.forEach((m: Mesh) => {
            if (m.name == 'skyBox') { return; }

            const mat = m.material as StandardMaterial;

            mat.diffuseColor = new Color3(1., 1., 1.);
            mat.ambientColor = this.ambientColor;
            mat.ambientTexture = null;
            mat.backFaceCulling = false; // Some meshes have incorrect winding orders... use no backface culling for now
            //!mat.freeze();

            m.receiveShadows = true;
        });

        split.createShadowGenerator = function() {
            const shadowGenerator = new ShadowGenerator(this.shadowTextureSize, this.sun);

            shadowGenerator.filter = this.filter;
            shadowGenerator.bias = this.bias;
            shadowGenerator.filteringQuality = this.filteringQuality;

            this.shadowGenerator = shadowGenerator;

            const renderList = shadowGenerator.getShadowMap()!.renderList!;

            let num = 0, lstm: Array<Mesh> = [];
            this.scene.meshes.forEach((m: Mesh) => {
                if (m.name == 'skyBox') { return; }
                renderList.push(m);
                /*if (m.name == "mesh_108_Mesh_main_floor_subset_6" || m.name == "mesh_121_Mesh_g_bace_main05_subset_0") {
                    if (m.name=="mesh_121_Mesh_g_bace_main05_subset_0")
                        renderList.push(m);
                } else
                    lstm.push(m);*/
            });
            lstm.forEach((m) => {
                m.dispose();
            });
        };

        split.updateLightDirection = function(lightDir: Vector3) {
            this.sun.direction = lightDir;
        };

        split.createShadowGenerator();

        //split.scene.freeActiveMeshes();

        return split;
    }

    protected async makeSplitForCSM(name: string) {
        let split: any = {};

        const [scene, camera] = this.createSceneAndCamera();

        split.type = 'csm';
        split.name = name;

        split.scene = scene;
        split.scene.metadata = { "name": split.name };

        await this.loadObj(split.scene, "./resources/3d/powerplant/", "powerplant.obj");

        this.addSkybox("Clouds.dds", split.scene);

        const stdMat = this.makeShader(split.scene);

        split.scene.meshes.forEach((m: Mesh) => {
            if (m.name == 'skyBox') { return; }

            const matOrig = m.material as StandardMaterial,
                  texture = matOrig.diffuseTexture as Texture,
                  newMat = stdMat.clone(matOrig.name);

            newMat.backFaceCulling = false;
            newMat.setTexture("textureSampler", texture as Texture);
            newMat.setVector3("lightDirection", this.sunDir.clone());
            newMat.setColor3("ambientColor", this.ambientColor);
            //newMat.freeze();

            m.material = newMat;
        });

        split.updateLightDirection = function(lightDir: Vector3) {
            this.scene.meshes.forEach((m: Mesh) => {
                if (m.name == 'skyBox') { return; }
                m.metadata.mat.setVector3("lightDirection", lightDir);
            });
        };

        //split.scene.freeActiveMeshes();

        return split;
    }

    protected addSplit(split: any): void {
        this.splitScreens.push(split);
    }

    protected removeSplit(index: number): void {
        this.splitScreens.splice(index, 1);
    }

    protected makeShader(scene: Scene): ShaderMaterial {
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
            scene,
            'ppStd',
            {
                attributes: [ 'position', 'normal', 'uv' ],
                uniforms: [ 'world', 'worldView', 'worldViewProjection', 'view', 'projection', 'lightDirection']
            }
        );

        return stdMaterial;
    }
}
