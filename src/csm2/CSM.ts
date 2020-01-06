import {
    CascadedShadowGenerator,
    Scene,
    ShadowGenerator,
    StandardMaterial,
    UniversalCamera,
    Vector3,
    Constants,
    Effect,
    PostProcess,
    PostProcessManager,
    Engine,
    InternalTexture,
    Nullable,
    Matrix,
} from "babylonjs";

import Sample from "../Sample";
import StandardShadow from "./StandardShadow";
import CSMGUI from "./CSMGUI";
//import { CascadedShadowGenerator } from "./cascadedShadowGenerator";

export default class CSM extends StandardShadow {

    public static className: string = "CSM";

    private _dummyFramebuffer: WebGLFramebuffer;
    private _oldMin: number = -1;
    private _oldMax: number = -1;

    constructor(scene: Scene, camera: UniversalCamera, parent: Sample, name: string) {
        super(scene, camera, parent, name);

        this._shadowMapFilter = CascadedShadowGenerator.FILTER_PCF;

        (window as any).csm = this;

        this.initializeDepthReduction();
    }

    protected initializeDepthReduction(): void {
        var depthRenderer = this.scene.enableDepthRenderer(this.camera, false);

        depthRenderer.getDepthMap().updateSamplingMode(Constants.TEXTURE_NEAREST_NEAREST/*Texture.NEAREST_SAMPLINGMODE*/);
        //depthRenderer.useOnlyInActiveCamera = true;
        //depthRenderer.getDepthMap().useCameraPostProcesses = false;
        //depthRenderer.getDepthMap().ignoreCameraViewport = true;

        var depthMap = depthRenderer.getDepthMap();

        //
        Effect.ShadersStore.depthReductionInitialFragmentShader = `
            #version 300 es
            precision highp float;
            precision highp int;

            in vec2 vUV;

            uniform sampler2D textureSampler;
            uniform sampler2D depthTexture;

            out vec2 glFragColor;

            void main(void)
            {
                vec2 size = vec2(textureSize(depthTexture, 0) - 1);
                vec2 texcoord = vUV * size;
                ivec2 coord = ivec2(texcoord);

                float f1 = texelFetch(depthTexture, coord, 0).r;
                float f2 = texelFetch(depthTexture, coord + ivec2(1, 0), 0).r;
                float f3 = texelFetch(depthTexture, coord + ivec2(1, 1), 0).r;
                float f4 = texelFetch(depthTexture, coord + ivec2(0, 1), 0).r;

                float minz = min(min(min(f1, f2), f3), f4);
                float maxz = max(max(max(sign(1.0 - f1) * f1, sign(1.0 - f2) * f2), sign(1.0 - f3) * f3), sign(1.0 - f4) * f4);

                glFragColor = vec2(minz, maxz);
            }
        `;

        //
        Effect.ShadersStore.depthReductionFragmentShader = `
            #version 300 es
            precision highp float;
            precision highp int;

            in vec2 vUV;

            uniform sampler2D textureSampler;

            out vec2 glFragColor;

            void main(void)
            {
                vec2 size = vec2(textureSize(textureSampler, 0) - 1);
                vec2 texcoord = vUV * size;
                ivec2 coord = ivec2(texcoord);

                vec2 f1 = texelFetch(textureSampler, coord, 0).rg;
                vec2 f2 = texelFetch(textureSampler, coord + ivec2(1, 0), 0).rg;
                vec2 f3 = texelFetch(textureSampler, coord + ivec2(1, 1), 0).rg;
                vec2 f4 = texelFetch(textureSampler, coord + ivec2(0, 1), 0).rg;

                float minz = min(min(min(f1.x, f2.x), f3.x), f4.x);
                float maxz = max(max(max(f1.y, f2.y), f3.y), f4.y);

                glFragColor = vec2(minz, maxz);
            }
        `;

        //
        Effect.ShadersStore.depthReductionALastFragmentShader = `
            #version 300 es
            precision highp float;
            precision highp int;

            in vec2 vUV;

            uniform sampler2D textureSampler;

            out vec2 glFragColor;

            void main(void)
            {
                ivec2 size = textureSize(textureSampler, 0);
                vec2 texcoord = vUV * (vec2(size - 1));
                ivec2 coord = ivec2(texcoord);

                vec2 f1 = texelFetch(textureSampler, coord % size, 0).rg;
                vec2 f2 = texelFetch(textureSampler, (coord + ivec2(1, 0)) % size, 0).rg;
                vec2 f3 = texelFetch(textureSampler, (coord + ivec2(1, 1)) % size, 0).rg;
                vec2 f4 = texelFetch(textureSampler, (coord + ivec2(0, 1)) % size, 0).rg;

                float minz = min(f1.x, f2.x);
                float maxz = max(f1.y, f2.y);

                glFragColor = vec2(minz, maxz);
            }
        `;

        //
        Effect.ShadersStore.depthReductionLastFragmentShader = `
            #version 300 es
            precision highp float;
            precision highp int;

            in vec2 vUV;

            uniform sampler2D textureSampler;

            out vec2 glFragColor;

            void main(void)
            {
                discard;
                glFragColor = vec2(0.);
            }
        `;

        var depthReductionPhases: PostProcess[] = [];

        // phase 0
        var depthReductionInitial = new PostProcess(
            'Initial depth reduction phase',
            'depthReductionInitial',  // shader
            null,
            ['depthTexture'], // textures
            1.0,  // options
            null, // camera
            Constants.TEXTURE_NEAREST_NEAREST, // sampling
            this.scene.getEngine(), // engine
            false, // reusable
            undefined, // defines
            Constants./*TEXTURETYPE_UNSIGNED_SHORT*/TEXTURETYPE_HALF_FLOAT,
            undefined,
            undefined,
            undefined,
            Constants./*TEXTUREFORMAT_RG_INTEGER*/TEXTUREFORMAT_RG,
        );

        depthReductionInitial.autoClear = false;
        //depthReductionInitial.forceFullscreenViewport = true;

        depthReductionInitial.onApply = (effect: Effect) => {
            effect.setTexture('depthTexture', depthMap);
        };

        depthReductionPhases.push(depthReductionInitial);

        let w = depthMap.getSize().width, h = depthMap.getSize().height;
        let index = 1;
        let depthReduction: PostProcess;

        while (w > 1 || h > 1) {
            w = Math.max(Math.round(w / 2), 1);
            h = Math.max(Math.round(h / 2), 1);

            //console.log(w, h);

            depthReduction = new PostProcess(
                'Depth reduction phase ' + index,
                (w == 1 && h == 1) ? 'depthReductionLast' : (w == 1 || h == 1) ? 'depthReductionALast' : 'depthReduction',  // shader
                null, // attributes
                null,
                { width: w, height: h },  // options
                null, // camera
                Constants.TEXTURE_NEAREST_NEAREST, // sampling
                this.scene.getEngine(), // engine
                false, // reusable
                undefined, // defines
                Constants./*TEXTURETYPE_UNSIGNED_SHORT*/TEXTURETYPE_HALF_FLOAT,
                undefined,
                undefined,
                undefined,
                Constants./*TEXTUREFORMAT_RG_INTEGER*/TEXTUREFORMAT_RG,
            );

            depthReduction.autoClear = false;
            //depthReduction.forceFullscreenViewport = true;

            depthReductionPhases.push(depthReduction);

            index++;

            if (w == 1 && h == 1) {
                let func = (w: number, h: number, depthReduction: PostProcess) => {
                    let first0 = true;
                    let buffer0 = new Float32Array(4 * w * h);
                    return () => {
                        if (first0) {
                            let texture = depthReduction.inputTexture;
                            this._readTexturePixels(this.scene.getEngine(), texture, w, h, -1, 0, buffer0);
                            let min = buffer0[0], max = buffer0[1];
                            if (min >= max || !this._csmAutoCalcDepthBounds) {
                                min = 0;
                                max = 1;
                            }
                            if (min != this._oldMin || max != this._oldMax) {
                                this.getCSMGenerator().setMinMaxDistance(min, max);
                                this._oldMin = min;
                                this._oldMax = max;
                                //console.log(min, max);
                            }
                        }
                    };
                };
                depthReduction.onAfterRenderObservable.add(func(w, h, depthReduction));

            }
        }

        let postProcessManager = new PostProcessManager(this.scene);

        depthMap.onAfterUnbindObservable.add(() => {
            if (this._csmAutoCalcDepthBounds) {
                depthReductionPhases[0].activate(this.camera, depthMap.getInternalTexture());

                postProcessManager.directRender(depthReductionPhases, depthReductionPhases[0].inputTexture, false);

                this.scene.getEngine().unBindFramebuffer(depthReductionPhases[0].inputTexture, false);
            }
        });
    }

