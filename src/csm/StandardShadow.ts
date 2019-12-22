import {
    AbstractMesh,
    Color3,
    DirectionalLight,
    IShadowGenerator,
    Effect,
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
    VectorSplitterBlock,
    SubtractBlock,
    DistanceBlock,
    MinBlock,
    DotBlock,
    CrossBlock,
    NormalizeBlock,
    LengthBlock,
    DivideBlock,
    MultiplyBlock,
    TrigonometryBlock,
    MaxBlock,
    LerpBlock,
    TextureBlock,
    VectorMergerBlock,
    ClampBlock,
    SmoothStepBlock,
    NegateBlock,
    AddBlock,
    AnimatedInputBlockTypes,
    FragmentOutputBlock,
    InputBlock,
    Material,
    NodeMaterial,
    NodeMaterialSystemValues,
    Texture,
    TransformBlock,
    TrigonometryBlockOperations,
    VertexOutputBlock,
    ShaderMaterial,
} from "babylonjs";

import Sample from "../Sample";
import Utils from "../Utils";
import ISampleSplit from "./ISampleSplit";
import { ISceneDescription } from "./GlobalGUI";
import SplitBase from "./SplitBase";
import StandardShadowGUI from "./StandardShadowGUI";

const testFog = false;

export default class StandardShadow extends SplitBase {

    public static className: string = "Standard";

