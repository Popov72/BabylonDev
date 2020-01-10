import {
    CascadedShadowGenerator,
    Scene,
    ShadowGenerator,
    StandardMaterial,
    UniversalCamera,
    Vector3,
    Matrix,
    DepthRenderer,
} from "babylonjs";

import Sample from "../Sample";
import StandardShadow from "./StandardShadow";
import CSMGUI from "./CSMGUI";
//import { CascadedShadowGenerator } from "./cascadedShadowGenerator";

const useSceneDepthRenderer = false;

export default class CSM extends StandardShadow {

    public static className: string = "CSM";

    private _depthRenderer: DepthRenderer;

    constructor(scene: Scene, camera: UniversalCamera, parent: Sample, name: string) {
        super(scene, camera, parent, name);

        this._shadowMapFilter = CascadedShadowGenerator.FILTER_PCF;

        (window as any).csm = this;

        if (useSceneDepthRenderer) {
            this._depthRenderer = scene.enableDepthRenderer(camera, false);
        }
    }

    protected getCSMGenerator(): CascadedShadowGenerator {
        return (this._shadowGenerator as unknown as CascadedShadowGenerator);
    }

    public get cameraNearPlane(): number {
        return this._cameraNearPlane;
    }

    public set cameraNearPlane(cnp: number) {
        this._cameraNearPlane = cnp;
        this.camera.minZ = cnp;
        const val = this.getCSMGenerator().shadowMaxZ;
        this.getCSMGenerator().shadowMaxZ = this._cameraNearPlane; // make shadowMaxZ change
        this.getCSMGenerator().shadowMaxZ = val; // so trigger a cascade recomputation
    }

    public get cameraFarPlane(): number {
        return this._cameraFarPlane;
    }

    public set cameraFarPlane(cfp: number) {
        this._cameraFarPlane = cfp;
        this.camera.maxZ = cfp;
        const val = this.getCSMGenerator().shadowMaxZ;
        this.getCSMGenerator().shadowMaxZ = this._cameraNearPlane; // make shadowMaxZ change
        this.getCSMGenerator().shadowMaxZ = val; // so trigger a cascade recomputation
        this._csmShadowMaxZ = this.getCSMGenerator().shadowMaxZ;

        const event = new CustomEvent('gui_set_value', { detail: { type: 'setShadowMaxZ' } });
        window.dispatchEvent(event);
    }

    public get csmNumCascades(): number {
        return this._csmNumCascades;
    }

    public set csmNumCascades(num: number) {
        this._csmNumCascades = num;
        this.getCSMGenerator().numCascades = num;
    }

    public get csmActiveCascade(): number {
        return this._csmActiveCascade;
    }

    public set csmActiveCascade(cac: number) {
        this._csmActiveCascade = cac;

        this.setShadowMapViewerTexture();
        this.buildLightHelper();
    }

    public get csmVisualizeCascades(): boolean {
        return this._csmVisualizeCascades;
    }

    public set csmVisualizeCascades(cvc: boolean) {
        this._csmVisualizeCascades = cvc;
        this.getCSMGenerator().debug = cvc;
    }

    public get csmStabilizeCascades(): boolean {
        return this._csmStabilizeCascades;
    }

    public set csmStabilizeCascades(ssc: boolean) {
        this._csmStabilizeCascades = ssc;
        this.getCSMGenerator().stabilizeCascades = ssc;
        window.setTimeout(this.buildLightHelper.bind(this), 100);
    }

    public get csmDepthClamp(): boolean {
        return this._csmDepthClamp;
    }

    public set csmDepthClamp(cdc: boolean) {
        this._csmDepthClamp = cdc;
        this.getCSMGenerator().depthClamp = cdc;
        window.setTimeout(this.buildLightHelper.bind(this), 100);
    }

    public get csmLambda(): number {
        return this._csmLambda;
    }

    public set csmLambda(cl: number) {
        this._csmLambda = cl;
        this.getCSMGenerator().lambda = cl;
    }

    public get csmSplitBlendPercentage(): number {
        return this._csmSplitBlendPercentage;
    }

    public set csmSplitBlendPercentage(csbp: number) {
        this._csmSplitBlendPercentage = csbp;
        this.getCSMGenerator().cascadeBlendPercentage = csbp;
    }

    public get csmPenumbraDarkness(): number {
        return this._csmPenumbraDarkness;
    }

    public set csmPenumbraDarkness(cpd: number) {
        this._csmPenumbraDarkness = cpd;
        this.getCSMGenerator().penumbraDarkness = cpd;
    }

    public get csmShadowMaxZ(): number {
        return this._csmShadowMaxZ;
    }

    public set csmShadowMaxZ(csmz: number) {
        this._csmShadowMaxZ = csmz;
        this.getCSMGenerator().shadowMaxZ = csmz;
        this._csmShadowMaxZ = this.getCSMGenerator().shadowMaxZ;

        const event = new CustomEvent('gui_set_value', { detail: { type: 'setShadowMaxZ' } });
        window.dispatchEvent(event);
    }

    public get csmAutoCalcDepthBounds(): boolean {
        return this._csmAutoCalcDepthBounds;
    }

    public set csmAutoCalcDepthBounds(cacdb: boolean) {
        if (this._csmAutoCalcDepthBounds === cacdb) {
            return;
        }

        this._csmAutoCalcDepthBounds = cacdb;
        this.getCSMGenerator().autoCalcDepthBounds = cacdb;
    }

    protected getLightExtents(): { min: Vector3, max: Vector3 } | null {
        const min = this.getCSMGenerator().getCascadeMinExtents(this._csmActiveCascade),
              max = this.getCSMGenerator().getCascadeMaxExtents(this._csmActiveCascade);

        return {
            "min": min!,
            "max": max!,
        }
    }

    protected getViewMatrix(): Matrix | null {
        return this.getCSMGenerator().getCascadeViewMatrix(this._csmActiveCascade);
    }

    public createGUI(): void {
        this.gui = new CSMGUI(this.name, this.scene.getEngine(), this._container, this);

        this.gui.createGUI();
    }

    protected createGenerator(): ShadowGenerator {
        const generator = new CascadedShadowGenerator(this.shadowMapSize, this.sun);

        generator.numCascades = this._csmNumCascades;

        return generator as unknown as ShadowGenerator;
    }

    protected setShadowMapViewerTexture(): void {
        (this._shadowMapPlane.material as StandardMaterial).diffuseTexture = this.getCSMGenerator().getShadowMap();
    }

    protected createShadowGenerator(): void {
        super.createShadowGenerator();

        const shadowGenerator = this.getCSMGenerator();

        shadowGenerator.stabilizeCascades = this._csmStabilizeCascades;
        shadowGenerator.depthClamp = this._csmDepthClamp;
        shadowGenerator.lambda = this._csmLambda;
        shadowGenerator.debug = this._csmVisualizeCascades
        shadowGenerator.cascadeBlendPercentage = this._csmSplitBlendPercentage;
        shadowGenerator.penumbraDarkness = this._csmPenumbraDarkness;
        shadowGenerator.shadowMaxZ = this._csmShadowMaxZ;
        shadowGenerator.freezeShadowCastersBoundingInfo = true;
        shadowGenerator.autoCalcDepthBounds = this._csmAutoCalcDepthBounds;

        if (useSceneDepthRenderer) {
            shadowGenerator.setDepthRenderer(this._depthRenderer);
        }

        this.setShadowMapViewerTexture();
    }

}
