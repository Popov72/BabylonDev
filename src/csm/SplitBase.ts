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
    protected _cameraNearPlane: number;
    protected _cameraFarPlane: number;
    protected _sunColor: Color3;
    protected _animateLight: boolean;
    protected _lightNearPlane: number;
    protected _lightFarPlane: number;
    protected _rotateLightObservable: Nullable<Observer<Scene>>;
    protected _shadowMapSize: number;
    protected _shadowMapFilter: number;
    protected _shadowMapBias: number;
    protected _shadowMapNormalBias: number;
    protected _shadowMapDarkness: number;
    protected _shadowMapQuality: number;
    protected _shadowMapDepthScale: number;
    protected _shadowMapBlurScale: number;
    protected _shadowMapUseKernelBlur: boolean;
    protected _shadowMapBlurKernel: number;
    protected _shadowMapBlurBoxOffset: number;

    constructor(scene: Scene, camera: UniversalCamera, parent: Sample, name: string) {
        super(scene, camera, parent, name);

        this._sunDir = new Vector3();
        this._sunColor = new Color3();
        this._sceneName = "";
        this._cameraNearPlane = 0.25;
        this._cameraFarPlane = 250;
        this._animateLight = false;
        this._lightNearPlane = -90;
        this._lightFarPlane = 130;
        this._rotateLightObservable = null;
        this._shadowMapSize = 1024;
        this._shadowMapFilter = ShadowGenerator.FILTER_PCF;
        this._shadowMapBias = 0.007;
        this._shadowMapNormalBias = 0;
        this._shadowMapDarkness = 0;
        this._shadowMapQuality = ShadowGenerator.QUALITY_MEDIUM;
        this._shadowMapDepthScale = 25;
        this._shadowMapBlurScale = 2;
        this._shadowMapUseKernelBlur = true;
        this._shadowMapBlurKernel = 1;
        this._shadowMapBlurBoxOffset = 1;
    }

    public render(): void {
        const sky = this.scene.getMeshByName("skyBox");
        if (sky) {
            sky.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
        }

        super.render();
    }

    public initialize(scene: ISceneDescription, ambientColor: Color3, sunDir: Vector3): Promise<ISampleSplit> {
        return Promise.resolve(this);
    }

    public get sceneName(): string {
        return this._sceneName;
    }

    public get cameraNearPlane(): number {
        return this._cameraNearPlane;
    }

    public set cameraNearPlane(cnp: number) {
        this._cameraNearPlane = cnp;
        this.camera.minZ = cnp;
    }

    public get cameraFarPlane(): number {
        return this._cameraFarPlane;
    }

    public set cameraFarPlane(cfp: number) {
        this._cameraFarPlane = cfp;
        this.camera.maxZ = cfp;
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

    public get shadowMapBias(): number {
        return this._shadowMapBias;
    }

    public set shadowMapBias(smb: number) {
        this._shadowMapBias = smb;
    }

    public get shadowMapNormalBias(): number {
        return this._shadowMapNormalBias;
    }

    public set shadowMapNormalBias(smnb: number) {
        this._shadowMapNormalBias = smnb;
    }

    public get shadowMapDarkness(): number {
        return this._shadowMapDarkness;
    }

    public set shadowMapDarkness(smd: number) {
        this._shadowMapDarkness = smd;
    }

    public get shadowMapQuality(): number {
        return this._shadowMapQuality;
    }

    public set shadowMapQuality(smq: number) {
        this._shadowMapQuality = smq;
    }

    public get shadowMapDepthScale(): number {
        return this._shadowMapDepthScale;
    }

    public set shadowMapDepthScale(smds: number) {
        this._shadowMapDepthScale = smds;
    }

    public get shadowMapBlurScale(): number {
        return this._shadowMapBlurScale;
    }

    public set shadowMapBlurScale(smbs: number) {
        this._shadowMapBlurScale = smbs;
    }

    public get shadowMapUseKernelBlur(): boolean {
        return this._shadowMapUseKernelBlur;
    }

    public set shadowMapUseKernelBlur(smukb: boolean) {
        this._shadowMapUseKernelBlur = smukb;
    }

    public get shadowMapBlurKernel(): number {
        return this._shadowMapBlurKernel;
    }

    public set shadowMapBlurKernel(smbk: number) {
        this._shadowMapBlurKernel = smbk;
    }

    public get shadowMapBlurBoxOffset(): number {
        return this._shadowMapBlurBoxOffset;
    }

    public set shadowMapBlurBoxOffset(smbbo: number) {
        this._shadowMapBlurBoxOffset = smbbo;
    }

    public get lightNearPlane(): number {
        return this._lightNearPlane;
    }

    public set lightNearPlane(lnp: number) {
        this._lightNearPlane = lnp;
    }

    public get lightFarPlane(): number {
        return this._lightFarPlane;
    }

    public set lightFarPlane(lfp: number) {
        this._lightFarPlane = lfp;
    }

}
