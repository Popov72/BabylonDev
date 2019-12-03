import {
    Color3,
    DirectionalLight,
    Effect,
    Mesh,
    Scene,
    ShaderMaterial,
    ShadowGenerator,
    StandardMaterial,
    UniversalCamera,
    Texture,
    Vector3,
} from "babylonjs";

import Split from "../Split";
import Utils from "../Utils";
import ISampleSplit from "./ISampleSplit";

export default class CSM extends Split implements ISampleSplit {

    protected sunDir: Vector3;

    constructor(scene: Scene, camera: UniversalCamera, name: string) {
        super(scene, camera, name);

        this.sunDir = new Vector3();
    }

    public updateLightDirection(lightDir: Vector3): void {
        this.scene.meshes.forEach((m) => {
            if (m.name == 'skyBox') { return; }
            (m.material as ShaderMaterial).setVector3("lightDirection", lightDir);
        });
    }

    public async initialize(scenePath: string, sceneName: string, ambientColor: Color3, sunDir: Vector3): Promise<ISampleSplit> {
        this.scene.metadata = { "name": this.name };

        this.sunDir = sunDir;

        await Utils.loadObj(this.scene, scenePath, sceneName);

        Utils.addSkybox("Clouds.dds", this.scene);

        const stdMat = this.makeShader(this.scene);

        this.scene.meshes.forEach((m) => {
            if (m.name == 'skyBox') { return; }

            const matOrig = m.material as StandardMaterial,
                  texture = matOrig.diffuseTexture as Texture,
                  newMat = stdMat.clone(matOrig.name);

            newMat.backFaceCulling = false;
            newMat.setTexture("textureSampler", texture as Texture);
            newMat.setVector3("lightDirection", sunDir);
            newMat.setColor3("ambientColor", ambientColor);
            //newMat.freeze();

            m.material = newMat;
        });

        return this;
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

        //const renderTarget = new RenderTargetTexture('caustic texture', 512, scene);
        //scene.customRenderTargets.push(renderTarget);

        return stdMaterial;
    }

}