    protected _readTexturePixels(engine: Engine, texture: InternalTexture, width: number, height: number, faceIndex = -1, level = 0, buffer: Nullable<ArrayBufferView> = null): ArrayBufferView {
        let gl = engine._gl;
        if (!this._dummyFramebuffer) {
            let dummy = gl.createFramebuffer();

            if (!dummy) {
                throw new Error("Unable to create dummy framebuffer");
            }

            this._dummyFramebuffer = dummy;
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._dummyFramebuffer);

        if (faceIndex > -1) {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, texture._webGLTexture, level);
        } else {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture._webGLTexture, level);
        }

        let readType = (texture.type !== undefined) ? engine._getWebGLTextureType(texture.type) : gl.UNSIGNED_BYTE;

        switch (readType) {
            case gl.UNSIGNED_BYTE:
                if (!buffer) {
                    buffer = new Uint8Array(4 * width * height);
                }
                readType = gl.UNSIGNED_BYTE;
                break;
            default:
                if (!buffer) {
                    buffer = new Float32Array(4 * width * height);
                }
                readType = gl.FLOAT;
                break;
        }

        gl.readPixels(0, 0, width, height, gl.RGBA, readType, <DataView>buffer);
        gl.bindFramebuffer(gl.FRAMEBUFFER, (engine as any)._currentFramebuffer);

        return buffer;
    }

    protected getCSMGenerator(): CascadedShadowGenerator {
        return (this._shadowGenerator as unknown as CascadedShadowGenerator);
    }

    public get cameraNearPlane(): number {
        return this._cameraNearPlane;
    }

    public set cameraNearPlane(cnp: number) {
        this._cameraNearPlane = cnp;
        this.camera.minZ = cnp;
        const val = this.getCSMGenerator().shadowMaxZ;
        this.getCSMGenerator().shadowMaxZ = this._cameraNearPlane; // make shadowMaxZ change
        this.getCSMGenerator().shadowMaxZ = val; // so trigger a cascade recomputation
    }

    public get cameraFarPlane(): number {
        return this._cameraFarPlane;
    }

    public set cameraFarPlane(cfp: number) {
        this._cameraFarPlane = cfp;
        this.camera.maxZ = cfp;
        const val = this.getCSMGenerator().shadowMaxZ;
        this.getCSMGenerator().shadowMaxZ = this._cameraNearPlane; // make shadowMaxZ change
        this.getCSMGenerator().shadowMaxZ = val; // so trigger a cascade recomputation
        this._csmShadowMaxZ = this.getCSMGenerator().shadowMaxZ;

        const event = new CustomEvent('gui_set_value', { detail: { type: 'setShadowMaxZ' } });
        window.dispatchEvent(event);
    }

    public get csmNumCascades(): number {
        return this._csmNumCascades;
    }

    public set csmNumCascades(num: number) {
        this._csmNumCascades = num;
        this.getCSMGenerator().numCascades = num;
    }

    public get csmActiveCascade(): number {
        return this._csmActiveCascade;
    }

    public set csmActiveCascade(cac: number) {
        this._csmActiveCascade = cac;

        this.setShadowMapViewerTexture();
        this.buildLightHelper();
    }

    public get csmVisualizeCascades(): boolean {
        return this._csmVisualizeCascades;
    }

    public set csmVisualizeCascades(cvc: boolean) {
        this._csmVisualizeCascades = cvc;
        this.getCSMGenerator().debug = cvc;
    }

    public get csmStabilizeCascades(): boolean {
        return this._csmStabilizeCascades;
    }

    public set csmStabilizeCascades(ssc: boolean) {
        this._csmStabilizeCascades = ssc;
        this.getCSMGenerator().stabilizeCascades = ssc;
        window.setTimeout(this.buildLightHelper.bind(this), 100);
    }

    public get csmDepthClamp(): boolean {
        return this._csmDepthClamp;
    }

    public set csmDepthClamp(cdc: boolean) {
        this._csmDepthClamp = cdc;
        this.getCSMGenerator().depthClamp = cdc;
        window.setTimeout(this.buildLightHelper.bind(this), 100);
    }

    public get csmLambda(): number {
        return this._csmLambda;
    }

    public set csmLambda(cl: number) {
        this._csmLambda = cl;
        this.getCSMGenerator().lambda = cl;
    }

    public get csmSplitBlendPercentage(): number {
        return this._csmSplitBlendPercentage;
    }

    public set csmSplitBlendPercentage(csbp: number) {
        this._csmSplitBlendPercentage = csbp;
        this.getCSMGenerator().cascadeBlendPercentage = csbp;
    }

    public get csmPenumbraDarkness(): number {
        return this._csmPenumbraDarkness;
    }

    public set csmPenumbraDarkness(cpd: number) {
        this._csmPenumbraDarkness = cpd;
        this.getCSMGenerator().penumbraDarkness = cpd;
    }

    public get csmShadowMaxZ(): number {
        return this._csmShadowMaxZ;
    }

    public set csmShadowMaxZ(csmz: number) {
        this._csmShadowMaxZ = csmz;
        this.getCSMGenerator().shadowMaxZ = csmz;
        this._csmShadowMaxZ = this.getCSMGenerator().shadowMaxZ;

        const event = new CustomEvent('gui_set_value', { detail: { type: 'setShadowMaxZ' } });
        window.dispatchEvent(event);
    }

    public get csmAutoCalcDepthBounds(): boolean {
        return this._csmAutoCalcDepthBounds;
    }

    public set csmAutoCalcDepthBounds(cacdb: boolean) {
        this._csmAutoCalcDepthBounds = cacdb;
        if (!cacdb) {
            this._oldMin = 0;
            this._oldMax = 1;
            this.getCSMGenerator().setMinMaxDistance(0, 1);
        }
    }

    protected getLightExtents(): { min: Vector3, max: Vector3 } | null {
        const min = this.getCSMGenerator().getCascadeMinExtents(this._csmActiveCascade),
              max = this.getCSMGenerator().getCascadeMaxExtents(this._csmActiveCascade);

        return {
            "min": min!,
            "max": max!,
        }
    }

    protected getViewMatrix(): Matrix | null {
        return this.getCSMGenerator().getCascadeViewMatrix(this._csmActiveCascade);
    }

    public createGUI(): void {
        this.gui = new CSMGUI(this.name, this.scene.getEngine(), this._container, this);

        this.gui.createGUI();
    }

    protected createGenerator(): ShadowGenerator {
        const generator = new CascadedShadowGenerator(this.shadowMapSize, this.sun);

        generator.numCascades = this._csmNumCascades;

        return generator as unknown as ShadowGenerator;
    }

    protected setShadowMapViewerTexture(): void {
        (this._shadowMapPlane.material as StandardMaterial).diffuseTexture = this.getCSMGenerator().getShadowMap();
    }

    protected createShadowGenerator(): void {
        super.createShadowGenerator();

        const shadowGenerator = this.getCSMGenerator();

        shadowGenerator.stabilizeCascades = this._csmStabilizeCascades;
        shadowGenerator.depthClamp = this._csmDepthClamp;
        shadowGenerator.lambda = this._csmLambda;
        shadowGenerator.debug = this._csmVisualizeCascades
        shadowGenerator.cascadeBlendPercentage = this._csmSplitBlendPercentage;
        shadowGenerator.penumbraDarkness = this._csmPenumbraDarkness;
        shadowGenerator.shadowMaxZ = this._csmShadowMaxZ;
        shadowGenerator.freezeShadowCastersBoundingInfo = true;

        this.setShadowMapViewerTexture();
    }

}
