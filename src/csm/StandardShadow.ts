import {
    Color3,
    DirectionalLight,
    Matrix,
    Mesh,
    Scene,
    ShadowGenerator,
    StandardMaterial,
    UniversalCamera,
    Vector3,
} from "babylonjs";

import Sample from "../Sample";
import Utils from "../Utils";
import ISampleSplit from "./ISampleSplit";
import { ISceneDescription } from "./GlobalGUI";
import SplitBase from "./SplitBase";
import StandardShadowGUI from "./StandardShadowGUI";

export default class StandardShadow extends SplitBase {

    public static className: string = "Standard";

    protected sun: DirectionalLight;
    protected _shadowGenerator: ShadowGenerator;

    constructor(scene: Scene, camera: UniversalCamera, parent: Sample, name: string) {
        super(scene, camera, parent, name);

        this.sun = null as any;
        this._shadowGenerator = null as any;
    }

    public get lightColor(): string {
        return this._sunColor.toHexString();
    }

    public set lightColor(lc: string) {
        this._sunColor = Color3.FromHexString(lc);
        this.sun.diffuse = this._sunColor;
    }

    public get lightDirection(): Vector3 {
        return this._sunDir;
    }

    public set lightDirection(ld: Vector3) {
        this._sunDir = ld;
        this.sun.direction = ld;
    }

    public get shadowMapSize(): number {
        return this._shadowMapSize;
    }

    public set shadowMapSize(sms: number) {
        this._shadowMapSize = sms;
        this.createShadowGenerator();
    }

    public get shadowMapFilter(): number {
        return this._shadowMapFilter;
    }

    public set shadowMapFilter(smf: number) {
        this._shadowGenerator.filter = smf;
        this._shadowMapFilter = this._shadowGenerator.filter;
    }

    public get shadowMapBias(): number {
        return this._shadowMapBias;
    }

    public set shadowMapBias(smb: number) {
        this._shadowMapBias = smb;
        this._shadowGenerator.bias = smb;
    }

    public get shadowMapNormalBias(): number {
        return this._shadowMapNormalBias;
    }

    public set shadowMapNormalBias(smnb: number) {
        this._shadowMapNormalBias = smnb;
        this._shadowGenerator.normalBias = smnb;
    }

    public get shadowMapDarkness(): number {
        return this._shadowMapDarkness;
    }

    public set shadowMapDarkness(smd: number) {
        this._shadowMapDarkness = smd;
        this._shadowGenerator.setDarkness(smd);
    }

    public get shadowMapQuality(): number {
        return this._shadowMapQuality;
    }

    public set shadowMapQuality(smq: number) {
        this._shadowMapQuality = smq;
        this._shadowGenerator.filteringQuality = smq;
    }

    public get shadowMapDepthScale(): number {
        return this._shadowMapDepthScale;
    }

    public set shadowMapDepthScale(smds: number) {
        this._shadowMapDepthScale = smds;
        this._shadowGenerator.depthScale = smds;
    }

    public get shadowMapBlurScale(): number {
        return this._shadowMapBlurScale;
    }

    public set shadowMapBlurScale(smbs: number) {
        this._shadowMapBlurScale = smbs;
        this._shadowGenerator.blurScale = smbs;
    }

    public get shadowMapUseKernelBlur(): boolean {
        return this._shadowMapUseKernelBlur;
    }

    public set shadowMapUseKernelBlur(smukb: boolean) {
        this._shadowMapUseKernelBlur = smukb;
        this._shadowGenerator.useKernelBlur = smukb;
    }

    public get shadowMapBlurKernel(): number {
        return this._shadowMapBlurKernel;
    }

    public set shadowMapBlurKernel(smbk: number) {
        this._shadowMapBlurKernel = smbk;
        this._shadowGenerator.blurKernel = smbk;
    }

    public get shadowMapBlurBoxOffset(): number {
        return this._shadowMapBlurBoxOffset;
    }

    public set shadowMapBlurBoxOffset(smbbo: number) {
        this._shadowMapBlurBoxOffset = smbbo;
        this._shadowGenerator.blurBoxOffset = smbbo;
    }

