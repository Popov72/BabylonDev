import {
    AbstractMesh,
    Color3,
    DirectionalLight,
    IShadowGenerator,
    LightGizmo,
    Matrix,
    Mesh,
    MeshBuilder,
    Scene,
    ShadowGenerator,
    StandardMaterial,
    UniversalCamera,
    Vector3,
    VertexData,
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
    protected _shadowGenerator: IShadowGenerator;
    protected _lightHelperFrustumLines: Array<Mesh>;
    protected _lightGizmo: LightGizmo;
    protected _skybox: Mesh;

    constructor(scene: Scene, camera: UniversalCamera, parent: Sample, name: string) {
        super(scene, camera, parent, name);

        this.sun = null as any;
        this._shadowGenerator = null as any;
        this._lightHelperFrustumLines = [];
        this._lightGizmo = null as any;
    }

    protected getStandardGenerator(): ShadowGenerator {
        return this._shadowGenerator as unknown as ShadowGenerator;
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
        this.buildLightHelper();
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
        this.getStandardGenerator().filter = smf;
        this._shadowMapFilter = this.getStandardGenerator().filter;
        this.setShadowMapViewerTexture();
    }

    public get shadowMapBias(): number {
        return this._shadowMapBias;
    }

    public set shadowMapBias(smb: number) {
        this._shadowMapBias = smb;
        this.getStandardGenerator().bias = smb;
    }

    public get shadowMapNormalBias(): number {
        return this._shadowMapNormalBias;
    }

    public set shadowMapNormalBias(smnb: number) {
        this._shadowMapNormalBias = smnb;
        this.getStandardGenerator().normalBias = smnb;
    }

    public get shadowMapDarkness(): number {
        return this._shadowMapDarkness;
    }

    public set shadowMapDarkness(smd: number) {
        this._shadowMapDarkness = smd;
        this.getStandardGenerator().darkness = smd;
    }

    public get shadowMapQuality(): number {
        return this._shadowMapQuality;
    }

    public set shadowMapQuality(smq: number) {
        this._shadowMapQuality = smq;
        this.getStandardGenerator().filteringQuality = smq;
    }

    public get shadowMapDepthScale(): number {
        return this._shadowMapDepthScale;
    }

    public set shadowMapDepthScale(smds: number) {
        this._shadowMapDepthScale = smds;
        this.getStandardGenerator().depthScale = smds;
    }

    public get shadowMapBlurScale(): number {
        return this._shadowMapBlurScale;
    }

    public set shadowMapBlurScale(smbs: number) {
        this._shadowMapBlurScale = smbs;
        this.getStandardGenerator().blurScale = smbs;
    }

    public get shadowMapUseKernelBlur(): boolean {
        return this._shadowMapUseKernelBlur;
    }

    public set shadowMapUseKernelBlur(smukb: boolean) {
        this._shadowMapUseKernelBlur = smukb;
        this.getStandardGenerator().useKernelBlur = smukb;
    }

    public get shadowMapBlurKernel(): number {
        return this._shadowMapBlurKernel;
    }

    public set shadowMapBlurKernel(smbk: number) {
        this._shadowMapBlurKernel = smbk;
        this.getStandardGenerator().blurKernel = smbk;
    }

    public get shadowMapBlurBoxOffset(): number {
        return this._shadowMapBlurBoxOffset;
    }

    public set shadowMapBlurBoxOffset(smbbo: number) {
        this._shadowMapBlurBoxOffset = smbbo;
        this.getStandardGenerator().blurBoxOffset = smbbo;
    }

    public get shadowMapLightSizeUVRatio(): number {
        return this._shadowMapLightSizeUVRatio;
    }

    public set shadowMapLightSizeUVRatio(smlsuvr: number) {
        this._shadowMapLightSizeUVRatio = smlsuvr;
        this.getStandardGenerator().contactHardeningLightSizeUVRatio = smlsuvr;
    }

    public get lightNearPlane(): number {
        return this._lightNearPlane;
    }

    public set lightNearPlane(lnp: number) {
        this._lightNearPlane = lnp;
        this.sun.shadowMinZ = lnp;
        this.buildLightHelper();
    }

    public get lightFarPlane(): number {
        return this._lightFarPlane;
    }

    public set lightFarPlane(lfp: number) {
        this._lightFarPlane = lfp;
        this.sun.shadowMaxZ = lfp;
        this.buildLightHelper();
    }

    public get showLightHelper(): boolean {
        return this._showLightHelper;
    }

    public set showLightHelper(slh: boolean) {
        this._showLightHelper = slh;

        if (this._lightGizmo && !slh) {
            this._lightGizmo.dispose();
            this._lightGizmo = null as any;
        }

        if (slh) {
            this._lightGizmo = new LightGizmo();
            this._lightGizmo.light = this.sun;
        }

        this.buildLightHelper();
    }

    public get autoCalcShadowZBounds(): boolean {
        return this._autoCalcShadowZBounds;
    }

    public set autoCalcShadowZBounds(acszb: boolean) {
        this._autoCalcShadowZBounds = acszb;
        this.sun.autoCalcShadowZBounds = acszb;
        if (this._autoCalcShadowZBounds) {
            this.sun.setShadowProjectionMatrix(Matrix.Identity(), (this.getStandardGenerator() as any)._viewMatrix, this.getStandardGenerator().getShadowMap()!.renderList!);
        } else {
            this._lightNearPlane = this.sun.shadowMinZ;
            this._lightFarPlane = this.sun.shadowMaxZ;

            const event = new CustomEvent('gui_set_value', { detail: { type: 'setShadowZBounds' } });

            window.dispatchEvent(event);
        }
        this.buildLightHelper();
    }

    protected getLightExtents(): { min: Vector3, max: Vector3 } | null {
        const light = this.sun as any;

        return {
            "min": new Vector3(light._orthoLeft, light._orthoBottom, this.sun.shadowMinZ),
            "max": new Vector3(light._orthoRight, light._orthoTop, this.sun.shadowMaxZ),
        };
    }

    protected getViewMatrix(): Matrix | null {
        return (this.getStandardGenerator() as any)._viewMatrix;
    }

    protected buildLightHelper(): void {
        this._lightHelperFrustumLines.forEach((mesh) => {
            mesh.dispose();
        });

        this._lightHelperFrustumLines = [];

        if (!this._showLightHelper) {
            return;
        }

        const lightExtents = this.getLightExtents();
        const lightView = this.getViewMatrix();

        if (!lightExtents || !lightView) {
            return;
        }

        const invLightView = Matrix.Invert(lightView);

        const n1 = new Vector3(lightExtents.max.x, lightExtents.max.y, lightExtents.min.z);
        const n2 = new Vector3(lightExtents.max.x, lightExtents.min.y, lightExtents.min.z);
        const n3 = new Vector3(lightExtents.min.x, lightExtents.min.y, lightExtents.min.z);
        const n4 = new Vector3(lightExtents.min.x, lightExtents.max.y, lightExtents.min.z);

        const near1 = Vector3.TransformCoordinates(n1, invLightView);
        const near2 = Vector3.TransformCoordinates(n2, invLightView);
        const near3 = Vector3.TransformCoordinates(n3, invLightView);
        const near4 = Vector3.TransformCoordinates(n4, invLightView);

        const f1 = new Vector3(lightExtents.max.x, lightExtents.max.y, lightExtents.max.z);
        const f2 = new Vector3(lightExtents.max.x, lightExtents.min.y, lightExtents.max.z);
        const f3 = new Vector3(lightExtents.min.x, lightExtents.min.y, lightExtents.max.z);
        const f4 = new Vector3(lightExtents.min.x, lightExtents.max.y, lightExtents.max.z);

        const far1 = Vector3.TransformCoordinates(f1, invLightView);
        const far2 = Vector3.TransformCoordinates(f2, invLightView);
        const far3 = Vector3.TransformCoordinates(f3, invLightView);
        const far4 = Vector3.TransformCoordinates(f4, invLightView);

        this._lightHelperFrustumLines.push(MeshBuilder.CreateLines("nearlines", { points: [near1, near2, near3, near4, near1] }, this.scene));
        this._lightHelperFrustumLines.push(MeshBuilder.CreateLines("farlines",  { points: [far1, far2, far3, far4, far1] }, this.scene));
        this._lightHelperFrustumLines.push(MeshBuilder.CreateLines("trlines", { points: [ near1, far1 ] }, this.scene));
        this._lightHelperFrustumLines.push(MeshBuilder.CreateLines("brlines", { points: [ near2, far2 ] }, this.scene));
        this._lightHelperFrustumLines.push(MeshBuilder.CreateLines("tllines", { points: [ near3, far3 ] }, this.scene));
        this._lightHelperFrustumLines.push(MeshBuilder.CreateLines("bllines", { points: [ near4, far4 ] }, this.scene));

        const makePlane = (name: string, color: Color3, positions: Array<number>) => {
            let plane = new Mesh(name + "plane", this.scene),
                mat = new StandardMaterial(name + "PlaneMat", this.scene);

            plane.material = mat;

            mat.emissiveColor = color;
            mat.alpha = 0.3;
            mat.backFaceCulling = false;
            mat.disableLighting = true;

            const indices = [0, 1, 2, 0, 2, 3];

            const vertexData = new VertexData();

            vertexData.positions = positions;
            vertexData.indices = indices;

            vertexData.applyToMesh(plane);

            this._lightHelperFrustumLines.push(plane);
        };

        makePlane("near",   new Color3(1, 0, 0),    [near1.x, near1.y, near1.z, near2.x, near2.y, near2.z, near3.x, near3.y, near3.z, near4.x, near4.y, near4.z ]);
        makePlane("far",    new Color3(0.3, 0, 0),  [far1.x, far1.y, far1.z, far2.x, far2.y, far2.z, far3.x, far3.y, far3.z, far4.x, far4.y, far4.z ]);
        makePlane("right",  new Color3(0, 1, 0),    [near1.x, near1.y, near1.z, far1.x, far1.y, far1.z, far2.x, far2.y, far2.z, near2.x, near2.y, near2.z ]);
        makePlane("left",   new Color3(0, 0.3, 0),  [near4.x, near4.y, near4.z, far4.x, far4.y, far4.z, far3.x, far3.y, far3.z, near3.x, near3.y, near3.z ]);
        makePlane("top",    new Color3(0, 0, 1),    [near1.x, near1.y, near1.z, far1.x, far1.y, far1.z, far4.x, far4.y, far4.z, near4.x, near4.y, near4.z ]);
        makePlane("bottom", new Color3(0, 0, 0.3),  [near2.x, near2.y, near2.z, far2.x, far2.y, far2.z, far3.x, far3.y, far3.z, near3.x, near3.y, near3.z ]);
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

        (window as any).sun = this.sun;

        this._skybox = Utils.addSkybox("Clouds.dds", this.scene, 100/*this.camera.maxZ - 1*/);

        await Utils.loadObj(this.scene, scene.path, scene.name);

        this.scene.activeCamera = this.camera;

        this.scene.meshes.forEach((m) => {
            if (m.name == 'skyBox' || m.name.indexOf("_shadowmap") >= 0) { return; }

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
                m.refreshBoundingInfo();
            }
        });

        this.createShadowGenerator();

        return this;
    }

    protected createGenerator(): ShadowGenerator {
        return new ShadowGenerator(this.shadowMapSize, this.sun);
    }

    protected setShadowMapViewerTexture(): void {
        (this._shadowMapPlane.material as StandardMaterial).diffuseTexture = this._shadowMapFilter !== ShadowGenerator.FILTER_PCF ? this._shadowGenerator.getShadowMap() : null;
    }

    protected createShadowGenerator(): void {
        if (this._shadowGenerator) {
            this._shadowGenerator.dispose();
            this._shadowGenerator = null as any;
        }

        const shadowGenerator = this.createGenerator();

        this._shadowGenerator = shadowGenerator;

        shadowGenerator.bias = this._shadowMapBias;
        shadowGenerator.normalBias = this._shadowMapNormalBias;
        shadowGenerator.darkness = this._shadowMapDarkness;
        shadowGenerator.filter = this._shadowMapFilter;
        shadowGenerator.filteringQuality = this._shadowMapQuality;

        this.setShadowMapViewerTexture();

        (window as any).sg = shadowGenerator;

        const renderList = shadowGenerator.getShadowMap()?.renderList!;

        let num = 0, lstm: Array<AbstractMesh> = [];
        this.scene.meshes.forEach((m) => {
            if (m.name == 'skyBox') { return; }
            renderList.push(m);
        });
        lstm.forEach((m) => {
            m.dispose();
        });
    }

    public render(): void {
        this._skybox.position.copyFrom(this.camera.position);
        this.scene.render();

        /*if (this._animateLight && this._autoCalcShadowZBounds) {
            this._lightNearPlane = this.sun.shadowMinZ;
            this._lightFarPlane = this.sun.shadowMaxZ;

            const event = new CustomEvent('gui_set_value', { detail: { type: 'setShadowZBounds' } });

            window.dispatchEvent(event);
        }*/
    }

}
