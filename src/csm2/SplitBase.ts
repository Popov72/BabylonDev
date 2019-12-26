import {
    Color3,
    Effect,
    Engine,
    Matrix,
    Mesh,
    MeshBuilder,
    Nullable,
    Observer,
    Quaternion,
    Scene,
    ShaderMaterial,
    ShadowGenerator,
    StandardMaterial,
    UniversalCamera,
    Vector3,
} from "babylonjs";

import Sample, { enumSplitMode } from "../Sample";
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
    protected _autoCalcShadowZBounds: boolean;
    protected _lightNearPlane: number;
    protected _lightFarPlane: number;
    protected _showLightHelper: boolean;
    protected _rotateLightObservable: Nullable<Observer<Scene>>;
    protected _shadowMapPlane: Mesh;
    protected _shadowMapShowDepthMap: boolean;
    protected _showDepthMapObservable: Nullable<Observer<Scene>>;
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
    protected _shadowMapLightSizeUVRatio: number;

    protected _csmNumCascades: number;
    protected _csmActiveCascade: number;
    protected _csmVisualizeCascades: boolean;
    protected _csmStabilizeCascades: boolean;
    protected _csmDepthClamp: boolean;
    protected _csmLambda: number;
    protected _csmSplitBlendPercentage: number;
    protected _csmLightSizeCorrection: boolean;
    protected _csmDepthCorrection: boolean;
    protected _csmPenumbraDarkness: number;
    protected _csmShadowMaxZ: number;

    constructor(scene: Scene, camera: UniversalCamera, parent: Sample, name: string) {
        super(scene, camera, parent, name);

        this._sunDir = new Vector3();
        this._sunColor = new Color3();
        this._sceneName = "";
        this._cameraNearPlane = 0.25;
        this._cameraFarPlane = 250;
        this._animateLight = false;
        this._autoCalcShadowZBounds = false;
        this._lightNearPlane = -90;
        this._lightFarPlane = 130;
        this._showLightHelper = false;
        this._rotateLightObservable = null;
        this._shadowMapShowDepthMap = false;
        this._showDepthMapObservable = null;
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
        this._shadowMapLightSizeUVRatio = 0.01;

        this._csmNumCascades = 4;
        this._csmActiveCascade = 0;
        this._csmVisualizeCascades = false;
        this._csmStabilizeCascades = false;
        this._csmDepthClamp = false;
        this._csmLambda = 0.7;
        this._csmSplitBlendPercentage = 0.0;
        this._csmLightSizeCorrection = false;
        this._csmDepthCorrection = false;
        this._csmPenumbraDarkness = 1;
        this._csmShadowMaxZ = 250;

        this._shadowMapPlane = null as any;

        const size = 1;

        this._shadowMapPlane = MeshBuilder.CreatePlane(this.name + "_shadowmap", {
            "width": size,
            "height": size,
        }, this.scene);

        this._shadowMapPlane.position.x += size / 2;
        this._shadowMapPlane.position.y -= size / 2;
        this._shadowMapPlane.bakeCurrentTransformIntoVertices();
        this._shadowMapPlane.alwaysSelectAsActiveMesh = true;

        //const material = this.buildShaderMaterial();
        const material = new StandardMaterial(this.name + "_shadowmap_material", scene);

        material.emissiveColor = new Color3(1, 1, 1);
        material.disableLighting = true;
        material.depthFunction = Engine.ALWAYS;

        this._shadowMapPlane.material = material;

        this._shadowMapPlane.setEnabled(false);
    }

    protected buildShaderMaterial(): ShaderMaterial {
        Effect.ShadersStore["customVertexShader"]= `   
        precision highp float;

        attribute vec3 position;
        attribute vec2 uv;
        
        uniform mat4 world;
        uniform mat4 worldViewProjection;
        
        varying vec2 vUv;
        
        void main(void) {
            vUv = uv;
            gl_Position = worldViewProjection * vec4(position, 1.0);
        }
        `;        

        Effect.ShadersStore["customFragmentShader"]=`
        precision highp float;

        varying vec2 vUv;
    	uniform highp sampler2DArrayShadow textureSampler;
        
        void main(void) {
            float shadow = texelFetch(textureSampler, vUv, 0);
            gl_FragColor = shadow;//vec4(vec3(shadow), 1.0);
        }
        `;

        var mat = new ShaderMaterial("shader", this.scene, {
            vertex: "custom",
            fragment: "custom",
            },
            {
                attributes: ["position", "uv"],
                uniforms: ["world", "worldViewProjection"],
            }
        );

        return mat;
    }

    public render(): void {
        const sky = this.scene.getMeshByName("skyBox");
        if (sky) {
            sky.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
        }

        super.render();
    }

    public get shadowMapPlane(): Mesh {
        return this._shadowMapPlane;
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

        this.setDirectionFromSibling(this._animateLight);
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

    public get showLightHelper(): boolean {
        return this._showLightHelper;
    }

    public set showLightHelper(slh: boolean) {
        this._showLightHelper = slh;
    }

    public get shadowMapShowDepthMap(): boolean {
        return this._shadowMapShowDepthMap;
    }

    public set shadowMapShowDepthMap(smsdm: boolean) {
        if (this._shadowMapShowDepthMap && !smsdm) {
            this.scene.onBeforeRenderObservable.remove(this._showDepthMapObservable);
            this._showDepthMapObservable = null;
        }

        this._shadowMapShowDepthMap = smsdm;
        this._shadowMapPlane.setEnabled(smsdm);

        if (!this._showDepthMapObservable && smsdm) {
            this._showDepthMapObservable = this.scene.onBeforeRenderObservable.add(this.showDepthMap.bind(this));
        }
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

    public get shadowMapLightSizeUVRatio(): number {
        return this._shadowMapLightSizeUVRatio;
    }

    public set shadowMapLightSizeUVRatio(smlsuvr: number) {
        this._shadowMapLightSizeUVRatio = smlsuvr;
    }

    public get csmLightSizeCorrection(): boolean {
        return this._csmLightSizeCorrection;
    }

    public set csmLightSizeCorrection(smlsc: boolean) {
        this._csmLightSizeCorrection = smlsc;
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

    public get autoCalcShadowZBounds(): boolean {
        return this._autoCalcShadowZBounds;
    }

    public set autoCalcShadowZBounds(acszb: boolean) {
        this._autoCalcShadowZBounds = acszb;
    }

    public get csmNumCascades(): number {
        return this._csmNumCascades;
    }

    public set csmNumCascades(num: number) {
        this._csmNumCascades = num;
    }

    public get csmActiveCascade(): number {
        return this._csmActiveCascade;
    }

    public set csmActiveCascade(cac: number) {
        this._csmActiveCascade = cac;
    }

    public get csmVisualizeCascades(): boolean {
        return this._csmVisualizeCascades;
    }

    public set csmVisualizeCascades(cvc: boolean) {
        this._csmVisualizeCascades = cvc;
    }

    public get csmStabilizeCascades(): boolean {
        return this._csmStabilizeCascades;
    }

    public set csmStabilizeCascades(csc: boolean) {
        this._csmStabilizeCascades = csc;
    }

    public get csmDepthClamp(): boolean {
        return this._csmDepthClamp;
    }

    public set csmDepthClamp(cdc: boolean) {
        this._csmDepthClamp = cdc;
    }

    public get csmLambda(): number {
        return this._csmLambda;
    }

    public set csmLambda(cl: number) {
        this._csmLambda = cl;
    }

    public get csmSplitBlendPercentage(): number {
        return this._csmSplitBlendPercentage;
    }

    public set csmSplitBlendPercentage(csbp: number) {
        this._csmSplitBlendPercentage = csbp;
    }

    public get csmDepthCorrection(): boolean {
        return this._csmDepthCorrection;
    }

    public set csmDepthCorrection(smdc: boolean) {
        this._csmDepthCorrection = smdc;
    }

    public get csmPenumbraDarkness(): number {
        return this._csmPenumbraDarkness;
    }

    public set csmPenumbraDarkness(cpd: number) {
        this._csmPenumbraDarkness = cpd;
    }

    public get csmShadowMaxZ(): number {
        return this._csmShadowMaxZ;
    }

    public set csmShadowMaxZ(csmz: number) {
        this._csmShadowMaxZ = csmz;
    }

    protected setDirectionFromSibling(checkAnimate: boolean = true): void {
        for (let i = 0; i < this._container.splits.length; ++i) {
            const ssplit = this._container.splits[i] as SplitBase;

            if (ssplit !== this && (ssplit.animateLight === checkAnimate) && ssplit.group === this.group) {
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

        this.lightDirection = this._sunDir;
    }

    protected showDepthMap(): void {
        this.camera.getViewMatrix(); // make sure the transformation matrix we get when calling 'getTransformationMatrix()' is calculated with an up to date view matrix

        let invertCameraViewProj = Matrix.Invert(this.camera.getTransformationMatrix());

        let h = 256 / this.scene.getEngine().getRenderWidth(true);

        let pOfst = 0;

        if (this._container.splitMode === enumSplitMode.LINEAR) {
            let sidx = this._container.splits.indexOf(this),
                sw = 2 / this._container.splits.length;
            pOfst = sw * sidx + sw / 2 - h;
        } else {
            pOfst = 1 - h;
        }

        let p = new Vector3(-1, 1, -1 + 0.001);
        let q = new Vector3(-1 + h * 2, 1, -1 + 0.001);

        let pt = Vector3.TransformCoordinates(p, invertCameraViewProj);
        let qt = Vector3.TransformCoordinates(q, invertCameraViewProj);
        let d = qt.subtract(pt).length();

        this.shadowMapPlane.scaling = new Vector3(d, d, 1);

        p.x += pOfst;

        this.shadowMapPlane.rotation = this.camera.rotation;
        this.shadowMapPlane.position = Vector3.TransformCoordinates(p, invertCameraViewProj);
    }

}
