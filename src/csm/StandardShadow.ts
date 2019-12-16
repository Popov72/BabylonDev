import {
    Color3,
    DirectionalLight,
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

import { CSMShadowGenerator } from "./csmShadowGenerator";
import { CSMShadowMap } from "./csmShadowMap";

const isCSM = true;

export default class StandardShadow extends SplitBase {

    public static className: string = "Standard";

    protected sun: DirectionalLight;
    protected _shadowGenerator: ShadowGenerator | CSMShadowGenerator;
    protected _lightHelperFrustumLines: Array<Mesh>;
    protected _lightGizmo: LightGizmo;

    constructor(scene: Scene, camera: UniversalCamera, parent: Sample, name: string) {
        super(scene, camera, parent, name);

        this.sun = null as any;
        this._shadowGenerator = null as any;
        this._lightHelperFrustumLines = [];
        this._lightGizmo = null as any;
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
        this._shadowGenerator.filter = smf;
        this._shadowMapFilter = this._shadowGenerator.filter;
        (this._shadowMapPlane.material as StandardMaterial).diffuseTexture = this._shadowGenerator.getShadowMaps()[0];
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
        this._shadowGenerator.darkness = smd;
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

    public get shadowMapLightSizeUVRatio(): number {
        return this._shadowMapLightSizeUVRatio;
    }

    public set shadowMapLightSizeUVRatio(smlsuvr: number) {
        this._shadowMapLightSizeUVRatio = smlsuvr;
        this._shadowGenerator.contactHardeningLightSizeUVRatio = smlsuvr;
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
        (this.sun as any).autoCalcShadowZBounds = acszb;
        if (this._autoCalcShadowZBounds) {
            const dummy = Matrix.Identity();
            if (isCSM) {
                this.sun.setShadowProjectionMatrix(dummy, (this._shadowGenerator as any)._cascades[0].generator._viewMatrix as Matrix, this._shadowGenerator.getShadowMaps()[0].renderList!);
            } else {
                this.sun.setShadowProjectionMatrix(dummy, (this._shadowGenerator as any)._viewMatrix as Matrix, this._shadowGenerator.getShadowMaps()[0].renderList!);
            }
        } else {
            this._lightNearPlane = this.sun.shadowMinZ;
            this._lightFarPlane = this.sun.shadowMaxZ;
            const event = new CustomEvent('gui_set_value', { detail: { type: 'setShadowZBounds' } });
            window.dispatchEvent(event);
        }
        this.buildLightHelper();
    }

    protected buildLightHelper(): void {
        this._lightHelperFrustumLines.forEach((mesh) => {
            mesh.dispose();
        });

        this._lightHelperFrustumLines = [];

        if (!this._showLightHelper) {
            return;
        }

        const light = this.sun as any;
        const csmSM = isCSM ? (this._shadowGenerator as any)._cascades[0].generator as CSMShadowMap : null;
        const lightView = isCSM ? (csmSM as any)._viewMatrix as Matrix : (this._shadowGenerator as any)._viewMatrix as Matrix;
        const invLightView = Matrix.Invert(lightView);

        const n1 = isCSM ? new Vector3(csmSM!.lightMaxExtents.x, csmSM!.lightMaxExtents.y, csmSM!.lightMinExtents.z) : new Vector3(light._orthoRight, light._orthoTop,    this.sun.shadowMinZ);
        const n2 = isCSM ? new Vector3(csmSM!.lightMaxExtents.x, csmSM!.lightMinExtents.y, csmSM!.lightMinExtents.z) : new Vector3(light._orthoRight, light._orthoBottom, this.sun.shadowMinZ);
        const n3 = isCSM ? new Vector3(csmSM!.lightMinExtents.x, csmSM!.lightMinExtents.y, csmSM!.lightMinExtents.z) : new Vector3(light._orthoLeft,  light._orthoBottom, this.sun.shadowMinZ);
        const n4 = isCSM ? new Vector3(csmSM!.lightMinExtents.x, csmSM!.lightMaxExtents.y, csmSM!.lightMinExtents.z) : new Vector3(light._orthoLeft,  light._orthoTop,    this.sun.shadowMinZ);

        const near1 = Vector3.TransformCoordinates(n1, invLightView);
        const near2 = Vector3.TransformCoordinates(n2, invLightView);
        const near3 = Vector3.TransformCoordinates(n3, invLightView);
        const near4 = Vector3.TransformCoordinates(n4, invLightView);
        
        const f1 = isCSM ? new Vector3(csmSM!.lightMaxExtents.x, csmSM!.lightMaxExtents.y, csmSM!.lightMaxExtents.z) : new Vector3(light._orthoRight, light._orthoTop,    this.sun.shadowMaxZ);
        const f2 = isCSM ? new Vector3(csmSM!.lightMaxExtents.x, csmSM!.lightMinExtents.y, csmSM!.lightMaxExtents.z) : new Vector3(light._orthoRight, light._orthoBottom, this.sun.shadowMaxZ);
        const f3 = isCSM ? new Vector3(csmSM!.lightMinExtents.x, csmSM!.lightMinExtents.y, csmSM!.lightMaxExtents.z) : new Vector3(light._orthoLeft,  light._orthoBottom, this.sun.shadowMaxZ);
        const f4 = isCSM ? new Vector3(csmSM!.lightMinExtents.x, csmSM!.lightMaxExtents.y, csmSM!.lightMaxExtents.z) : new Vector3(light._orthoLeft,  light._orthoTop,    this.sun.shadowMaxZ);

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
        //this.sun.position.set(0, -40, 0);
        this.sun.intensity = 1;
        this.sun.shadowMinZ = scene.light.nearPlane;
        this.sun.shadowMaxZ = scene.light.farPlane;
        this.sun.diffuse = this._sunColor;

        (window as any).sun= this.sun;

        Utils.addSkybox("Clouds.dds", this.scene, this.camera.maxZ - 1);

        await Utils.loadObj(this.scene, scene.path, scene.name);

        this.scene.activeCamera = this.camera;

        var gmin = new Vector3(10000, 10000, 10000), gmax = new Vector3(-10000, -10000, -10000);

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

            var boundingInfo = m.getBoundingInfo();
            var boundingBox = boundingInfo.boundingBox;
            var min = boundingBox.minimumWorld, max = boundingBox.maximumWorld;

            gmin.x = Math.min(gmin.x, min.x); gmin.y = Math.min(gmin.y, min.y); gmin.z = Math.min(gmin.z, min.z); 
            gmax.x = Math.max(gmax.x, max.x); gmax.y = Math.max(gmax.y, max.y); gmax.z = Math.max(gmax.z, max.z); 
        });

        console.log(gmin, gmax);

        this.createShadowGenerator();

        return this;
    }

    protected createShadowGenerator(): void {
        if (this._shadowGenerator) {
            this._shadowGenerator.dispose();
            this._shadowGenerator = null as any;
        }

        const shadowGenerator = !isCSM ? new ShadowGenerator(this.shadowMapSize, this.sun) : new CSMShadowGenerator(this.shadowMapSize, this.sun, 4);

        if (shadowGenerator instanceof CSMShadowGenerator) {
            shadowGenerator.activeCascade = 0;
            shadowGenerator.stabilizeCascades = false;
        }

        shadowGenerator.bias = this._shadowMapBias;
        shadowGenerator.normalBias = this._shadowMapNormalBias;
        shadowGenerator.darkness = this._shadowMapDarkness;
        shadowGenerator.filter = this._shadowMapFilter;
        shadowGenerator.filteringQuality = this._shadowMapQuality;
        shadowGenerator.depthScale = this._shadowMapDepthScale;
        shadowGenerator.blurScale = this._shadowMapBlurScale;
        shadowGenerator.useKernelBlur = this._shadowMapUseKernelBlur;
        shadowGenerator.blurKernel = this._shadowMapBlurKernel;
        shadowGenerator.blurBoxOffset = this._shadowMapBlurBoxOffset;
        shadowGenerator.contactHardeningLightSizeUVRatio = this._shadowMapLightSizeUVRatio;

        this._shadowGenerator = shadowGenerator;

        (window as any).sg = shadowGenerator;

        (this._shadowMapPlane.material as StandardMaterial).diffuseTexture = shadowGenerator.getShadowMaps()[0];

        const renderList = shadowGenerator.renderList!; //shadowGenerator.getShadowMap()!.renderList!;

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
