import {
    DirectionalLight,
    Scene,
    Vector3,
    UniversalCamera,
    HemisphericLight,
    Matrix,
    Mesh,
    InternalTexture,
    Nullable,
    Engine,
    PassPostProcess,
    Texture,
    Effect,
    PostProcess,
    PostProcessRenderPipeline,
    PostProcessRenderEffect,
    RenderTargetTexture,
    Constants,
    PostProcessManager,
} from "babylonjs";

import SampleBasic from "../SampleBasic";
import Utils from "../Utils";

export default class DepthMinMax extends SampleBasic {

    private _dummyFramebuffer: WebGLFramebuffer;
    private _skyBox: Mesh;

    protected async populateScene(scene: Scene, camera: UniversalCamera) {
        camera.position.x = 40;
        camera.position.y = 5;
        camera.position.z = 5;

        camera.fov = Math.PI / 4 * 0.75;
        camera.minZ = 0.25;
        camera.maxZ = 250;

        camera.setTarget(new Vector3(39, 5, 5));

        //this._skyBox = Utils.addSkybox("Clouds.dds", scene, 100);

        await Utils.loadObj(scene, "./resources/3d/powerplant/", "powerplant.obj");

        const scaling = 0.5;

        scene.meshes.forEach((m) => {
            if (m.name == 'skyBox') { return; }

            if (!m.material) { return; }

            let matrix = Matrix.Identity();
            matrix.scaleToRef(scaling, matrix);
            matrix.setRowFromFloats(3, 0, 0, 0, 1);
            (m as Mesh).bakeTransformIntoVertices(matrix);
            m.refreshBoundingInfo();
        });

        let sunDir = new Vector3(32, -30, 22);

        let sun = new DirectionalLight("sun", sunDir, scene);
        sun.intensity = 1;

        let hemil = new HemisphericLight("hemil", new Vector3(0, 1, 0), scene);
        hemil.intensity = 1;

        var depthRenderer = scene.enableDepthRenderer(camera, false);

        depthRenderer.getDepthMap().updateSamplingMode(Constants.TEXTURE_NEAREST_NEAREST/*Texture.NEAREST_SAMPLINGMODE*/);
        depthRenderer.useOnlyInActiveCamera = true;
        depthRenderer.getDepthMap().ignoreCameraViewport = false;

        var depthMap = depthRenderer.getDepthMap();

        //
        Effect.ShadersStore.depthReductionInitialFragmentShader = `
            #version 300 es
            precision highp float;
            precision highp int;

            in vec2 vUV;

            uniform sampler2D textureSampler;
            uniform sampler2D depthTexture;

            //#define METHOD1

            out vec2 glFragColor;

            void main(void)
            {
            #ifdef METHOD1
                ivec2 size = textureSize(depthTexture, 0);
                vec2 texelSize = vec2(1.0 / float(size.x), 1.0 / float(size.y));

                float f1 = texture(depthTexture, vUV).r;
                float f2 = texture(depthTexture, vUV + vec2(texelSize.x, 0.0)).r;
                float f3 = texture(depthTexture, vUV + vec2(texelSize.x, texelSize.y)).r;
                float f4 = texture(depthTexture, vUV + vec2(0.0, texelSize.y)).r;
            #else
                vec2 size = vec2(textureSize(depthTexture, 0) - 1);
                vec2 texcoord = vUV * size;
                ivec2 coord = ivec2(texcoord);

                float f1 = texelFetch(depthTexture, coord, 0).r;
                float f2 = texelFetch(depthTexture, coord + ivec2(1, 0), 0).r;
                float f3 = texelFetch(depthTexture, coord + ivec2(1, 1), 0).r;
                float f4 = texelFetch(depthTexture, coord + ivec2(0, 1), 0).r;
            #endif

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

            //#define METHOD1

            out vec2 glFragColor;

            void main(void)
            {
            #ifdef METHOD1
                ivec2 size = textureSize(textureSampler, 0);
                vec2 texelSize = vec2(1.0 / float(size.x), 1.0 / float(size.y));

                vec2 f1 = texture(textureSampler, vUV).rg;
                vec2 f2 = texture(textureSampler, vUV + vec2(texelSize.x, 0.0)).rg;
                vec2 f3 = texture(textureSampler, vUV + vec2(texelSize.x, texelSize.y)).rg;
                vec2 f4 = texture(textureSampler, vUV + vec2(0.0, texelSize.y)).rg;
            #else
                vec2 size = vec2(textureSize(textureSampler, 0) - 1);
                vec2 texcoord = vUV * size;
                ivec2 coord = ivec2(texcoord);

                vec2 f1 = texelFetch(textureSampler, coord, 0).rg;
                vec2 f2 = texelFetch(textureSampler, coord + ivec2(1, 0), 0).rg;
                vec2 f3 = texelFetch(textureSampler, coord + ivec2(1, 1), 0).rg;
                vec2 f4 = texelFetch(textureSampler, coord + ivec2(0, 1), 0).rg;
            #endif

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
                vec2 f1 = texelFetch(textureSampler, ivec2(0), 0).rg;

                glFragColor = f1;
            }
        `;

        //var imagePass = new PassPostProcess("imagePass", 1.0, null, Texture.NEAREST_SAMPLINGMODE, this._engine);

        var depthReductionPhases: PostProcess[] = [];

        // phase 0
        var depthReductionInitial = new (PostProcess as any)(
            'Initial depth reduction phase',
            'depthReductionInitial',  // shader
            null,
            ['depthTexture'], // textures
            1.0,  // options
            null, // camera
            Constants.TEXTURE_NEAREST_NEAREST, // sampling
            this._engine, // engine
            false, // reusable
            undefined, // defines
            Constants.TEXTURETYPE_HALF_FLOAT,
            undefined,
            undefined,
            undefined,
            Constants.TEXTUREFORMAT_RG,
        );

        depthReductionInitial.autoClear = false;
        depthReductionInitial.forceFullscreenViewport = false;

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

            console.log(w, h);

            depthReduction = new (PostProcess as any)(
                'Depth reduction phase ' + index,
                (w == 1 && h == 1) ? 'depthReductionLast' : (w == 1 || h == 1) ? 'depthReductionALast' : 'depthReduction',  // shader
                null, // attributes
                null,
                { width: w, height: h },  // options
                null, // camera
                Constants.TEXTURE_NEAREST_NEAREST, // sampling
                this._engine, // engine
                false, // reusable
                undefined, // defines
                Constants.TEXTURETYPE_HALF_FLOAT,
                undefined,
                undefined,
                undefined,
                Constants.TEXTUREFORMAT_RG,
            );

            depthReduction.autoClear = false;
            depthReduction.forceFullscreenViewport = false;

            depthReductionPhases.push(depthReduction);

            index++;

            if ((w == 1 && h == 1) || (w == 2 && h == 1)/* || (w == 6 && h == 3)*/) {
                let func = (w: number, h: number, depthReduction: PostProcess) => {
                    let first0 = true;
                    let buffer0 = new Float32Array(4 * w * h);
                    return () => {
                        if (first0) {
                            let texture = depthReduction.inputTexture;
                            this._readTexturePixels(scene.getEngine(), texture, w, h, -1, 0, buffer0);
                            if ((buffer0[0] != 0 && buffer0[0] != 1) || buffer0[1] != 0) {
                                first0 = false;
                                console.log('w = ' + w + ', h = ' + h, buffer0);
                            }
                        }
                    };
                };
                depthReduction.onAfterRenderObservable.add(func(w, h, depthReduction));

            }
        }

