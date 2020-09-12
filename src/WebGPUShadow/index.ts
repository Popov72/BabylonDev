import SampleBasic from "../SampleBasic";

import glslangModule from './glslang';
import { vec3 } from 'gl-matrix';
import { checkWebGPUSupport, createTextureFromImage } from './helpers';
import { GPUTextureHelper } from "./gpuTextureHelper";
import { Camera } from "./camera";
import { BasicControl } from "./BasicControl";
import { PrimitiveTopology, FilterMode, CompareFunction, TextureFormat, VertexFormat, CullMode, StoreOp, IndexFormat } from "@webgpu/types/dist/constants";
import { mainVertexShaderGLSL, mainFragmentShaderGLSL, shadowmapVertexShaderGLSL, shadowmapFragmentShaderGLSL } from "./shaders";

const useMipmap = false;

const swapChainFormat = "bgra8unorm";

export class WebGPUShadow {

    protected _device: GPUDevice;
    protected _glslang: any;
    protected _swapChain: GPUSwapChain;
    protected _colorTexture: GPUTexture;
    protected _colorTextureView: GPUTextureView;
    protected _depthTexture: GPUTexture;
    protected _depthTextureView: GPUTextureView;
    protected _msaaTexture: GPUTexture;
    protected _msaaTextureView: GPUTextureView;
    protected _shadowmapTexture: GPUTexture;
    protected _shadowmapTextureView: GPUTextureView;
    protected _depthTextureShadowmap: GPUTexture;
    protected _depthTextureShadowmapView: GPUTextureView;

    protected _canvas: HTMLCanvasElement;
    protected _sunDir: Float32Array;
    protected _camera: Camera;
    protected _basicControl: BasicControl;

    constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas;
        this._sunDir = new Float32Array([-1, -1, -1]);
        vec3.normalize(this._sunDir, this._sunDir);
        this._camera = new Camera(0.5890486225480862, 1);

        this._camera.position = [40, 5, 5];
        this._camera.setTarget([0, 0, 5]);

        this._basicControl = new BasicControl(this._camera, { move: 0.02, rotation: 0.04, mouserotation: 0.008 });

