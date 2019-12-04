import {
    Color3,
    Vector3
} from "babylonjs";

import Split from "../Split";

export default interface ISampleSplit extends Split {

    initialize(scenePath: string, sceneName: string, ambientColor: Color3, sunDir: Vector3, backfaceCulling: boolean): Promise<ISampleSplit>;

    updateLightDirection(lightDir: Vector3): void;

}
