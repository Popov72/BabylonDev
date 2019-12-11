import {
    Color3,
    Matrix,
    Nullable,
    Observer,
    Quaternion,
    Scene,
    ShadowGenerator,
    UniversalCamera,
    Vector3,
} from "babylonjs";

import Sample from "../Sample";
import Split from "../Split";
import Utils from "../Utils";
import ISampleSplit from "./ISampleSplit";
import { ISceneDescription } from "./GlobalGUI";

export default class SplitBase extends Split implements ISampleSplit {

    protected _sunDir: Vector3;
    protected _sceneName: string;
    protected _sunColor: Color3;
    protected _animateLight: boolean;
    protected _rotateLightObservable: Nullable<Observer<Scene>>;
    protected _shadowMapSize: number;
    protected _shadowMapFilter: number;

    constructor(scene: Scene, camera: UniversalCamera, parent: Sample, name: string) {
        super(scene, camera, parent, name);

        this._sunDir = new Vector3();
        this._sunColor = new Color3();
        this._sceneName = "";
        this._animateLight = false;
        this._rotateLightObservable = null;
        this._shadowMapSize = 1024;
        this._shadowMapFilter = ShadowGenerator.FILTER_PCF;
    }

    public initialize(scene: ISceneDescription, ambientColor: Color3, sunDir: Vector3): Promise<ISampleSplit> {
        return Promise.resolve(this);
    }

    public get sceneName(): string {
        return this._sceneName;
    }

    public get animateLight(): boolean {
        return this._animateLight;
    }

    public set animateLight(al: boolean) {
        if (this._rotateLightObservable && !al) {
            this.scene.onBeforeRenderObservable.remove(this._rotateLightObservable);
            this._rotateLightObservable = null;
        }

        this._animateLight = al;

        if (!this._rotateLightObservable && al) {
            this._rotateLightObservable = this.scene.onBeforeRenderObservable.add(this.rotateLight.bind(this));
        }

        if (this._animateLight) {
            this.setDirectionFromSibling();
        }
    }

    protected setDirectionFromSibling(): void {
        for (let i = 0; i < this._container.splits.length; ++i) {
            const ssplit = this._container.splits[i] as SplitBase;

            if (ssplit !== this && ssplit.animateLight && ssplit.group === this.group) {
                this.lightDirection = ssplit.lightDirection.clone();
                break;
            }
        }
    }

    protected rotateLight(): void {
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

        let matrix = new Matrix();

        let rotY = Utils.XMScalarModAngle(deltaTime * 0.25);

        let rotation = Quaternion.RotationAxis(new Vector3(0.0, 1.0, 0.0), rotY);

        Matrix.FromQuaternionToRef(rotation, matrix);
        Vector3.TransformCoordinatesToRef(this._sunDir, matrix, this._sunDir);
    }

    public get lightColor(): string {
        return this._sunColor.toHexString();
    }

    public set lightColor(lc: string) {
        this._sunColor = Color3.FromHexString(lc);
    }

    public get lightDirection(): Vector3 {
        return this._sunDir;
    }

    public set lightDirection(ld: Vector3) {
        this._sunDir = ld;
    }

    public get shadowMapSize(): number {
        return this._shadowMapSize;
    }

    public set shadowMapSize(sms: number) {
        this._shadowMapSize = sms;
    }

    public get shadowMapFilter(): number {
        return this._shadowMapFilter;
    }

    public set shadowMapFilter(smf: number) {
        this._shadowMapFilter = smf;
    }

}
