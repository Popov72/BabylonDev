import {
    Scene,
    Vector3,
    Color3,
    Color4,
    SceneLoader,
    UniversalCamera,
    Engine,
} from "babylonjs";

import Sample, { enumSplitMode } from "../Sample";
import ISampleSplit from "./ISampleSplit";

import GlobalGUI from "./GlobalGUI";
import StandardShadow from "./StandardShadow";
import CSM from "./CSM";

export default class CSMSample extends Sample {

    protected _sunDir:          Vector3;
    protected _ambientColor:    Color3;

    constructor(engine: Engine, canvas: HTMLCanvasElement) {
        super(engine, canvas);

        this._sunDir = new Vector3(32, -30, 22);
        this._ambientColor = new Color3(0.3, 0.3, 0.3);
        this._clearColor = new Color4(0.17773, 0.41797, 0.65234, 1);

        this.registerClass("std", StandardShadow);
        this.registerClass("csm", CSM);

        this.splitMode = enumSplitMode.LINEAR;
        this.splitType = "std";

        this._gui = new GlobalGUI("Global settings", this._engine, this);

        let ocont = jQuery('<div id="fps2"></div>').css('position', 'absolute').css('left', '2px').css('top', '2px').css('z-index', '201');

        jQuery(document.body).append(ocont);
    }

    protected create(): void {
        Promise.all([this.createNewSplit()]).then(() => {
            SceneLoader.ShowLoadingScreen = false;
            this.createGUI();
        });
    }

    public createGUI(): void {
        this._gui!.zIndex = 200;
        this._gui!.createGUI();
    }

    public async createNewSplit() {
        this.detachControlFromAllCameras();

        let split = this.addSplit(this.splitType!, this.splitClasses.get(this.splitType!)!.className, false, false) as ISampleSplit,
            camera = split.camera;

        const gscene = (this._gui as GlobalGUI)!.scenes[(this._gui as GlobalGUI).selectedScene];

        split.group = (this._gui as GlobalGUI).selectedScene;
        split.isLoading = true;

        camera.position = gscene.camera.position.clone();
        camera.setTarget(gscene.camera.target.clone());

        return split.initialize(gscene, this._ambientColor, this._sunDir.clone()).then(() => {
            split.isLoading = false;
            split.createGUI();
            this.resyncCameras();
            this.attachControlToAllCameras();
        });
    }

    public render(): void {
        super.render();

        jQuery('#fps2').html(this._engine.getFps().toFixed() + " fps");
    }

    protected createSceneAndCamera(attachControls: boolean): [Scene, UniversalCamera] {
        const [scene, camera] = super.createSceneAndCamera(attachControls);

        scene.ambientColor = new Color3(1, 1, 1);
        scene.clearColor = this._clearColor;

        camera.fov = Math.PI / 4 * 0.75;
        camera.minZ = 0.25;
        camera.maxZ = 250;

        return [scene, camera];
    }

}

Sample.registerSampleClass("csm", {
    "displayName": "Implementation of the Cascaded Shadow Maps rendering technic",
    "description": "",
    "class": CSMSample,
});
