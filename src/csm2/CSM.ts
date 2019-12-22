import {
    //CascadedShadowGenerator,
    Scene,
    ShadowGenerator,
    StandardMaterial,
    UniversalCamera,
    Vector3,
} from "babylonjs";

import Sample from "../Sample";
import StandardShadow from "./StandardShadow";
import CSMGUI from "./CSMGUI";
import { CascadedShadowGenerator } from "./cascadedShadowGenerator";

export default class CSM extends StandardShadow {

    public static className: string = "CSM";

    constructor(scene: Scene, camera: UniversalCamera, parent: Sample, name: string) {
        super(scene, camera, parent, name);

        this._shadowMapFilter = CascadedShadowGenerator.FILTER_PCF;

        (window as any).csm = this;
        //this._shadowMapPlane.rotate(new Vector3(0, 0, 1), -Math.PI / 2);
        //this._shadowMapPlane.bakeCurrentTransformIntoVertices();
    }

    protected getCSMGenerator(): CascadedShadowGenerator {
        return (this._shadowGenerator as unknown as CascadedShadowGenerator);
    }

    public get csmNumCascades(): number {
        return this._csmNumCascades;
    }

    public set csmNumCascades(num: number) {
        this._csmNumCascades = num;
        this.getCSMGenerator().cascades = num;
    }

    public get csmActiveCascade(): number {
        return this._csmActiveCascade;
    }

    public set csmActiveCascade(cac: number) {
        this._csmActiveCascade = cac;

        this.setShadowMapViewerTexture();
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
        //!this.getCSMGenerator().stabilizeCascades = ssc;
    }

    public get csmDepthClamp(): boolean {
        return this._csmDepthClamp;
    }

    public set csmDepthClamp(cdc: boolean) {
        this._csmDepthClamp = cdc;
        this.getCSMGenerator().depthClamp = cdc;
    }

    public get csmLambda(): number {
        return this._csmLambda;
    }

    public set csmLambda(cl: number) {
        this._csmLambda = cl;
        this.getCSMGenerator().lambda = cl;
    }

    protected getLightExtents(): { min: Vector3, max: Vector3 } | null {
        /*const cascade = this.getCSMGenerator().cascade;

        if (!cascade) {
            return null;
        }

        const csmSM = cascade.generator;

        return {
            "min": csmSM.lightMinExtents,
            "max": csmSM.lightMaxExtents,
        }*/

        return null;
    }

    public createGUI(): void {
        this.gui = new CSMGUI(this.name, this.scene.getEngine(), this._container, this);

        this.gui.createGUI();
    }

    protected createGenerator(): ShadowGenerator {
        const generator = new CascadedShadowGenerator(this.shadowMapSize, this.sun);

        generator.cascades = this._csmNumCascades;

        return generator as unknown as ShadowGenerator;
    }

    protected setShadowMapViewerTexture(): void {
        (this._shadowMapPlane.material as StandardMaterial).diffuseTexture = this.getCSMGenerator().getShadowMap();
    }

    protected createShadowGenerator(): void {
        super.createShadowGenerator();

        const shadowGenerator = this.getCSMGenerator();

        //!shadowGenerator.stabilizeCascades = this._csmStabilizeCascades;
        shadowGenerator.depthClamp = this._csmDepthClamp;
        shadowGenerator.lambda = this._csmLambda;
        shadowGenerator.debug = this._csmVisualizeCascades
        //!shadowGenerator.freezeShadowCastersBoundingInfo = true;

        this.setShadowMapViewerTexture();
    }

}
