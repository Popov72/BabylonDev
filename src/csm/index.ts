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
import Split from "../Split";
import Utils from "../Utils";
import ISampleSplit from "./ISampleSplit";

import StandardShadow from "./StandardShadow";
import CSM from "./CSM";

export default class CSMSample extends Sample {

    protected _sunDir:          Vector3;
    protected _ambientColor:    Color3;
    protected _global:          any;

    constructor(engine: Engine, canvas: HTMLCanvasElement) {
        super(engine, canvas);

        this._sunDir = new Vector3(32, -30, 22);
        this._ambientColor = new Color3(0.3, 0.3, 0.3);
        this._clearColor = new Color4(0.17773, 0.41797, 0.65234, 1);
        this._global = {
            "scenes": [
                {
                    "dname": "Power Plant",
                    "path": "./resources/3d/powerplant/",
                    "name": "powerplant.obj",
                    "backfaceCulling": false,  // Some meshes have incorrect winding orders... use no backface culling for now
                    "camera": {
                        "position": new Vector3(40, 5, 5),
                        "target": new Vector3(0, 5, 5),
                    },
                    "scaling": 0.5,
                    "sunColor": new Color3(1, 1, 1),
                },
                {
                    "dname": "Tower",
                    "path": "./resources/3d/Tower/",
                    "name": "Tower.obj",
                    "backfaceCulling": true,
                    "camera": {
                        "position": new Vector3(40, 5, 5),
                        "target": new Vector3(0, 5, 5),
                    },
                    "scaling": 0.025,
                    "sunColor": new Color3(1, 0.8, 0.5),
                }/*,
                {
                    "dname": "Dude",
                    "path": "./resources/3d/Dude/",
                    "name": "dude.babylon",
                    "backfaceCulling": true,
                    "camera": {
                        "position": new Vector3(0, 76, 154),
                        "target": new Vector3(0, 0, 0),
                    },
                    "scaling": 0.25,
                }*/,
                {
                    "dname": "Columns",
                    "path": "./resources/3d/Columns/",
                    "name": "Columns.obj",
                    "backfaceCulling": true,
                    "camera": {
                        "position": new Vector3(40, 5, 5),
                        "target": new Vector3(0, 5, 5),
                    },
                    "scaling": 0.25,
                    "sunColor": new Color3(1, 0.8, 0.5),
                }
            ],
            "selectedSplitType": "csm",
            "selectedScene": 0,
            "splitMode": enumSplitMode.LINEAR,
            "animateLight": false,
        };

        this._splitMode = this._global.splitMode;

        this.registerClass("std", StandardShadow);
        this.registerClass("csm", CSM);
    }

    protected showGlobalGUI(): void {
        let osplittypes = '<select name="splittype" id="splittype">';
        for (let stype of this._splitClasses) {
            const sel = stype[0] === this._global.selectedSplitType ? ' selected="selected" ' : '';
            osplittypes += '<option value="' + stype[0] + '"' + sel + '>' + stype[1].className + '</option>';
        }
        osplittypes += '</select>';

        let oscenes = '<select name="scene" id="scene">';
        this._global.scenes.forEach((scene: any, idx: number) => {
            const sel = idx === this._global.selectedScene ? ' selected="selected" ' : '';
            oscenes += '<option value="' + idx + '"' + sel + '>' + scene.dname + '</option>';
        });
        oscenes += '</select>';

        let oaddscene = '<button id="addscene">+</button>';

        const splitModes = [{ "val": enumSplitMode.LINEAR, "name": "Linear" }, { "val": enumSplitMode.SIDE_BY_SIDE, "name": "Side by Side" }];
        let osplitmode = '<select name="splitmode" id="splitmode">';
        splitModes.forEach((sm) => {
            const sel = sm.val === this._global.splitMode ? ' selected="selected" ' : '';
            osplitmode += '<option value="' + sm.val + '"' + sel + '>' + sm.name + '</option>';
        });
        osplitmode += '</select>';

        let ocont = jQuery('<div id="globalgui">' +
            '<div id="fps2"></div>' +
            '<div>Split ' + osplittypes + oscenes + oaddscene + '</div>' +
            '<div>Split mode ' + osplitmode + '</div>' +
            '<div>Animate light <input type="checkbox" name="animatelight" id="animatelight"></input></div>' +
            '</div>'
        ).css('position', 'absolute').css('left', '2px').css('top', '2px').css('z-index', '10');

        jQuery(document.body).append(ocont);

        jQuery('#globalgui').css('background-color', '#00FF00A0').css('color', 'black').css('padding', '6px').css('border', '1px solid black');

        jQuery('#splittype').on('change', () => {
            let o = jQuery('#splittype');
            this._global.selectedSplitType = o.prop('value');
        });

        jQuery('#scene').on('change', () => {
            let o = jQuery('#scene');
            this._global.selectedScene = parseInt(o.prop('value'));
        });

        jQuery('#animatelight').on('click', () => {
            let o = jQuery('#animatelight');
            this._global.animateLight = o.prop('checked');
        });

        jQuery('#addscene').on('click', () => {
            this.createNewSplit();
        });

        jQuery('#splitmode').on('change', () => {
            let o = jQuery('#splitmode');
            this._global.splitMode = parseInt(o.prop('value'));
            this._splitMode = this._global.splitMode;
        });
    }

    protected create(): void {
        Promise.all([this.createNewSplit()]).then(() => {
            SceneLoader.ShowLoadingScreen = false;
            this.showGlobalGUI();
        });
    }

    public async createNewSplit() {
        this.detachControlFromAllCameras();

        let split = this.addSplit(this._global.selectedSplitType, this._splitClasses.get(this._global.selectedSplitType)!.className, false) as ISampleSplit,
            camera = split.camera;

        const gscene = this._global.scenes[this._global.selectedScene];

        split.group = this._global.selectedScene;
        split.isLoading = true;

        camera.position = gscene.camera.position;
        camera.setTarget(gscene.camera.target);

        return split.initialize(gscene.path, gscene.name, this._ambientColor, this._sunDir.clone(), gscene.sunColor.clone(), gscene.backfaceCulling, gscene.scaling).then(() => {
            split.isLoading = false;
            this.resyncCameras();
            this.attachControlToAllCameras();
        });
    }

    public render(): void {
        super.render();

        jQuery('#fps2').html(this._engine.getFps().toFixed() + " fps");
    }

    public onBeforeRender(deltaTime: number): void {
        super.onBeforeRender(deltaTime);

        if (this._global.animateLight) {
            let matrix = new Matrix();

            let rotY = Utils.XMScalarModAngle(deltaTime * 0.25);

            let rotation = Quaternion.RotationAxis(new Vector3(0.0, 1.0, 0.0), rotY);

            Matrix.FromQuaternionToRef(rotation, matrix);
            Vector3.TransformCoordinatesToRef(this._sunDir, matrix, this._sunDir);

            this._splits.forEach((split) => (split as ISampleSplit).updateLightDirection(this._sunDir));
        }
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