        (window as any).cam = this._camera;
    }

    public async run() {
        if (!checkWebGPUSupport()) {
            return;
        }

        const width = this._canvas.width;
        const height = this._canvas.height;

        this._canvas.style.display = "none";

        this._canvas = document.createElement('canvas');
        this._canvas.width = width;
        this._canvas.height = height;

        document.body.appendChild(this._canvas);

        const frame = await this.init(this._canvas);

        window.onresize = () => {
            this._canvas.width = window.innerWidth;
            this._canvas.height = window.innerHeight;
            this._resize();
        };

        function doFrame(timestamp: any) {
            frame(timestamp);
            requestAnimationFrame(doFrame);
        }

        requestAnimationFrame(doFrame);
    }

    protected async _initWebGPU() {
        const adapter = await navigator.gpu!.requestAdapter() as GPUAdapter;

        console.log("Adapter limits=", adapter.limits);

        this._device = await adapter.requestDevice() as GPUDevice;
        this._glslang = await glslangModule();

        const context = this._canvas.getContext('gpupresent');

        // @ts-ignore:
        this._swapChain = context.configureSwapChain({
            device: this._device,
            format: swapChainFormat,
        });
    }

    protected async _makeGeometryBuffers(): Promise<[GPUBuffer, GPUBuffer, any]> {
        const scene: any = await fetch("/resources/webgpu/powerplant2.json").then((response) => response.json());

        console.log(scene.indices.length);

        const vertexArray = new Float32Array(scene.vertexArray);

        const verticesBuffer = this._device.createBuffer({
            size: vertexArray.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });
        new Float32Array(verticesBuffer.getMappedRange()).set(vertexArray);
        verticesBuffer.unmap();

        const indices = new Uint32Array(scene.indices);

        const indicesBuffer = this._device.createBuffer({
            size: indices.byteLength,
            usage: GPUBufferUsage.INDEX,
            mappedAtCreation: true,
        });
        new Uint32Array(indicesBuffer.getMappedRange()).set(indices);
        indicesBuffer.unmap();

        return [verticesBuffer, indicesBuffer, scene];
    }

    protected async _createBindGroup(bindGroupLayout: GPUBindGroupLayout): Promise<[GPUBuffer, GPUBuffer, GPUBindGroup]> {
        const vertexUniformBufferSize = 4 * 16; // 4x4 matrix
        const vertexUniformBuffer = this._device.createBuffer({
            size: vertexUniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const fragmentUniformBufferSize = 4 * 3; // vec3 light direction
        const fragmentUniformBuffer = this._device.createBuffer({
            size: fragmentUniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        let atlasTexture: GPUTexture;

        if (useMipmap) {
            const textureHelper = new GPUTextureHelper(this._device, this._glslang);

            atlasTexture = await textureHelper.generateMipmappedTexture('/resources/webgpu/powerplant2.png');
        } else {
            atlasTexture = await createTextureFromImage(this._device, '/resources/webgpu/powerplant2.png', GPUTextureUsage.SAMPLED);
        }

        const sampler = this._device.createSampler({
            magFilter: FilterMode.Linear,
            minFilter: FilterMode.Linear,
            mipmapFilter: FilterMode.Linear,
        });

        const samplerShadowmap = this._device.createSampler({
            magFilter: FilterMode.Nearest,
            minFilter: FilterMode.Nearest,
        });

        const uniformBindGroup = this._device.createBindGroup({
            layout: bindGroupLayout,
            entries: [{
                binding: 0,
                resource: {
                    buffer: vertexUniformBuffer,
                },
            }, {
                binding: 1,
                resource: sampler,
            }, {
                binding: 2,
                resource: atlasTexture.createView(),
            }, {
                binding: 3,
                resource: {
                    buffer: fragmentUniformBuffer,
                },
            }, {
                binding: 4,
                resource: samplerShadowmap,
            }, {
                binding: 5,
                resource: this._depthTextureShadowmapView,
            }],
        });

        return [vertexUniformBuffer, fragmentUniformBuffer, uniformBindGroup];
    }

    protected async _createBindGroupForShadowmap(bindGroupLayout: GPUBindGroupLayout): Promise<[GPUBuffer, GPUBindGroup]> {
        const vertexUniformBufferSize = 4 * 16; // 4x4 matrix
        const vertexUniformBuffer = this._device.createBuffer({
            size: vertexUniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const uniformBindGroup = this._device.createBindGroup({
            layout: bindGroupLayout,
            entries: [{
                binding: 0,
                resource: {
                    buffer: vertexUniformBuffer,
                },
            }],
        });

        return [vertexUniformBuffer, uniformBindGroup];
    }

    protected _createPiplineForMainRender(scene: any) {
        return this._device.createRenderPipeline({
            vertexStage: {
                module: this._device.createShaderModule({
                    code: this._glslang.compileGLSL(mainVertexShaderGLSL, "vertex"),

                    // @ts-ignore
                    source: mainVertexShaderGLSL,
                    transform: (source: any) => this._glslang.compileGLSL(source, "vertex"),
                }),
                entryPoint: "main"
            },

            fragmentStage: {
                module: this._device.createShaderModule({
                    code: this._glslang.compileGLSL(mainFragmentShaderGLSL, "fragment"),

                    // @ts-ignore
                    source: mainFragmentShaderGLSL,
                    transform: (source: any) => this._glslang.compileGLSL(source, "fragment"),
                }),
                entryPoint: "main"
            },

            primitiveTopology: PrimitiveTopology.TriangleList,

            depthStencilState: {
                depthWriteEnabled: true,
                depthCompare: CompareFunction.Less,
                format: TextureFormat.Depth24PlusStencil8,
            },

            sampleCount: 4,

            vertexState: {
                vertexBuffers: [{
                    arrayStride: scene.vertexSize,
                    attributes: [{
                        // position
                        shaderLocation: 0,
                        offset: scene.positionOffset,
                        format: VertexFormat.Float4
                    }, {
                        // uv
                        shaderLocation: 1,
                        offset: scene.uvOffset,
                        format: VertexFormat.Float2
                    }, {
                        // tileinfo
                        shaderLocation: 2,
                        offset: scene.tileinfoOffset,
                        format: VertexFormat.Float4
                    }, {
                        // normal
                        shaderLocation: 3,
                        offset: scene.normalOffset,
                        format: VertexFormat.Float4
                    }]
                }],
            },

            rasterizationState: {
                cullMode: CullMode.None,
            },

            colorStates: [{
                format: TextureFormat.BGRA8Unorm,
            }],
        });
    }

    protected _createPiplineForShadowmapRender(scene: any) {
        return this._device.createRenderPipeline({
            vertexStage: {
                module: this._device.createShaderModule({
                    code: this._glslang.compileGLSL(shadowmapVertexShaderGLSL, "vertex"),

                    // @ts-ignore
                    source: shadowmapVertexShaderGLSL,
                    transform: (source: any) => this._glslang.compileGLSL(source, "vertex"),
                }),
                entryPoint: "main"
            },

            fragmentStage: {
                module: this._device.createShaderModule({
                    code: this._glslang.compileGLSL(shadowmapFragmentShaderGLSL, "fragment"),

                    // @ts-ignore
                    source: shadowmapFragmentShaderGLSL,
                    transform: (source: any) => this._glslang.compileGLSL(source, "fragment"),
                }),
                entryPoint: "main"
            },

            primitiveTopology: PrimitiveTopology.TriangleList,

            depthStencilState: {
                depthWriteEnabled: true,
                depthCompare: CompareFunction.Less,
                format: TextureFormat.Depth32Float,
            },

            sampleCount: 1,

            vertexState: {
                vertexBuffers: [{
                    arrayStride: scene.vertexSize,
                    attributes: [{
                        // position
                        shaderLocation: 0,
                        offset: scene.positionOffset,
                        format: VertexFormat.Float4
                    }]
                }],
            },

            rasterizationState: {
                cullMode: CullMode.None,
            },

            colorStates: [{
                format: TextureFormat.BGRA8Unorm,
                /*writeMask: 0,*/
            }],
        });
    }

    protected _resize() {
        this._camera.aspect = Math.abs(this._canvas.width / this._canvas.height);

        // main render
        if (this._depthTexture) {
            this._depthTexture.destroy();
        }

        this._depthTexture = this._device.createTexture({
            size: {
                width: this._canvas.width,
                height: this._canvas.height,
                depth: 1
            },
            format: TextureFormat.Depth24PlusStencil8,
            usage: GPUTextureUsage.OUTPUT_ATTACHMENT,
            sampleCount: 4
        });

        this._depthTextureView = this._depthTexture.createView();

        if (this._msaaTexture) {
            this._msaaTexture.destroy();
        }

        this._msaaTexture = this._device.createTexture({
            size: {
                width: this._canvas.width,
                height: this._canvas.height,
                depth: 1
            },
            sampleCount: 4,
            format: swapChainFormat,
            usage: GPUTextureUsage.OUTPUT_ATTACHMENT
        });

        this._msaaTextureView = this._msaaTexture.createView();

        if (this._shadowmapTexture) {
            this._shadowmapTexture.destroy();
        }

        // shadowmap
        this._shadowmapTexture = this._device.createTexture({
            size: {
                width: this._canvas.width,
                height: this._canvas.height,
                depth: 1
            },
            sampleCount: 1,
            format: TextureFormat.BGRA8Unorm, // todo: why can't I use another format?
            usage: GPUTextureUsage.OUTPUT_ATTACHMENT
        });

        this._shadowmapTextureView = this._shadowmapTexture.createView();

        if (this._depthTextureShadowmap) {
            this._depthTextureShadowmap.destroy();
        }

        this._depthTextureShadowmap = this._device.createTexture({
            size: {
                width: this._canvas.width,
                height: this._canvas.height,
                depth: 1
            },
            format: TextureFormat.Depth32Float,
            usage: GPUTextureUsage.OUTPUT_ATTACHMENT | GPUTextureUsage.SAMPLED,
            sampleCount: 1
        });

        this._depthTextureShadowmapView = this._depthTextureShadowmap.createView();

    }

    public async init(canvas: HTMLCanvasElement) {
        await this._initWebGPU();

        this._resize();

        let [verticesBuffer, indicesBuffer, scene] = await this._makeGeometryBuffers();

        const pipelineMain = await this._createPiplineForMainRender(scene);
        const pipelineShadowmap = await this._createPiplineForShadowmapRender(scene);

        let [vertexUniformBufferMain, fragmentUniformBufferMain, uniformBindGroupMain] = await this._createBindGroup(pipelineMain.getBindGroupLayout(0));
        let [vertexUniformBufferShadowmap, uniformBindGroupShadowmap] = await this._createBindGroupForShadowmap(pipelineShadowmap.getBindGroupLayout(0));

        const mainRenderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [{
                attachment: this._msaaTextureView,
                resolveTarget: this._colorTextureView,
                loadValue: { r: 124 / 255, g: 177 / 255, b: 226 / 255, a: 1.0 },
            }],

            depthStencilAttachment: {
                attachment: this._depthTextureView,
                depthLoadValue: 1.0,
                depthStoreOp: StoreOp.Store,
                stencilLoadValue: 0,
                stencilStoreOp: StoreOp.Store,
            }
        };

        const shadowmapRenderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [{
                attachment: this._shadowmapTextureView,
                loadValue: { r: 0 / 255, g: 0 / 255, b: 255 / 255, a: 1.0 },
            }],

            depthStencilAttachment: {
                attachment: this._depthTextureShadowmapView,
                depthLoadValue: 1.0,
                depthStoreOp: StoreOp.Store,
                depthReadOnly: false,
                stencilLoadValue: 0,
                stencilStoreOp: StoreOp.Store,
            }
        };

        let prevTimestamp = -1;

        return (timestamp: number) => {
            if (prevTimestamp < 0) {
                prevTimestamp = timestamp;
            }

            const delta = timestamp - prevTimestamp;

            this._basicControl.update(0, delta);

            prevTimestamp = timestamp;

            const transformationMatrix = this._camera.getTransformationMatrix();
            this._device.defaultQueue.writeBuffer(
                vertexUniformBufferMain,
                0,
                transformationMatrix.buffer,
                transformationMatrix.byteOffset,
                transformationMatrix.byteLength
            );

            this._device.defaultQueue.writeBuffer(
                vertexUniformBufferShadowmap,
                0,
                transformationMatrix.buffer,
                transformationMatrix.byteOffset,
                transformationMatrix.byteLength
            );

            this._device.defaultQueue.writeBuffer(
                fragmentUniformBufferMain,
                0,
                this._sunDir,
                this._sunDir.byteOffset,
                this._sunDir.byteLength
            );

            if (this._colorTexture) {
                this._colorTexture.destroy();
            }

            this._colorTexture = this._swapChain.getCurrentTexture();
            this._colorTextureView = this._colorTexture.createView();

            shadowmapRenderPassDescriptor.depthStencilAttachment!.attachment = this._depthTextureShadowmapView;

            (mainRenderPassDescriptor.colorAttachments as Array<GPURenderPassColorAttachmentDescriptor>)[0].resolveTarget = this._colorTextureView;
            mainRenderPassDescriptor.depthStencilAttachment!.attachment = this._depthTextureView;

            const commandEncoder = this._device.createCommandEncoder();

            const passEncoderShadowmap = commandEncoder.beginRenderPass(shadowmapRenderPassDescriptor);

            passEncoderShadowmap.setPipeline(pipelineShadowmap);
            passEncoderShadowmap.setBindGroup(0, uniformBindGroupShadowmap);
            passEncoderShadowmap.setVertexBuffer(0, verticesBuffer);
            passEncoderShadowmap.setIndexBuffer(indicesBuffer, IndexFormat.Uint32);
            passEncoderShadowmap.drawIndexed(scene.indices.length, 1, 0, 0, 0);
            passEncoderShadowmap.endPass();

            const passEncoderMain = commandEncoder.beginRenderPass(mainRenderPassDescriptor);

            passEncoderMain.setPipeline(pipelineMain);
            passEncoderMain.setBindGroup(0, uniformBindGroupMain);
            passEncoderMain.setVertexBuffer(0, verticesBuffer);
            passEncoderMain.setIndexBuffer(indicesBuffer, IndexFormat.Uint32);
            passEncoderMain.drawIndexed(scene.indices.length, 1, 0, 0, 0);
            passEncoderMain.endPass();

            this._device.defaultQueue.submit([commandEncoder.finish()]);
        };
    }
}

SampleBasic.registerSampleClass("webgpushadow", {
    "displayName": "Display a scene width shadows using WebGPU",
    "description": "",
    "class": WebGPUShadow,
    "nonbabylon": true,
});
