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
    DirectionalLight,
    Matrix,
    Mesh,
    Scene,
    ShadowGenerator,
    StandardMaterial,
    UniversalCamera,
    Vector3,
} from "babylonjs";

import Split from "../Split";
import Utils from "../Utils";
import ISampleSplit from "./ISampleSplit";

export default class StandardShadow extends Split implements ISampleSplit {

    public static className: string = "Standard";

    protected shadowGenerator: ShadowGenerator;
    protected bias: number;
    protected filter: number;
    protected filteringQuality: number;
    protected shadowTextureSize: number;
    protected sun: DirectionalLight;

    constructor(scene: Scene, camera: UniversalCamera, name: string) {
        super(scene, camera, name);

        this.shadowGenerator = null as any;
        this.filter = ShadowGenerator.FILTER_PCF;
        this.bias = 0.007;
        this.filteringQuality = ShadowGenerator.QUALITY_HIGH;
        this.shadowTextureSize = 1024;
        this.sun = null as any;
    }

    public updateLightDirection(lightDir: Vector3): void {
        this.sun.direction = lightDir;
    }

    public async initialize(scenePath: string, sceneName: string, ambientColor: Color3, sunDir: Vector3, sunColor: Color3, backfaceCulling: boolean, scaling: number): Promise<ISampleSplit> {
        this.scene.metadata = { "name": this.name };

        this.sun = new DirectionalLight("sun", sunDir, this.scene);
        this.sun.intensity = 1;
        this.sun.shadowMinZ = -80;
        this.sun.shadowMaxZ = 150;
        this.sun.diffuse = sunColor;

        await Utils.loadObj(this.scene, scenePath, sceneName);

        this.scene.activeCamera = this.camera;

        Utils.addSkybox("Clouds.dds", this.scene, this.camera.maxZ - 1);

        this.scene.meshes.forEach((m) => {
            if (m.name == 'skyBox' || m.name.endsWith("_gui")) { return; }

            if (!m.material) { return; }

            const mat = m.material as StandardMaterial;

            mat.diffuseColor = new Color3(1., 1., 1.);
            mat.specularColor = new Color3(0., 0., 0.);
            mat.ambientColor = ambientColor;
            mat.ambientTexture = null;
            mat.backFaceCulling = backfaceCulling;

            if (!mat.diffuseTexture) {
                mat.ambientColor = new Color3(0, 0, 0);
            }
            //!mat.freeze();

            m.receiveShadows = true;

            if (scaling != 1) {
                let matrix = Matrix.Identity();
                matrix.scaleToRef(scaling, matrix);
                matrix.setRowFromFloats(3, 0, 0, 0, 1);
                (m as Mesh).bakeTransformIntoVertices(matrix);
            }
        });

        this.createShadowGenerator();

        return this;
    }

    protected createShadowGenerator(): void {
        const shadowGenerator = new ShadowGenerator(this.shadowTextureSize, this.sun);

        shadowGenerator.filter = this.filter;
        shadowGenerator.bias = this.bias;
        shadowGenerator.filteringQuality = this.filteringQuality;

        this.shadowGenerator = shadowGenerator;

        const renderList = shadowGenerator.getShadowMap()!.renderList!;

        let num = 0, lstm: Array<Mesh> = [];
        this.scene.meshes.forEach((m) => {
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
    }

    protected createCustomGUIProperties(): React.ReactElement {
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
