import {
    Scene,
    Vector3,
    Color3,
    Color4,
    Quaternion,
    Matrix,
    SceneLoader,
    UniversalCamera,
    Engine,
} from "babylonjs";

import Sample, { enumSplitMode } from "../Sample";

import DepthNonLinearShader from "./DepthNonLinearShader";
import DepthLinearShader from "./DepthLinearShader";
import DepthLinearNoShader from "./DepthLinearNoShader";

export default class CSMSample extends Sample {

    constructor(engine: Engine, canvas: HTMLCanvasElement) {
        super(engine, canvas);

        this._clearColor = new Color4(51 / 255, 52 / 255, 75 / 255, 1);
        this._cameraSpeed = 2.5;
        this._splitMode = enumSplitMode.SIDE_BY_SIDE;

        this.registerClass("depth_nonlinear_shader", DepthNonLinearShader);
        this.registerClass("depth_linear_shader", DepthLinearShader);
        this.registerClass("depth_linear_noshader", DepthLinearNoShader);
    }

    protected create(): void {
        let split1 = this.addSplit("depth_nonlinear_shader", "Non linear depth") as DepthNonLinearShader;

        split1.initialize();

        let split2 = this.addSplit("depth_linear_shader", "Linear depth") as DepthLinearShader;

        split2.initialize();

        /*let split3 = this.addSplit("depth_linear_noshader", "s3") as DepthLinearNoShader;

        split3.initialize();*/
    }

    public createNewSplit(): void {
    }

    protected createSceneAndCamera(attachControls: boolean): [Scene, UniversalCamera] {
        const [scene, camera] = super.createSceneAndCamera(attachControls);

        scene.clearColor = this._clearColor;
        scene.autoClear = false;

        camera.angularSensibility = 1500;

        return [scene, camera];
    }

}

Sample.registerSampleClass("sketchfabmarkers", {
    "displayName": "Show front-facing markers as in Sketchfab",
    "description": "",
    "class": CSMSample,
});
