import * as React from "react";

import {
    Grid,
    MenuItem,
    Paper,
    Select,
} from '@material-ui/core';

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
    protected _selectedScene:   number;
    protected _scenes:          Array<any>;

    constructor(engine: Engine, canvas: HTMLCanvasElement) {
        super(engine, canvas);

        this._sunDir = new Vector3(32, -30, 22);
        this._ambientColor = new Color3(0.3, 0.3, 0.3);
        this._clearColor = new Color4(0.17773, 0.41797, 0.65234, 1);
        this._scenes = [
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
        ];

        this.registerClass("std", StandardShadow);
        this.registerClass("csm", CSM);

        this._splitMode = enumSplitMode.LINEAR;
        this._splitType = "csm";
        this._selectedScene = 0;

        let ocont = jQuery('<div id="fps2"></div>').css('position', 'absolute').css('left', '2px').css('top', '2px').css('z-index', '1');

        jQuery(document.body).append(ocont);
    }

    protected createCustomGlobalGUIProperties(): React.ReactElement {
        const classes = this._useStyles();
        const [scene, setScene] = React.useState(this._selectedScene);

        const changeScene = (event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>, child: React.ReactNode) => {
            this._selectedScene = event.target.value as number;
            setScene(this._selectedScene);
        };

        return (
            <React.Fragment>
                <Grid item xs={6}>
                    <Paper className={classes.propertyTitle}>Scene</Paper>
                </Grid>
                <Grid item xs={6}>
                    <Select
                        className={classes.propertyValue}
                        id="scene"
                        value={scene}
                        onChange={changeScene}
                        >
                        { this._scenes.map((scene: any, idx: number) => {
                            return (
                                <MenuItem key={idx} value={idx}>{scene.dname}</MenuItem>
                            );
                        }) }
                    </Select>
                </Grid>
            </React.Fragment>
        );
    }

    protected create(): void {
        Promise.all([this.createNewSplit()]).then(() => {
            SceneLoader.ShowLoadingScreen = false;
            this.createGUI();
        });
    }

    public async createNewSplit() {
        this.detachControlFromAllCameras();

        let split = this.addSplit(this._splitType!, this._splitClasses.get(this._splitType!)!.className, false) as ISampleSplit,
            camera = split.camera;

        split.showGUI(false);

        const gscene = this._scenes[this._selectedScene];

        split.group = this._selectedScene;
        split.isLoading = true;

        camera.position = gscene.camera.position;
        camera.setTarget(gscene.camera.target);

        return split.initialize(gscene.path, gscene.name, this._ambientColor, this._sunDir.clone(), gscene.sunColor.clone(), gscene.backfaceCulling, gscene.scaling).then(() => {
            split.isLoading = false;
            split.showGUI(true);
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

        /*if (this._global.animateLight) {
            let matrix = new Matrix();

            let rotY = Utils.XMScalarModAngle(deltaTime * 0.25);

            let rotation = Quaternion.RotationAxis(new Vector3(0.0, 1.0, 0.0), rotY);

            Matrix.FromQuaternionToRef(rotation, matrix);
            Vector3.TransformCoordinatesToRef(this._sunDir, matrix, this._sunDir);

            this._splits.forEach((split) => (split as ISampleSplit).updateLightDirection(this._sunDir));
        }*/
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