    public get lightNearPlane(): number {
        return this._lightNearPlane;
    }

    public set lightNearPlane(lnp: number) {
        this._lightNearPlane = lnp;
        this.sun.shadowMinZ = lnp;
    }

    public get lightFarPlane(): number {
        return this._lightFarPlane;
    }

    public set lightFarPlane(lfp: number) {
        this._lightFarPlane = lfp;
        this.sun.shadowMaxZ = lfp;
    }

    public createGUI(): void {
        this.gui = new StandardShadowGUI(this.name, this.scene.getEngine(), this._container, this);

        this.gui.createGUI();
    }

    public async initialize(scene: ISceneDescription, ambientColor: Color3, sunDir: Vector3): Promise<ISampleSplit> {
        this.scene.metadata = { "name": this.name };
        this._sceneName = scene.dname;

        this._sunDir = sunDir;
        this._sunColor = scene.sunColor.clone();

        this.sun = new DirectionalLight("sun", sunDir, this.scene);
        this.sun.intensity = 1;
        this.sun.shadowMinZ = scene.light.nearPlane;
        this.sun.shadowMaxZ = scene.light.farPlane;
        this.sun.diffuse = this._sunColor;

        Utils.addSkybox("Clouds.dds", this.scene, this.camera.maxZ - 1);

        await Utils.loadObj(this.scene, scene.path, scene.name);

        this.scene.activeCamera = this.camera;

        this.scene.meshes.forEach((m) => {
            if (m.name == 'skyBox' || m.name.endsWith("_gui")) { return; }

            if (!m.material) { return; }

            const mat = m.material as StandardMaterial;

            mat.diffuseColor = new Color3(1., 1., 1.);
            mat.specularColor = new Color3(0., 0., 0.);
            mat.ambientColor = ambientColor;
            mat.ambientTexture = null;
            mat.backFaceCulling = scene.backfaceCulling;

            if (!mat.diffuseTexture) {
                mat.ambientColor = new Color3(0, 0, 0);
            }
            //!mat.freeze();

            m.receiveShadows = true;

            if (scene.scaling != 1) {
                let matrix = Matrix.Identity();
                matrix.scaleToRef(scene.scaling, matrix);
                matrix.setRowFromFloats(3, 0, 0, 0, 1);
                (m as Mesh).bakeTransformIntoVertices(matrix);
            }
        });

        this.createShadowGenerator();

        return this;
    }

    protected createShadowGenerator(): void {
        if (this._shadowGenerator) {
            this._shadowGenerator.dispose();
            this._shadowGenerator = null as any;
        }

        const shadowGenerator = new ShadowGenerator(this.shadowMapSize, this.sun);

        shadowGenerator.bias = this._shadowMapBias;
        shadowGenerator.normalBias = this._shadowMapNormalBias;
        shadowGenerator.setDarkness(this._shadowMapDarkness);
        shadowGenerator.filter = this._shadowMapFilter;
        shadowGenerator.filteringQuality = this._shadowMapQuality;
        shadowGenerator.depthScale = this._shadowMapDepthScale;
        shadowGenerator.blurScale = this._shadowMapBlurScale;
        shadowGenerator.useKernelBlur = this._shadowMapUseKernelBlur;
        shadowGenerator.blurKernel = this._shadowMapBlurKernel;
        shadowGenerator.blurBoxOffset = this._shadowMapBlurBoxOffset;

        this._shadowGenerator = shadowGenerator;

        const renderList = shadowGenerator.getShadowMap()!.renderList!;

        let num = 0, lstm: Array<Mesh> = [];
        this.scene.meshes.forEach((m) => {
            if (m.name == 'skyBox') { return; }
            renderList.push(m);
            /*if (m.name == "mesh_108_Mesh_main_floor_subset_6" || m.name == "mesh_121_Mesh_g_bace_main05_subset_0") {
                if (m.name=="mesh_121_Mesh_g_bace_main05_subset_0")
                    renderList.push(m);
            } else
                lstm.push(m);*/
        });
        lstm.forEach((m) => {
            m.dispose();
        });
    }

}