    protected sun: DirectionalLight;
    protected _shadowGenerator: IShadowGenerator;
    protected _lightHelperFrustumLines: Array<Mesh>;
    protected _lightGizmo: LightGizmo;
    protected _skyBox: Mesh;

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
            this.sun.setShadowProjectionMatrix(Matrix.Identity(), this.getStandardGenerator().viewMatrix, this.getStandardGenerator().getShadowMaps()[0].renderList!);
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
        }
    }

    protected getViewMatrix(): Matrix | null {
        return this.getStandardGenerator().viewMatrix;
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

        this._skyBox = Utils.addSkybox("Clouds.dds", this.scene, 100);

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
        (this._shadowMapPlane.material as StandardMaterial).diffuseTexture = this._shadowMapFilter !== ShadowGenerator.FILTER_PCF ? this._shadowGenerator.getShadowMaps()[0] : null;
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
        shadowGenerator.depthScale = this._shadowMapDepthScale;
        shadowGenerator.blurScale = this._shadowMapBlurScale;
        shadowGenerator.useKernelBlur = this._shadowMapUseKernelBlur;
        shadowGenerator.blurKernel = this._shadowMapBlurKernel;
        shadowGenerator.blurBoxOffset = this._shadowMapBlurBoxOffset;
        shadowGenerator.contactHardeningLightSizeUVRatio = this._shadowMapLightSizeUVRatio;

        this.setShadowMapViewerTexture();

        (window as any).sg = shadowGenerator;

        const renderList = shadowGenerator.renderList!;

        let num = 0, lstm: Array<AbstractMesh> = [];
        this.scene.meshes.forEach((m) => {
            if (m.name == 'skyBox') { return; }
            renderList.push(m);
            if (testFog) {
                const diffText = (m.material as StandardMaterial).diffuseTexture;
                if (diffText) {
                    //m.material = this.buildNodeMaterial(diffText as Texture);
                    m.material = this.buildShaderMaterial();
                    (m.material as ShaderMaterial).setTexture("TextureSampler", diffText as Texture);
                }
            }
            /*if (m.name == "mesh_108_Mesh_main_floor_subset_6" || m.name == "mesh_121_Mesh_g_bace_main05_subset_0") {
                if (m.name=="mesh_121_Mesh_g_bace_main05_subset_0")
                    renderList.push(m);
            } else {
                lstm.push(m);
            }*/
        });
        lstm.forEach((m) => {
            m.dispose();
        });

        if (testFog) {
            this.scene.onBeforeRenderObservable.add(() => {
                let time = new Date().getTime();
                this.scene.meshes.forEach((m) => {
                    if (m.name == 'skyBox') { return; }
                    if (m.material instanceof ShaderMaterial) {
                        (m.material as ShaderMaterial).setVector3("u_Cameraposition", this.camera.position);
                        (m.material as ShaderMaterial).setFloat("u_FogRadius", 23+18*Math.cos(time/500));
                        (m.material as ShaderMaterial).setFloat("u_FogDensity", 7+5*Math.cos(time/500));
                    }
                });
            });
        }
    }

    protected buildShaderMaterial(): Material {
        Effect.ShadersStore["customVertexShader"]= `   
        precision highp float;

        attribute vec3 position;
        attribute vec2 uv;
        
        
        uniform mat4 world;
        uniform mat4 worldViewProjection;
        #ifdef UVTRANSFORM0
        uniform mat4 textureTransform;
        #endif
        
        
        #ifdef UVTRANSFORM0
        varying vec2 transformedUV;
        #endif
        #ifdef VMAINUV
        varying vec2 vMainuv;
        #endif
        varying vec4 v_output2;
        
        
        
        
        float u_ = 1.0;
        float u_PIOver = 1.57;
        float u_1 = 0.0;
        float u_2 = 1.0;
        float u_3 = 0.0;
        float u_4 = 0.0;
        float u_5 = 0.0;
        float u_6 = 0.0;
        
        
        void main(void) {
        vec4 output2 = world * vec4(position, 1.0);
        vec4 output1 = world * vec4(position, 1.0);
        vec4 output0 = worldViewProjection * vec4(position, 1.0);
        gl_Position = output0;
        #ifdef UVTRANSFORM0
        transformedUV = vec2(textureTransform * vec4(uv.xy, 1.0, 0.0));
        #endif
        #ifdef VMAINUV
        vMainuv = uv.xy;
        #endif
        v_output2 = output2;
        
        }
        `;        

        Effect.ShadersStore["customFragmentShader"]=`
        precision highp float;

        #ifdef UVTRANSFORM0
        uniform mat4 textureTransform;
        #endif
        uniform vec3 u_FogColor;
        uniform vec3 u_FogCenter;
        uniform vec3 u_Cameraposition;
        uniform float u_FogRadius;
        uniform float u_FogDensity;
        
        
        uniform sampler2D TextureSampler;
        
        
        #ifdef UVTRANSFORM0
        varying vec2 transformedUV;
        #endif
        #ifdef VMAINUV
        varying vec2 vMainuv;
        #endif
        varying vec4 v_output2;

        #include<helperFunctions>

        float u_ = 1.0;
        float u_PIOver = 1.57;
        float u_1 = 0.0;
        float u_2 = 1.0;
        float u_3 = 0.0;
        float u_4 = 0.0;
        float u_5 = 0.0;
        float u_6 = 0.0;
        
        void main(void) {
            #ifdef UVTRANSFORM0
            vec4 tempTextureRead = texture(TextureSampler, transformedUV);
            #endif
            #ifdef VMAINUV
            vec4 tempTextureRead = texture(TextureSampler, vMainuv);
            #endif
            vec4 rgba = tempTextureRead.rgba;
            #ifdef ISLINEAR0
            rgba = toGammaSpace(rgba);
            #endif

            vec3 volFogCenter = u_FogCenter;
            vec3 volFogColor = u_FogColor;
            float volFogRadius = u_FogRadius;
            vec4 vwPos = v_output2;
            vec3 vwCamPos = u_Cameraposition;

            float volFogRadius2 = volFogRadius * volFogRadius;
            float distCamToPos = distance(vwPos.xyz, vwCamPos);
            vec3 dir = normalize(vwPos.xyz - vwCamPos);
            vec3 L = volFogCenter - vwCamPos;
            float tca = dot(L, dir);
            float d2 = dot(L, L) - tca * tca;
        
            float thc = sqrt(max(volFogRadius2 - d2, 0.0));
            float t0 = tca - thc;
            float t1 = tca + thc;
            float dist =  mix(0.0, min(distCamToPos, t1), max(sign(-t0), 0.0)*max(sign(t1), 0.0))
                        + mix(0.0, min(distCamToPos, t1) - t0, max(sign(t0), 0.0)*max(sign(t1), 0.0)*max(sign(distCamToPos - t0), 0.0));
            float distToCenter = length(cross(volFogCenter - vwCamPos, dir));
            float fr = smoothstep(0.0, 1.0, cos(distToCenter/volFogRadius*3.141592/2.0));
            float e = dist/(volFogRadius*2.0);
            e = 1.0 - exp(-e * u_FogDensity);
            vec4 glFragColorWithFog = mix(rgba, vec4(volFogColor, rgba.a), clamp(e*fr, 0.0, 1.0));
        
            rgba = mix(rgba, glFragColorWithFog, max(sign(volFogRadius2 - d2), 0.0));
        
        
            gl_FragColor = rgba;//output3;
        }
        `;

        var mat = new ShaderMaterial("shader", this.scene, {
            vertex: "custom",
            fragment: "custom",
            },
            {
                attributes: ["position", "uv"],
                uniforms: ["world", "worldViewProjection", "u_FogColor", "u_FogCenter", "u_FogRadius", "u_Cameraposition"],
                defines: ["#define VMAINUV"]
            }
        );

        mat.setColor3("u_FogColor", new Color3(0.95, 0.95, 0.95));
        mat.setVector3("u_FogCenter", new Vector3(0, 5, 0));
        mat.setFloat("u_FogRadius", 25);
        mat.setFloat("u_FogDensity", 4);

        return mat;
    }

    protected buildNodeMaterial(diffText: Texture): Material {
        var nodeMaterial = new NodeMaterial("node");

        // InputBlock
        var position = new InputBlock("position");
        position.setAsAttribute("position");
        
        // TransformBlock
        var worldPos = new TransformBlock("worldPos");
        worldPos.complementZ = 0;
        worldPos.complementW = 1;
        
        // InputBlock
        var world = new InputBlock("world");
        world.setAsSystemValue(NodeMaterialSystemValues.World);
        
        // TransformBlock
        var Worldposition = new TransformBlock("World position");
        Worldposition.complementZ = 0;
        Worldposition.complementW = 1;
        
        // VectorSplitterBlock
        var VectorSplitter = new VectorSplitterBlock("VectorSplitter");
        
        // SubtractBlock
        var wPoscamPos = new SubtractBlock("wPos-camPos");
        
        // InputBlock
        var Cameraposition = new InputBlock("Camera position");
        Cameraposition.setAsSystemValue(NodeMaterialSystemValues.CameraPosition);
        
        // DistanceBlock
        var distCamToPos = new DistanceBlock("distCamToPos");
        
        // MinBlock
        var Min = new MinBlock("Min");
        
        // AddBlock
        var t = new AddBlock("t1");
        
        // DotBlock
        var tca = new DotBlock("tca");
        
        // SubtractBlock
        var L = new SubtractBlock("L");
        
        // InputBlock
        var FogCenter = new InputBlock("Fog Center");
        FogCenter.value = new Vector3(30, 15, 0);
        FogCenter.isConstant = false;
        FogCenter.visibleInInspector = false;
        
        // SubtractBlock
        var Subtract = new SubtractBlock("Subtract");
        
        // InputBlock
        var Cameraposition1 = new InputBlock("Camera position");
        Cameraposition1.setAsSystemValue(NodeMaterialSystemValues.CameraPosition);
        
        // CrossBlock
        var Cross = new CrossBlock("Cross");
        
        // NormalizeBlock
        var dir = new NormalizeBlock("dir");
        
        // LengthBlock
        var distToCenter = new LengthBlock("distToCenter");
        
        // DivideBlock
        var Divide = new DivideBlock("Divide");
        
        // InputBlock
        var FogRadius = new InputBlock("Fog Radius");
        FogRadius.value = 15;
        FogRadius.min = 0;
        FogRadius.max = 10;
        FogRadius.matrixMode = 0;
        FogRadius.animationType  = AnimatedInputBlockTypes.None;
        
        // MultiplyBlock
        var volFogRadius = new MultiplyBlock("volFogRadius2");
        
        // SubtractBlock
        var Subtract1 = new SubtractBlock("Subtract");
        
        // SubtractBlock
        var d = new SubtractBlock("d2");
        
        // DotBlock
        var LdotL = new DotBlock("LdotL");
        
        // MultiplyBlock
        var tcaSquare = new MultiplyBlock("tcaSquare");
        
        // SubtractBlock
        var Subtract2 = new SubtractBlock("Subtract");
        
        // TrigonometryBlock
        var Sign = new TrigonometryBlock("Sign");
        Sign.operation = TrigonometryBlockOperations.Sign;
        
        // MaxBlock
        var Max = new MaxBlock("Max");
        
        // InputBlock
        var ce = new InputBlock("c0e");
        ce.value = 0;
        ce.min = 0;
        ce.max = 0;
        ce.matrixMode = 0;
        ce.animationType  = AnimatedInputBlockTypes.None;
        
        // LerpBlock
        var Lerp = new LerpBlock("Lerp");
        
        // TextureBlock
        var Texture_ = new TextureBlock("Texture");
        Texture_.texture = diffText;
        Texture_.texture.wrapU = 1;
        Texture_.texture.wrapV = 1;
        Texture_.texture.uAng = 0;
        Texture_.texture.vAng = 0;
        Texture_.texture.wAng = 0;
        Texture_.texture.uOffset = 0;
        Texture_.texture.vOffset = 0;
        Texture_.texture.uScale = 1;
        Texture_.texture.vScale = 1;
        Texture_.texture.gammaSpace = true;
        
        // InputBlock
        var uv = new InputBlock("uv");
        uv.setAsAttribute("uv");
        
        // LerpBlock
        var glFragColorWithFog = new LerpBlock("glFragColorWithFog");
        
        // VectorMergerBlock
        var VectorMerger = new VectorMergerBlock("VectorMerger");
        
        // InputBlock
        var FogColor = new InputBlock("Fog Color");
        FogColor.value = new Color3(0.9490196078431372, 0.9490196078431372, 0.9490196078431372);
        FogColor.isConstant = false;
        FogColor.visibleInInspector = false;
        
        // InputBlock
        var cb = new InputBlock("c1b");
        cb.value = 1;
        cb.min = 0;
        cb.max = 0;
        cb.matrixMode = 0;
        cb.animationType  = AnimatedInputBlockTypes.None;
        
        // ClampBlock
        var Clamp = new ClampBlock("Clamp");
        Clamp.minimum = 0;
        Clamp.maximum = 1;
        
        // MultiplyBlock
        var Multiply = new MultiplyBlock("Multiply");
        
        // SmoothStepBlock
        var fr = new SmoothStepBlock("fr");
        
        // TrigonometryBlock
        var Cos = new TrigonometryBlock("Cos");
        Cos.operation = TrigonometryBlockOperations.Cos;
        
        // MultiplyBlock
        var Multiply1 = new MultiplyBlock("Multiply");
        
        // InputBlock
        var PIOverTwo = new InputBlock("PIOverTwo");
        PIOverTwo.value = 1.57;
        PIOverTwo.min = 0;
        PIOverTwo.max = 0;
        PIOverTwo.matrixMode = 0;
        PIOverTwo.animationType  = AnimatedInputBlockTypes.None;
        
        // InputBlock
        var cd = new InputBlock("c0d");
        cd.value = 0;
        cd.min = 0;
        cd.max = 0;
        cd.matrixMode = 0;
        cd.animationType  = AnimatedInputBlockTypes.None;
        
        // InputBlock
        var ca = new InputBlock("c1a");
        ca.value = 1;
        ca.min = 0;
        ca.max = 0;
        ca.matrixMode = 0;
        ca.animationType  = AnimatedInputBlockTypes.None;
        
        // DivideBlock
        var Divide1 = new DivideBlock("Divide");
        
        // AddBlock
        var dist = new AddBlock("dist");
        
        // LerpBlock
        var dist1 = new LerpBlock("dist1");
        
        // InputBlock
        var cb1 = new InputBlock("c0b");
        cb1.value = 0;
        cb1.min = 0;
        cb1.max = 0;
        cb1.matrixMode = 0;
        cb1.animationType  = AnimatedInputBlockTypes.None;
        
        // MaxBlock
        var Max1 = new MaxBlock("Max");
        
        // TrigonometryBlock
        var Sign1 = new TrigonometryBlock("Sign");
        Sign1.operation = TrigonometryBlockOperations.Sign;
        
        // NegateBlock
        var Negate = new NegateBlock("Negate");
        
        // SubtractBlock
        var t1 = new SubtractBlock("t0");
        
        // TrigonometryBlock
        var thc = new TrigonometryBlock("thc");
        thc.operation = TrigonometryBlockOperations.Sqrt;
        
        // MaxBlock
        var Max2 = new MaxBlock("Max");
        
        // InputBlock
        var ca1 = new InputBlock("c0a");
        ca1.value = 0;
        ca1.min = 0;
        ca1.max = 0;
        ca1.matrixMode = 0;
        ca1.animationType  = AnimatedInputBlockTypes.None;
        
        // SubtractBlock
        var Subtract3 = new SubtractBlock("Subtract");
        
        // MinBlock
        var Min1 = new MinBlock("Min");
        
        // LerpBlock
        var dist2 = new LerpBlock("dist2");
        
        // InputBlock
        var cc = new InputBlock("c0c");
        cc.value = 0;
        cc.min = 0;
        cc.max = 0;
        cc.matrixMode = 0;
        cc.animationType  = AnimatedInputBlockTypes.None;
        
        // MaxBlock
        var Max3 = new MaxBlock("Max");
        
        // TrigonometryBlock
        var Sign2 = new TrigonometryBlock("Sign");
        Sign2.operation = TrigonometryBlockOperations.Sign;
        
        // SubtractBlock
        var Subtract4 = new SubtractBlock("Subtract");
        
        // MultiplyBlock
        var Multiply2 = new MultiplyBlock("Multiply");
        
        // MultiplyBlock
        var Multiply3 = new MultiplyBlock("Multiply");
        
        // MaxBlock
        var Max4 = new MaxBlock("Max");
        
        // TrigonometryBlock
        var Sign3 = new TrigonometryBlock("Sign");
        Sign3.operation = TrigonometryBlockOperations.Sign;
        
        // MaxBlock
        var Max5 = new MaxBlock("Max");
        
        // TrigonometryBlock
        var Sign4 = new TrigonometryBlock("Sign");
        Sign4.operation = TrigonometryBlockOperations.Sign;
        
        // MultiplyBlock
        var Multiply4 = new MultiplyBlock("Multiply");
        
        // MaxBlock
        var Max6 = new MaxBlock("Max");
        
        // TrigonometryBlock
        var Sign5 = new TrigonometryBlock("Sign");
        Sign5.operation = TrigonometryBlockOperations.Sign;
        
        // AddBlock
        var Add = new AddBlock("Add");
        
        // FragmentOutputBlock
        var fragmentOutput = new FragmentOutputBlock("fragmentOutput");
        
        // TransformBlock
        var worldPosviewProjectionTransform = new TransformBlock("worldPos * viewProjectionTransform");
        worldPosviewProjectionTransform.complementZ = 0;
        worldPosviewProjectionTransform.complementW = 1;
        
        // InputBlock
        var viewProjection = new InputBlock("viewProjection");
        viewProjection.setAsSystemValue(NodeMaterialSystemValues.ViewProjection);
        
        // VertexOutputBlock
        var vertexOutput = new VertexOutputBlock("vertexOutput");
        
        // Connections
        position.output.connectTo(worldPos.vector);
        world.output.connectTo(worldPos.transform);
        worldPos.output.connectTo(worldPosviewProjectionTransform.vector);
        viewProjection.output.connectTo(worldPosviewProjectionTransform.transform);
        worldPosviewProjectionTransform.output.connectTo(vertexOutput.vector);
        uv.output.connectTo(Texture_.uv);
        Texture_.rgba.connectTo(Lerp.left);
        Texture_.rgba.connectTo(glFragColorWithFog.left);
        FogColor.output.connectTo(VectorMerger.xyz );
        cb.output.connectTo(VectorMerger.w);
        VectorMerger.xyzw.connectTo(glFragColorWithFog.right);
        FogCenter.output.connectTo(Subtract.left);
        Cameraposition1.output.connectTo(Subtract.right);
        Subtract.output.connectTo(Cross.left);
        position.output.connectTo(Worldposition.vector);
        world.output.connectTo(Worldposition.transform);
        Worldposition.output.connectTo(VectorSplitter.xyzw);
        VectorSplitter.xyzOut.connectTo(wPoscamPos.left);
        Cameraposition.output.connectTo(wPoscamPos.right);
        wPoscamPos.output.connectTo(dir.input);
        dir.output.connectTo(Cross.right);
        Cross.output.connectTo(distToCenter.value);
        distToCenter.output.connectTo(Divide.left);
        FogRadius.output.connectTo(Divide.right);
        Divide.output.connectTo(Multiply1.left);
        PIOverTwo.output.connectTo(Multiply1.right);
        Multiply1.output.connectTo(Cos.input);
        Cos.output.connectTo(fr.value);
        cd.output.connectTo(fr.edge0);
        ca.output.connectTo(fr.edge1);
        fr.output.connectTo(Multiply.left);
        cb1.output.connectTo(dist1.left);
        VectorSplitter.xyzOut.connectTo(distCamToPos.left);
        Cameraposition.output.connectTo(distCamToPos.right);
        distCamToPos.output.connectTo(Min.left);
        FogCenter.output.connectTo(L.left);
        Cameraposition.output.connectTo(L.right);
        L.output.connectTo(tca.left);
        dir.output.connectTo(tca.right);
        tca.output.connectTo(t.left);
        FogRadius.output.connectTo(volFogRadius.left);
        FogRadius.output.connectTo(volFogRadius.right);
        volFogRadius.output.connectTo(Subtract1.left);
        L.output.connectTo(LdotL.left);
        L.output.connectTo(LdotL.right);
        LdotL.output.connectTo(d.left);
        tca.output.connectTo(tcaSquare.left);
        tca.output.connectTo(tcaSquare.right);
        tcaSquare.output.connectTo(d.right);
        d.output.connectTo(Subtract1.right);
        Subtract1.output.connectTo(Max2.left);
        ca1.output.connectTo(Max2.right);
        Max2.output.connectTo(thc.input);
        thc.output.connectTo(t.right);
        t.output.connectTo(Min.right);
        Min.output.connectTo(dist1.right);
        tca.output.connectTo(t1.left);
        thc.output.connectTo(t1.right);
        t1.output.connectTo(Negate.value);
        Negate.output.connectTo(Sign1.input);
        Sign1.output.connectTo(Max1.left);
        cb1.output.connectTo(Max1.right);
        Max1.output.connectTo(Multiply4.left);
        t.output.connectTo(Sign5.input);
        Sign5.output.connectTo(Max6.left);
        cb1.output.connectTo(Max6.right);
        Max6.output.connectTo(Multiply4.right);
        Multiply4.output.connectTo(dist1.gradient);
        dist1.output.connectTo(dist.left);
        cc.output.connectTo(dist2.left);
        distCamToPos.output.connectTo(Min1.left);
        t.output.connectTo(Min1.right);
        Min1.output.connectTo(Subtract3.left);
        t1.output.connectTo(Subtract3.right);
        Subtract3.output.connectTo(dist2.right);
        distCamToPos.output.connectTo(Subtract4.left);
        t1.output.connectTo(Subtract4.right);
        Subtract4.output.connectTo(Sign2.input);
        Sign2.output.connectTo(Max3.left);
        cc.output.connectTo(Max3.right);
        Max3.output.connectTo(Multiply2.left);
        t1.output.connectTo(Sign3.input);
        Sign3.output.connectTo(Max4.left);
        cc.output.connectTo(Max4.right);
        Max4.output.connectTo(Multiply3.left);
        t.output.connectTo(Sign4.input);
        Sign4.output.connectTo(Max5.left);
        cc.output.connectTo(Max5.right);
        Max5.output.connectTo(Multiply3.right);
        Multiply3.output.connectTo(Multiply2.right);
        Multiply2.output.connectTo(dist2.gradient);
        dist2.output.connectTo(dist.right);
        dist.output.connectTo(Divide1.left);
        FogRadius.output.connectTo(Add.left);
        FogRadius.output.connectTo(Add.right);
        Add.output.connectTo(Divide1.right);
        Divide1.output.connectTo(Multiply.right);
        Multiply.output.connectTo(Clamp.value);
        Clamp.output.connectTo(glFragColorWithFog.gradient);
        glFragColorWithFog.output.connectTo(Lerp.right);
        volFogRadius.output.connectTo(Subtract2.left);
        d.output.connectTo(Subtract2.right);
        Subtract2.output.connectTo(Sign.input);
        Sign.output.connectTo(Max.left);
        ce.output.connectTo(Max.right);
        Max.output.connectTo(Lerp.gradient);
        Lerp.output.connectTo(fragmentOutput.rgba);
        
        // Output nodes
        nodeMaterial.addOutputNode(vertexOutput);
        nodeMaterial.addOutputNode(fragmentOutput);
        nodeMaterial.build();

        //nodeMaterial.depthFunction = Engine.LEQUAL;
        nodeMaterial.forceDepthWrite = true;
        
        return nodeMaterial;
    }

    public render(): void {
        this._skyBox.position.copyFrom(this.camera.position);
        this.scene.render();

        /*if (this._animateLight && this._autoCalcShadowZBounds) {
            this._lightNearPlane = this.sun.shadowMinZ;
            this._lightFarPlane = this.sun.shadowMaxZ;

            const event = new CustomEvent('gui_set_value', { detail: { type: 'setShadowZBounds' } });

            window.dispatchEvent(event);
        }*/
    }

}
