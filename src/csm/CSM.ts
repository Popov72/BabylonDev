import {
    Color3,
    Effect,
    Scene,
    ShaderMaterial,
    StandardMaterial,
    Texture,
    Vector3,
    Matrix,
    Mesh,
} from "babylonjs";

import Utils from "../Utils";
import ISampleSplit from "./ISampleSplit";
import { ISceneDescription } from "./GlobalGUI";
import SplitBase from "./SplitBase";
import CSMGUI from "./CSMGUI";

export default class CSM extends SplitBase {

    public static className: string = "CSM";

    public get lightColor(): string {
        return this._sunColor.toHexString();
    }

    public set lightColor(lc: string) {
        this._sunColor = Color3.FromHexString(lc);
        this.scene.meshes.forEach((m) => {
            if (m.name == 'skyBox' || !m.material || m.name.endsWith("_gui")) { return; }
            (m.material as ShaderMaterial).setColor3("lightColor", this._sunColor);
        });
    }

    public createGUI(): void {
        this.gui = new CSMGUI(this.name, this.scene.getEngine(), this._container, this);

        this.gui.createGUI();
    }

    public get lightDirection(): Vector3 {
        return this._sunDir;
    }

    public set lightDirection(ld: Vector3) {
        this._sunDir = ld;
        this.scene.meshes.forEach((m) => {
            if (m.name == 'skyBox' || !m.material || m.name.endsWith("_gui")) { return; }
            (m.material as ShaderMaterial).setVector3("lightDirection", ld);
        });
    }

    public async initialize(scene: ISceneDescription, ambientColor: Color3, sunDir: Vector3): Promise<ISampleSplit> {
        this.scene.metadata = { "name": this.name };
        this._sceneName = scene.dname;

        this._sunDir = sunDir;
        this._sunColor = scene.sunColor.clone();

        await Utils.loadObj(this.scene, scene.path, scene.name);

        this.scene.activeCamera = this.camera;

        Utils.addSkybox("Clouds.dds", this.scene, this.camera.maxZ - 1);

        const stdMat = this.makeShader(this.scene),
              whiteTexture = new Texture("resources/texture/white.png", this.scene, true);

        this.scene.meshes.forEach((m) => {
            if (m.name == 'skyBox' || m.name.endsWith("_gui")) { return; }

            const mat = m.material;

            if (!mat || !(mat instanceof StandardMaterial)) { return; }

            let diffuse: Texture = mat.diffuseTexture as Texture;

            const newMat = stdMat.clone(m.name + "_" + mat.name + "_cloned");

            newMat.backFaceCulling = scene.backfaceCulling;
            newMat.setVector3("lightDirection", sunDir);
            newMat.setColor3("lightColor", this._sunColor);
            if (diffuse) {
                newMat.setTexture("textureSampler", diffuse);
                newMat.setColor3("ambientColor", ambientColor);
            } else {
                newMat.setTexture("textureSampler", whiteTexture);
                newMat.setColor3("ambientColor", new Color3(0, 0, 0));
            }
            //newMat.freeze();

            m.material = newMat;

            if (scene.scaling != 1) {
                let matrix = Matrix.Identity();
                matrix.scaleToRef(scene.scaling, matrix);
                matrix.setRowFromFloats(3, 0, 0, 0, 1);
                (m as Mesh).bakeTransformIntoVertices(matrix);
            }
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
            uniform vec3 lightColor;
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
                vec3 diffuse = clamp(ndl*lightColor + ambientColor, 0.0, 1.0)*baseColor.rgb;
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
