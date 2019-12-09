import * as React from "react";

import {
    Button,
    Grid,
    MenuItem,
    Paper,
    Select,
} from '@material-ui/core';

import {
    makeStyles,
} from '@material-ui/core/styles';

import {
    Engine,
    Scene,
    UniversalCamera,
    Vector3,
    Viewport,
    Color4,
} from "babylonjs";

import GUI, { enumDefaultPosition } from "./GUI";
import Split from "./Split";

const cameraSpeed = 5,
      shiftMultiplier = 3;

export enum enumSplitMode {
    SIDE_BY_SIDE,
    LINEAR
}

export interface ISampleDescription {
    displayName: string;
    description: string;
    class: typeof Sample;
}

export default class Sample extends GUI {

    protected static _sampleList: Map<string, ISampleDescription> = new Map();

    protected _engine:          Engine;
    protected _canvas:          HTMLCanvasElement;
    protected _mapKeys:         Map<String, boolean>;
    protected _clearColor:      Color4;
    protected _cameraSpeed:     number;
    protected _useStyles:       any;

    protected _splits:          Array<Split>;
    protected _splitMode:       enumSplitMode;
    protected _splitClasses:    Map<string, typeof Split>;
    protected _splitType:       string | null;

    public static get sampleList(): Map<string, ISampleDescription> {
        return Sample._sampleList;
    }

    public static registerSampleClass(name: string, sample: ISampleDescription): void {
        Sample._sampleList.set(name, sample);
    }

    public static createSample(name: string, engine: Engine, canvas: HTMLCanvasElement): Sample | null {
        const sampleDescr = Sample._sampleList.get(name);

        if (sampleDescr) {
            const sample = new sampleDescr.class(engine, canvas);

            sample.create();

            return sample;
        }

        return null;
    }

    constructor(engine: Engine, canvas: HTMLCanvasElement) {
        super("Global settings", engine);

        this._engine = engine;
        this._canvas = canvas;
        this._mapKeys = new Map<String, boolean>();
        this._clearColor = new Color4(0, 0, 0, 1);
        this._cameraSpeed = cameraSpeed;

        this._splits = [];
        this._splitMode = enumSplitMode.LINEAR;
        this._splitClasses = new Map();
        this._splitType = null;

        this.dimensions.width = 250;
        this.dimensions.height = 184;
        this.showCloseButton = false;
        this.defaultPosition = enumDefaultPosition.TOP_LEFT;

        (window as any).__sample = this;
        (window as any).__ss = this._splits;
    }

    public get splitNumber(): number {
        return this._splits.length;
    }

    public createNewSplit(): void {
        if (this._splitClasses.size === 0) {
            return;
        }

        this.addSplit(this._splitClasses.keys().next().value, "");
    }

    public onBeforeRender(deltaTime: number): void {
        this._splits.forEach((split) => {
            const camera = split.camera;

            camera.speed = this._cameraSpeed * (this._mapKeys.get('Shift') ? shiftMultiplier : 1);

            if (this._mapKeys.get(' ')) {
                camera.cameraDirection = new Vector3(0, this._cameraSpeed / 5, 0);
            }

            if (this._mapKeys.get('x')) {
                camera.cameraDirection = new Vector3(0, -this._cameraSpeed / 5, 0);
            }
        });

        if (this._mapKeys.get("+")) {
            this._mapKeys.set("+", false);
            this.createNewSplit();
        }

        if (this._mapKeys.get("-")) {
            this._mapKeys.set("-", false);
            this._splits.forEach((split) => {
                split.toggleGUI();
            });
            if (this._mapKeys.get("Shift")) {
                this.toggleGUI();
            }
        }

        if (this._mapKeys.get("/")) {
            this._mapKeys.set("/", false);
            this._splitMode = this._splitMode === enumSplitMode.LINEAR ? enumSplitMode.SIDE_BY_SIDE : enumSplitMode.LINEAR;
        }
    }

