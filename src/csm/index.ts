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

import Sample from "../Sample";
import Split from "../Split";
import Utils from "../Utils";
import ISampleSplit from "./ISampleSplit";

import StandardShadow from "./StandardShadow";
import CSM from "./CSM";

export default class CSMSample extends Sample {

    protected _sunDir:       Vector3;
    protected _ambientColor: Color3;
    protected _animateLight: boolean;

    constructor(engine: Engine, canvas: HTMLCanvasElement) {
        super(engine, canvas);

        this._sunDir = new Vector3(32, -30, 22);
        this._ambientColor = new Color3(0.3, 0.3, 0.3);
        this._animateLight = false;
        this._clearColor = new Color4(0.17773, 0.41797, 0.65234, 1);

        this.registerClass("std", StandardShadow);
        this.registerClass("csm", CSM);
    }

    protected create(): void {
        let splitStd = this.addSplit("std", "s1") as StandardShadow;

        splitStd.initialize("./resources/3d/powerplant/", "powerplant.obj", this._ambientColor, this._sunDir.clone());

        let splitCSM = this.addSplit("csm", "csm1") as CSM;

        splitCSM.initialize("./resources/3d/powerplant/", "powerplant.obj", this._ambientColor, this._sunDir.clone());
    }

    public createNewSplit(): void {
        SceneLoader.ShowLoadingScreen = false;

        this.detachControlFromAllCameras();

        let splitCSM = this.addSplit("csm", "csmx", false) as CSM;

        splitCSM.isLoading = true;

        splitCSM.initialize("./resources/3d/powerplant/", "powerplant.obj", this._ambientColor, this._sunDir.clone()).then(() => {
            this._resyncCameras = true;
            splitCSM.isLoading = false;
            this.attachControlToAllCameras();
        });
    }

    public onBeforeRender(deltaTime: number): void {
        super.onBeforeRender(deltaTime);

        if (this._animateLight) {
            let matrix = new Matrix();

            let rotY = Utils.XMScalarModAngle(deltaTime * 0.25);

            let rotation = Quaternion.RotationAxis(new Vector3(0.0, 1.0, 0.0), rotY);

            Matrix.FromQuaternionToRef(rotation, matrix);
            Vector3.TransformCoordinatesToRef(this._sunDir, matrix, this._sunDir);

            this._splitScreens.forEach((split) => (split as ISampleSplit).updateLightDirection(this._sunDir));
        }
    }

    protected createSceneAndCamera(attachControls: boolean): [Scene, UniversalCamera] {
        const [scene, camera] = super.createSceneAndCamera(attachControls);

        scene.ambientColor = new Color3(1, 1, 1);
        scene.clearColor = this._clearColor;
        scene.autoClear = false;

        camera.position.x = 100;
        camera.position.y = 5;
        camera.position.z = 5;

        camera.setTarget(Vector3.Zero());

        return [scene, camera];
    }

}

Sample.registerSampleClass("csm", {
    "displayName": "Implementation of the Cascaded Shadow Maps rendering technic",
    "description": "",
    "class": CSMSample,
});
