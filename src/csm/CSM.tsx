import * as React from "react";
import {
    Button,
    Checkbox,
    ExpansionPanel,
    ExpansionPanelDetails,
    ExpansionPanelSummary,
    Icon,
    Typography,
} from '@material-ui/core';

import {
    Color3,
    Effect,
    Scene,
    ShaderMaterial,
    StandardMaterial,
    UniversalCamera,
    Texture,
    Vector3,
    Matrix,
    Mesh,
} from "babylonjs";

import Sample from "../Sample";
import Split from "../Split";
import Utils from "../Utils";
import ISampleSplit from "./ISampleSplit";

export default class CSM extends Split implements ISampleSplit {

    public static className: string = "CSM";

    protected sunDir: Vector3;

    constructor(scene: Scene, camera: UniversalCamera, parent: Sample, name: string) {
        super(scene, camera, parent, name);

        this.sunDir = new Vector3();
    }

    public updateLightDirection(lightDir: Vector3): void {
        this.scene.meshes.forEach((m) => {
            if (m.name == 'skyBox' || !m.material || m.name.endsWith("_gui")) { return; }
            (m.material as ShaderMaterial).setVector3("lightDirection", lightDir);
        });
    }

    public async initialize(scenePath: string, sceneName: string, ambientColor: Color3, sunDir: Vector3, sunColor: Color3, backfaceCulling: boolean, scaling: number): Promise<ISampleSplit> {
        this.scene.metadata = { "name": this.name };

        this.sunDir = sunDir;

        await Utils.loadObj(this.scene, scenePath, sceneName);

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

            newMat.backFaceCulling = backfaceCulling;
            newMat.setVector3("lightDirection", sunDir);
            newMat.setColor3("lightColor", sunColor);
            if (diffuse) {
                newMat.setTexture("textureSampler", diffuse);
                newMat.setColor3("ambientColor", ambientColor);
            } else {
                newMat.setTexture("textureSampler", whiteTexture);
                newMat.setColor3("ambientColor", new Color3(0, 0, 0));
            }
            //newMat.freeze();

            m.material = newMat;

            if (scaling != 1) {
                let matrix = Matrix.Identity();
                matrix.scaleToRef(scaling, matrix);
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

    protected createCustomGUI(): React.ReactElement {
        const Properties = () => {
            return (
                <ExpansionPanel defaultExpanded={true}>
                    <ExpansionPanelSummary
                        expandIcon={<Icon>expand_more</Icon>}
                    >
                        <Typography>SceneControls</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <Button variant="contained" color="primary">
                        Hello World
                        </Button>
                    </ExpansionPanelDetails>
                </ExpansionPanel>
            );
        };

        return Properties();
    }

}