        /*var imagePass = new (PassPostProcess as any)(
            "imagePass",
            { width: w, height: h },
            null,
            Constants.TEXTURE_NEAREST_NEAREST,
            this._engine,
            false,
            Constants.TEXTURETYPE_HALF_FLOAT,
            undefined,
            Constants.TEXTUREFORMAT_RG,
        );

        imagePass.autoClear = false;
        imagePass.forceFullscreenViewport = false;

        depthReductionPhases.push(imagePass);

        imagePass.onApply = (effect: Effect) => {
            effect.setTextureFromPostProcess('textureSampler', depthReductionPhases[1]);
        };*/

        // the render pipeline
        /*var pipeline = new PostProcessRenderPipeline(this._engine, 'pipeline');
        var renderPasses = new PostProcessRenderEffect(
            this._engine, 'renderPasses', function() { return depthReductionPhases; });

        pipeline.addEffect(renderPasses);
        scene.postProcessRenderPipelineManager.addPipeline(pipeline);
        scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline('pipeline', camera);*/

        let postProcessManager = new PostProcessManager(scene);

        scene.onBeforeDrawPhaseObservable.add(() => {
            //postProcessManager._prepareFrame(depthMap.getInternalTexture(), depthReductionPhases);
            depthReductionPhases[0].activate(camera, depthMap.getInternalTexture());

            postProcessManager.directRender(depthReductionPhases, depthReductionPhases[0].inputTexture, false);

            this._engine.unBindFramebuffer(depthReductionPhases[0].inputTexture, false);
        });

        var buffer = new Float32Array(4 * depthMap.getSize().width * depthMap.getSize().height);

        let first = true;

        scene.onBeforeRenderObservable.add(() => {
            if (this._skyBox) {
                this._skyBox.position.copyFrom(camera.position);
            }
        });

        scene.onAfterRenderObservable.add(() => {

            if (first) {
                this._readTexturePixels(scene.getEngine(), depthMap._texture!, depthMap.getSize().width, depthMap.getSize().height, -1, 0, buffer);
                first = false;
                console.log('calc min max', this.calcMinMax(buffer));
                console.log(buffer);
            }

        });

        return Promise.resolve(0);
    }

    public _readTexturePixels(engine: Engine, texture: InternalTexture, width: number, height: number, faceIndex = -1, level = 0, buffer: Nullable<ArrayBufferView> = null): ArrayBufferView {
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
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, texture._hardwareTexture?.underlyingResource, level);
        } else {
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture._hardwareTexture?.underlyingResource, level);
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

    protected calcMinMax(buffer: Float32Array): [number, number] {
        let min = 1, max = 0;

        for (let i = 0; i < buffer.length; i += 4) {
            let f = buffer[i];

            if (f < min) {
                min = f;
            }
            if (f > max && f < 1.0) {
                max = f;
            }
        }

        return [min, max];
    }

}

SampleBasic.registerSampleClass("depthminmax", {
    "displayName": "Calculate depth min and max in scene zbuffer",
    "description": "",
    "class": DepthMinMax,
});
