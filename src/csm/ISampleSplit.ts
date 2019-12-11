import {
    Color3,
    Vector3
} from "babylonjs";

import Split from "../Split";
import { ISceneDescription } from "./GlobalGUI";

export default interface ISampleSplit extends Split {

    initialize(scene: ISceneDescription, ambientColor: Color3, sunDir: Vector3): Promise<ISampleSplit>;

    sceneName: string;
    animateLight: boolean;
    lightColor: string;
    lightDirection: Vector3;

    shadowMapSize: number;
    shadowMapFilter: number;
}
