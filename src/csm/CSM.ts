import {
    CSMShadowGenerator,
    Scene,
    ShadowGenerator,
    StandardMaterial,
    UniversalCamera,
    Vector3,
} from "babylonjs";

import Sample from "../Sample";
import StandardShadow from "./StandardShadow";
import CSMGUI from "./CSMGUI";
//import { CSMShadowGenerator } from "./csmShadowGenerator";

export default class CSM extends StandardShadow {

    public static className: string = "CSM";

    constructor(scene: Scene, camera: UniversalCamera, parent: Sample, name: string) {
        super(scene, camera, parent, name);

        (window as any).csm = this;
        //this._shadowMapPlane.rotate(new Vector3(0, 0, 1), -Math.PI / 2);
        //this._shadowMapPlane.bakeCurrentTransformIntoVertices();
    }

    protected getCSMGenerator(): CSMShadowGenerator {
        return (this._shadowGenerator as unknown as CSMShadowGenerator);
    }

    public get csmNumCascades(): number {
        return this._csmNumCascades;
    }

    public set csmNumCascades(num: number) {
        this._csmNumCascades = num;
        this.getCSMGenerator().dispose();
        this._csmActiveCascade = 0;
        this.createShadowGenerator();
    }

    public get csmActiveCascade(): number {
        return this._csmActiveCascade;
    }

    public set csmActiveCascade(cac: number) {
        this._csmActiveCascade = cac;
        this.getCSMGenerator().activeCascade = cac;

        this._shadowMapFilter = this.getCSMGenerator().filter;
        this._shadowMapBias = this.getCSMGenerator().bias;
        this._shadowMapNormalBias = this.getCSMGenerator().normalBias;
        this._shadowMapDarkness = this.getCSMGenerator().darkness;
        this._shadowMapQuality = this.getCSMGenerator().filteringQuality;
        this._shadowMapDepthScale = this.getCSMGenerator().depthScale;
        this._shadowMapBlurScale = this.getCSMGenerator().blurScale;
        this._shadowMapUseKernelBlur = this.getCSMGenerator().useKernelBlur;
        this._shadowMapBlurKernel = this.getCSMGenerator().blurKernel;
        this._shadowMapBlurBoxOffset = this.getCSMGenerator().blurBoxOffset;
        this._shadowMapLightSizeUVRatio = this.getCSMGenerator().contactHardeningLightSizeUVRatio;

        this.setShadowMapViewerTexture();
    }

    public get csmStabilizeCascades(): boolean {
        return this._csmStabilizeCascades;
    }

    public set csmStabilizeCascades(ssc: boolean) {
        this._csmStabilizeCascades = ssc;
        this.getCSMGenerator().stabilizeCascades = ssc;
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

    public get csmUseRightDirectionAsUpForOrthoProj(): boolean {
        return this._csmUseRightDirectionAsUpForOrthoProj;
    }

    public set csmUseRightDirectionAsUpForOrthoProj(curdfop: boolean) {
        this._csmUseRightDirectionAsUpForOrthoProj = curdfop;
        this.getCSMGenerator().useRightDirectionAsUpForOrthoProj = curdfop;
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
        const generator = new CSMShadowGenerator(this.shadowMapSize, this.sun, this._csmNumCascades);;

        generator.activeCascade = CSMShadowGenerator.CASCADE_ALL;

        return generator as unknown as ShadowGenerator;
    }

    protected setShadowMapViewerTexture(): void {
        (this._shadowMapPlane.material as StandardMaterial).diffuseTexture = 
            this._csmActiveCascade !== CSMShadowGenerator.CASCADE_ALL && this._shadowMapFilter !== ShadowGenerator.FILTER_PCF ? this.getCSMGenerator().getShadowMaps()[this._csmActiveCascade] : null;
    }

    protected createShadowGenerator(): void {
        super.createShadowGenerator();

        const shadowGenerator = this.getCSMGenerator();

        shadowGenerator.stabilizeCascades = this._csmStabilizeCascades;
        shadowGenerator.depthClamp = this._csmDepthClamp;
        shadowGenerator.lambda = this._csmLambda;
        shadowGenerator.freezeShadowCastersBoundingInfo = true;

        shadowGenerator.activeCascade = this._csmActiveCascade;

        this.setShadowMapViewerTexture();
    }

    public render(): void {
        this.scene.render();
    }

}
