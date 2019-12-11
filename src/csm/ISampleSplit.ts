import {
    Color3,
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
    lightNearPlane: number;
    lightFarPlane: number;

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

}