    public render(): void {
        const w = this._engine.getRenderWidth(),
              h = this._engine.getRenderHeight(),
              stepx = w / this._splits.length;

        for (let i = 0; i < this._splits.length; ++i) {
            const split = this._splits[i];

            split.scene.autoClear = (i == 0);

            switch (this._splitMode) {
                case enumSplitMode.SIDE_BY_SIDE:
                    split.camera.viewport = new Viewport(i / this._splits.length, 0, 1 / this._splits.length, 1);
                    break;
                case enumSplitMode.LINEAR:
                    split.camera.viewport = new Viewport(0, 0, 1, 1);
                    if (this._splits.length > 1) {
                        split.scene.onBeforeDrawPhaseObservable.addOnce(() => {
                            this._engine.enableScissor(stepx * i, 0, stepx * (i + 1), h);
                        });
                        split.scene.onAfterDrawPhaseObservable.addOnce(() => {
                            this._engine.disableScissor();
                        });
                    }
                    break;
            }

            if (split.isLoading) {
                this._engine.scissorClear(stepx * i, 0, stepx * (i + 1), h, this._clearColor);
            } else {
                split.render();
            }
        }

    }

    protected create(): void {
    }

    protected resyncCameras(): void {
        const groups = new Map<number, UniversalCamera>();

        for (let i = 0; i < this._splits.length; ++i) {
            const split = this._splits[i],
                  scamera = split.camera;

            const camera = groups.get(split.group);
            if (!camera) {
                groups.set(split.group, scamera);
                scamera.update();
                continue;
            }

            scamera.speed = camera.speed;
            scamera.position = camera.position.clone();
            scamera.rotation = camera.rotation.clone();
            scamera.cameraDirection = camera.cameraDirection.clone();
            scamera.cameraRotation = camera.cameraRotation.clone();
        }
    }

    protected registerClass(splitClassName: string, splitClass: typeof Split): void {
        this._splitClasses.set(splitClassName, splitClass);
    }

    public addSplit(splitClassName: string, splitName: string, attachControls: boolean = true, createGUI: boolean = true): Split | null {
        const splitClass = this._splitClasses.get(splitClassName);

        if (!splitClass) {
            return null;
        }
        let [scene, camera] = this.createSceneAndCamera(attachControls);

        const split = new splitClass(scene, camera, this, splitName);

        this._splits.push(split);

        if (createGUI) {
            split.createGUI();
        }

        window.setTimeout(() => window.dispatchEvent(new Event('split_added')), 16); // let the time to the GUI to render before sending the event

        return split;
    }

    public getSplitBounds(index: number | Split): { x: number, y: number, w: number, h: number } {
        let splitIdx: number = 0;

        if (typeof(index) == 'number') {
            splitIdx = index;
        } else {
            splitIdx = this._splits.indexOf(index);
        }

        if (splitIdx < 0) {
            return { x: 0, y: 0, w: 0, h: 0 };
        }

        let screenWidth = this._engine.getRenderWidth(),
            screenHeight = this._engine.getRenderHeight(),
            w = screenWidth / this._splits.length;

        return {
            x: splitIdx * screenWidth / this._splits.length,
            y: 0,
            w: w,
            h: screenHeight
        };
    }

    public removeSplit(index: number | Split): Split | null {
        let split: Split | null = null;

        if (typeof(index) == 'number') {
            split = this._splits.splice(index, 1)[0];
        } else {
            const idx = this._splits.indexOf(index);
            if (idx !== -1) {
                split = this._splits.splice(idx, 1)[0];
            }
        }

        if (split) {
            split.removeGUI();
        }

        window.dispatchEvent(new Event('split_removed'));

        return split;
    }

    protected attachControlToAllCameras(): void {
        this._splits.forEach((split) => {
            const camera = split.camera;

            camera.attachControl(this._canvas, true);
        });
    }

    protected detachControlFromAllCameras(): void {
        this._splits.forEach((split) => {
            const camera = split.camera;

            camera.detachControl(this._canvas);
        });
    }

