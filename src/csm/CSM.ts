import {
    Color3,
    DirectionalLight,
    LightGizmo,
    Matrix,
    Mesh,
    MeshBuilder,
    Scene,
    ShadowGenerator,
    StandardMaterial,
    UniversalCamera,
    Vector3,
    VertexData,
} from "babylonjs";

import Sample from "../Sample";
import Utils from "../Utils";
import ISampleSplit from "./ISampleSplit";
import { ISceneDescription } from "./GlobalGUI";
import StandardShadow from "./StandardShadow";
import CSMGUI from "./CSMGUI";
import { CSMShadowGenerator } from "./csmShadowGenerator";
import { CSMShadowMap } from "./csmShadowMap";

export default class CSM extends StandardShadow {

    public static className: string = "CSM";

    protected _numCascades: number;
    protected _activeCascade: number;
    protected _stabilizeCascades: boolean;

    constructor(scene: Scene, camera: UniversalCamera, parent: Sample, name: string) {
        super(scene, camera, parent, name);

        this._numCascades = 4;
        this._activeCascade = CSMShadowGenerator.CASCADE_1;
        this._stabilizeCascades = false;
    }

    protected getCSMGenerator(): CSMShadowGenerator {
        return (this._shadowGenerator as unknown as CSMShadowGenerator);
    }

    public get numCascades(): number {
        return this._numCascades;
    }

    public set numCascades(num: number) {
        this._numCascades = num;
        this.getCSMGenerator().numCascades = num;
        this.activeCascade = this.getCSMGenerator().activeCascade;
        this.setShadowMapViewerTexture();
    }

    public get activeCascade(): number {
        return this._activeCascade;
    }

    public set activeCascade(num: number) {
        this._activeCascade = num;
        this.getCSMGenerator().activeCascade = num;
        this.setShadowMapViewerTexture();
    }

    public get stabilizeCascades(): boolean {
        return this._stabilizeCascades;
    }

    public set stabilizeCascades(sc: boolean) {
        this._stabilizeCascades = sc;
        this.getCSMGenerator().stabilizeCascades = sc;
    }

    protected getLightExtents(): { min: Vector3, max: Vector3 } | null {
        const cascade = this.getCSMGenerator().cascade;

        if (!cascade) {
            return null;
        }

        const csmSM = cascade.generator;

        return {
            "min": csmSM.lightMinExtents,
            "max": csmSM.lightMaxExtents,
        }
    }

    public createGUI(): void {
        this.gui = new CSMGUI(this.name, this.scene.getEngine(), this._container, this);

        this.gui.createGUI();
    }

    protected createGenerator(): ShadowGenerator {
        return (new CSMShadowGenerator(this.shadowMapSize, this.sun, this._numCascades)) as unknown as ShadowGenerator;
    }

    protected setShadowMapViewerTexture(): void {
        (this._shadowMapPlane.material as StandardMaterial).diffuseTexture = this._activeCascade !== CSMShadowGenerator.CASCADE_ALL ? this.getCSMGenerator().getShadowMaps()[this._activeCascade] : null;
    }

    protected createShadowGenerator(): void {
        super.createShadowGenerator();

        const shadowGenerator = this.getCSMGenerator();

        shadowGenerator.activeCascade = this._activeCascade;
        shadowGenerator.stabilizeCascades = this._stabilizeCascades;

        this.setShadowMapViewerTexture();
    }

}
