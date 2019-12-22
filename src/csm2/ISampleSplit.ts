import {
    Color3,
    Mesh,
    Vector3
} from "babylonjs";

import Split from "../Split";
import { ISceneDescription } from "./GlobalGUI";

export default interface ISampleSplit extends Split {

    initialize(scene: ISceneDescription, ambientColor: Color3, sunDir: Vector3): Promise<ISampleSplit>;

    sceneName: string;
    cameraNearPlane: number;
    cameraFarPlane: number;

    animateLight: boolean;
    lightColor: string;
    lightDirection: Vector3;
    autoCalcShadowZBounds: boolean;
    lightNearPlane: number;
    lightFarPlane: number;
    showLightHelper: boolean;

    shadowMapPlane: Mesh;

    shadowMapShowDepthMap: boolean;
    shadowMapSize: number;
    shadowMapBias: number;
    shadowMapNormalBias: number;
    shadowMapDarkness: number;

    shadowMapFilter: number;
    shadowMapQuality: number;
    shadowMapDepthScale: number;
    shadowMapBlurScale: number;
    shadowMapUseKernelBlur: boolean;
    shadowMapBlurKernel: number;
    shadowMapBlurBoxOffset: number;
    shadowMapLightSizeUVRatio: number;

    csmNumCascades: number;
    csmActiveCascade: number;
    csmVisualizeCascades: boolean;
    csmStabilizeCascades: boolean;
    csmDepthClamp: boolean;
    csmLambda: number;

}
