import {
    Engine,
    Matrix,
    Scene,
    UniversalCamera,
    Vector3,
    Viewport,
    Color4,
} from "babylonjs";

import Split from "Split";

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

    protected _splits:          Array<Split>;
    protected _splitMode:       enumSplitMode;
    protected _splitClasses:    Map<string, typeof Split>;

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

        this._splits = [];
        this._splitMode = enumSplitMode.LINEAR;
        this._splitClasses = new Map();

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

        if (this._mapKeys.get("-") && this._splits.length > 1) {
            this._mapKeys.set("-", false);
            const split = this.removeSplit(this._splits.length - 1);
            if (split) {
                split.scene.dispose();
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

    public addSplit(splitClassName: string, splitName: string, attachControls: boolean = true): Split | null {
        const splitClass = this._splitClasses.get(splitClassName);

        if (!splitClass) {
            return null;
        }
        let [scene, camera] = this.createSceneAndCamera(attachControls);

        const split = new splitClass(scene, camera, this, splitName);

        this._splits.push(split);

        split.createGUI();

        scene.onBeforeRenderObservable.add(() => {
            let splitIdx = this._splits.indexOf(split) + 1,
                screenWidth = this._engine.getRenderWidth(),
                splitWidth = split.guiWidth,
                elem = jQuery('#' + split.guiID);

            elem.css('width', splitWidth + 'px');
            elem.css('top', '2px');
            elem.css('left', splitIdx * screenWidth / this._splits.length - splitWidth - 2 + 'px');
        });

        return split;
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

}