    protected createSceneAndCamera(attachControls: boolean = true): [Scene, UniversalCamera] {
        const scene = new Scene(this._engine);
        const camera = new UniversalCamera("camera" + this._splits.length, new Vector3(0, 5, -10), scene);

        camera.fov = Math.PI / 4;
        camera.setTarget(Vector3.Zero());

        camera.inertia = 0;
        camera.angularSensibility = 500;

        camera.keysUp.push(90); // Z
        camera.keysDown.push(83); // S
        camera.keysLeft.push(81); // Q
        camera.keysRight.push(68); // D

        scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    this._mapKeys.set(kbInfo.event.key, true);
                    break;
                case BABYLON.KeyboardEventTypes.KEYUP:
                    this._mapKeys.set(kbInfo.event.key, false);
                    break;
            }
        });

        this.enablePointerLock(scene);

        if (attachControls) {
            camera.attachControl(this._canvas, true);
        }

        scene.activeCamera = camera;

        return [scene, camera];
    }

    protected enablePointerLock(scene: Scene): void {
        let locked = false;

        scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    if (pointerInfo.event.button == 2) {
                        if (!locked) {
                            locked = true;
                            this._canvas.requestPointerLock = this._canvas.requestPointerLock || this._canvas.msRequestPointerLock || this._canvas.mozRequestPointerLock || this._canvas.webkitRequestPointerLock;
                            if (this._canvas.requestPointerLock) {
                                this.detachControlFromAllCameras();
                                this._canvas.requestPointerLock();
                                window.setTimeout(() => this.attachControlToAllCameras(), 100);
                            }
                        } else {
                            this.detachControlFromAllCameras();
                            document.exitPointerLock();
                            locked = false;
                            window.setTimeout(() => this.attachControlToAllCameras(), 100);
                        }
                    }
                    break;
            }
        });
    }

    protected handleEvent(event: Event): boolean {
        return false;
    }

    protected createCustomGUI(): React.ReactElement {
        this._useStyles = makeStyles((theme) => ({
            propertyTitle: {
              padding: '4px 0px 4px 8px',
              textAlign: 'left',
              color: 'white',
              whiteSpace: 'nowrap',
              marginBottom: theme.spacing(0),
              textShadow: '1px 1px black',
            },
            propertyValue: {
                padding: '4px 4px 4px 4px',
                textAlign: 'left',
                color: '#00ff00',
                whiteSpace: 'nowrap',
                marginBottom: theme.spacing(0),
                backgroundColor: '#1565c060',
                textShadow: 'none',
            },
            subPropertyTitle: {
                padding: '2px 0px 2px 20px',
                textAlign: 'left',
                color: 'white',
                whiteSpace: 'nowrap',
                marginBottom: theme.spacing(0),
                textShadow: '1px 1px black',
            },
        }));

        const Properties = () => {
            const classes = this._useStyles();
            const [splitLayout, setSplitLayout] = React.useState(this._splitMode);
            const [splitType, setSplitType] = React.useState(this._splitType);

            const changeSplitLayout = (event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>, child: React.ReactNode) => {
                this._splitMode = event.target.value as number;
                setSplitLayout(this._splitMode);
            };

            const changeSplitType = (event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>, child: React.ReactNode) => {
                this._splitType = event.target.value as string;
                setSplitType(this._splitType);
            };

            return (
                <Grid container spacing={1}>
                    <Grid item xs={6}>
                        <Paper className={classes.propertyTitle}>Split layout</Paper>
                    </Grid>
                    <Grid item xs={6}>
                        <Select
                            className={classes.propertyValue}
                            id="splitlayout"
                            value={splitLayout}
                            onChange={changeSplitLayout}
                            >
                            <MenuItem value={enumSplitMode.SIDE_BY_SIDE}>Side by side</MenuItem>
                            <MenuItem value={enumSplitMode.LINEAR}>Linear</MenuItem>
                        </Select>
                    </Grid>
                    <Grid item xs={6}>
                        <Paper className={classes.propertyTitle}>Split type</Paper>
                    </Grid>
                    <Grid item xs={6}>
                        <Select
                            className={classes.propertyValue}
                            id="splittype"
                            value={splitType}
                            onChange={changeSplitType}
                            >
                            { Array.from(this._splitClasses.keys()).map((name) => {
                                const stype = this._splitClasses.get(name)!;
                                return (
                                    <MenuItem key={name} value={name}>{stype.className}</MenuItem>
                                );
                            }) }
                        </Select>
                    </Grid>
                    {this.createCustomGlobalGUIProperties()}
                    <Grid item xs={12} style={{ textAlign: 'center', marginTop: '8px' }}>
                        <Button variant="contained" color="primary" onClick={this.createNewSplit.bind(this)}>
                            Create Split
                        </Button>
                    </Grid>
                </Grid>
            );
        };

        return Properties();
    }

    protected createCustomGlobalGUIProperties(): React.ReactElement {
        return (
            <React.Fragment>
            </React.Fragment>
        );
    }

}
