import {
    Engine,
    Scene,
    UniversalCamera,
    Vector3,
    Viewport,
    Color4,
} from "babylonjs";

import MainGUI from "./MainGUI";
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

export default class Sample {

    protected static _sampleList: Map<string, ISampleDescription> = new Map();

    protected _engine:          Engine;
    protected _canvas:          HTMLCanvasElement;
    protected _mapKeys:         Map<String, boolean>;
    protected _clearColor:      Color4;
    protected _cameraSpeed:     number;
    protected _gui:             MainGUI | null;

    public splits:          Array<Split>;
    public splitMode:       enumSplitMode;
    public splitClasses:    Map<string, typeof Split>;
    public splitType:       string | null;

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
        this._engine = engine;
        this._canvas = canvas;
        this._mapKeys = new Map<String, boolean>();
        this._clearColor = new Color4(0, 0, 0, 1);
        this._cameraSpeed = cameraSpeed;

        this.splits = [];
        this.splitMode = enumSplitMode.LINEAR;
        this.splitClasses = new Map();
        this.splitType = null;
        this._gui = null;

        (window as any).__sample = this;
        (window as any).__ss = this.splits;
    }

    public get splitNumber(): number {
        return this.splits.length;
    }

    public createNewSplit(): void {
        if (this.splitClasses.size === 0) {
            return;
        }

        this.addSplit(this.splitClasses.keys().next().value, "");
    }

    public onBeforeRender(deltaTime: number): void {
        this.splits.forEach((split) => {
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
            this.splits.forEach((split) => {
                split.toggleGUI();
            });
            if (this._mapKeys.get("Shift") && this._gui) {
                this._gui.toggleGUI();
            }
        }

        if (this._mapKeys.get("/")) {
            this._mapKeys.set("/", false);
            this.splitMode = this.splitMode === enumSplitMode.LINEAR ? enumSplitMode.SIDE_BY_SIDE : enumSplitMode.LINEAR;
        }
    }

    public render(): void {
        const w = this._engine.getRenderWidth(),
              h = this._engine.getRenderHeight(),
              stepx = w / this.splits.length;

        for (let i = 0; i < this.splits.length; ++i) {
            const split = this.splits[i];

            split.scene.autoClear = (i == 0);

            switch (this.splitMode) {
                case enumSplitMode.SIDE_BY_SIDE:
                    split.camera.viewport = new Viewport(i / this.splits.length, 0, 1 / this.splits.length, 1);
                    break;
                case enumSplitMode.LINEAR:
                    split.camera.viewport = new Viewport(0, 0, 1, 1);
                    if (this.splits.length > 1) {
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

    public createGUI(): void {
        this._gui = new MainGUI("Global settings", this._engine, this);

        this._gui.createGUI();
    }

    protected create(): void {
    }

    protected resyncCameras(): void {
        const groups = new Map<number, UniversalCamera>();

        for (let i = 0; i < this.splits.length; ++i) {
            const split = this.splits[i],
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
        this.splitClasses.set(splitClassName, splitClass);
    }

    public addSplit(splitClassName: string, splitName: string, attachControls: boolean = true, createGUI: boolean = true): Split | null {
        const splitClass = this.splitClasses.get(splitClassName);

        if (!splitClass) {
            return null;
        }
        let [scene, camera] = this.createSceneAndCamera(attachControls);

        const split = new splitClass(scene, camera, this, splitName);

        this.splits.push(split);

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
            splitIdx = this.splits.indexOf(index);
        }

        if (splitIdx < 0) {
            return { x: 0, y: 0, w: 0, h: 0 };
        }

        let screenWidth = this._engine.getRenderWidth(),
            screenHeight = this._engine.getRenderHeight(),
            w = screenWidth / this.splits.length;

        return {
            x: splitIdx * screenWidth / this.splits.length,
            y: 0,
            w: w,
            h: screenHeight
        };
    }

    public removeSplit(index: number | Split): Split | null {
        let split: Split | null = null;

        if (typeof(index) == 'number') {
            split = this.splits.splice(index, 1)[0];
        } else {
            const idx = this.splits.indexOf(index);
            if (idx !== -1) {
                split = this.splits.splice(idx, 1)[0];
            }
        }

        if (split) {
            split.removeGUI();
        }

        window.dispatchEvent(new Event('split_removed'));

        return split;
    }

    protected attachControlToAllCameras(): void {
        this.splits.forEach((split) => {
            const camera = split.camera;

            camera.attachControl(this._canvas, true);
        });
    }

    protected detachControlFromAllCameras(): void {
        this.splits.forEach((split) => {
            const camera = split.camera;

            camera.detachControl(this._canvas);
        });
    }

    protected createSceneAndCamera(attachControls: boolean = true): [Scene, UniversalCamera] {
        const scene = new Scene(this._engine);
        const camera = new UniversalCamera("camera" + this.splits.length, new Vector3(0, 5, -10), scene);

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

}
