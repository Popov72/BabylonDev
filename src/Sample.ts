import {
    Engine,
    Scene,
    UniversalCamera,
    Vector3,
    Viewport,
    Color4,
} from "babylonjs";

import Split from "Split";

const cameraSpeed = 5,
      shiftMultiplier = 3;

enum enumSplitMode {
    SIDE_BY_SIDE,
    LINEAR
}

interface ISampleDescription {
    displayName: string;
    description: string;
    class: typeof Sample;
}

export default class Sample {

    protected static _sampleList: Map<string, ISampleDescription> = new Map();

    protected _engine:          Engine;
    protected _canvas:          HTMLCanvasElement;
    protected _mapKeys:         Map<String, boolean>;
    protected _cameras:         Array<UniversalCamera>;
    protected _clearColor:      Color4;
    protected _resyncCameras:   boolean;

    protected _splitScreens:    Array<Split>;
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
        this._cameras = [];
        this._clearColor = new Color4(0, 0, 0, 1);
        this._resyncCameras = false;

        this._splitScreens = [];
        this._splitMode = enumSplitMode.SIDE_BY_SIDE;
        this._splitClasses = new Map();

        (window as any).__sample = this;
        (window as any).__ss = this._splitScreens;
    }

    public createNewSplit(): void {
        if (this._splitClasses.size === 0) {
            return;
        }

        this.addSplit(this._splitClasses.keys().next().value, "");
    }

    public onBeforeRender(deltaTime: number): void {
        if (this._resyncCameras) {
            this._resyncCameras = false;
            if (this._cameras.length > 1) {
                const camera = this._cameras[0];
                camera.update();

                for (let i = 1; i < this._cameras.length; ++i) {
                    const scamera = this._cameras[i];
                    scamera.speed = camera.speed;
                    scamera.position = camera.position.clone();
                    scamera.rotation = camera.rotation.clone();
                    scamera.cameraDirection = camera.cameraDirection.clone();
                    scamera.cameraRotation = camera.cameraRotation.clone();
                }
            }
        }

        this._cameras.forEach((camera) => {
            camera.speed = cameraSpeed * (this._mapKeys.get('Shift') ? shiftMultiplier : 1);

            if (this._mapKeys.get(' ')) {
                camera.cameraDirection = new Vector3(0, 1, 0);
            }

            if (this._mapKeys.get('x')) {
                camera.cameraDirection = new Vector3(0, -1, 0);
            }
        });

        if (this._mapKeys.get("+")) {
            this._mapKeys.set("+", false);
            this.createNewSplit();
        }

        if (this._mapKeys.get("-") && this._splitScreens.length > 1) {
            this._mapKeys.set("-", false);
            const split = this.removeSplit(this._splitScreens.length - 1);
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
              stepx = w / this._splitScreens.length;

        for (let i = 0; i < this._splitScreens.length; ++i) {
            const split = this._splitScreens[i];

            switch (this._splitMode) {
                case enumSplitMode.SIDE_BY_SIDE:
                    split.camera.viewport = new Viewport(i / this._splitScreens.length, 0, 1 / this._splitScreens.length, 1);
                    break;
                case enumSplitMode.LINEAR:
                    split.camera.viewport = new Viewport(0, 0, 1, 1);
                    if (this._splitScreens.length > 1) {
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

    protected registerClass(splitClassName: string, splitClass: typeof Split): void {
        this._splitClasses.set(splitClassName, splitClass);
    }

    protected addSplit(splitClassName: string, splitName: string, attachControls: boolean = true): Split | null {
        const splitClass = this._splitClasses.get(splitClassName);

        if (!splitClass) {
            return null;
        }
        let [scene, camera] = this.createSceneAndCamera(attachControls);

        const split = new splitClass(scene, camera, splitName);

        this._splitScreens.push(split);

        return split;
    }

    protected removeSplit(index: number | Split): Split | null {
        if (typeof(index) == 'number') {
            return this._splitScreens.splice(index, 1)[0];
        } else {
            const idx = this._splitScreens.indexOf(index);
            if (idx !== -1) {
                return this._splitScreens.splice(idx, 1)[0];
            }
        }

        return null;
    }

    protected attachControlToAllCameras(): void {
        this._cameras.forEach((camera) => {
            camera.attachControl(this._canvas, true);
        });
    }

    protected detachControlFromAllCameras(): void {
        this._cameras.forEach((camera) => {
            camera.detachControl(this._canvas);
        });
    }

    protected createSceneAndCamera(attachControls: boolean = true): [Scene, UniversalCamera] {
        const scene = new Scene(this._engine);
        const camera = new UniversalCamera("camera" + this._cameras.length, new Vector3(0, 5, -10), scene);

        camera.fov = Math.PI / 4;
        camera.setTarget(Vector3.Zero());

        this._cameras.push(camera);

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
                                this._canvas.requestPointerLock();
                            }
                        } else {
                            document.exitPointerLock();
                            locked = false;
                        }
                    }
                    break;
            }
        });
    }

}
