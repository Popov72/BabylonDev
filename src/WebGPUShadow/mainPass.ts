import { PrimitiveTopology, FilterMode, CompareFunction, TextureFormat, VertexFormat, CullMode, StoreOp, IndexFormat, ShaderStage, BindingType, TextureComponentType } from "@webgpu/types/dist/constants";
import { mainVertexShaderGLSL, mainFragmentShaderGLSL } from "./shaders";
import { GPUTextureHelper } from "./gpuTextureHelper";
import { createTextureFromImage } from './helpers';
import { ShadowMapPass } from "./shadowMapPass";

export class MainPass {

    private _scene: any;
    private _device: GPUDevice;
    private _glslang: any;
    private _swapChain: GPUSwapChain;
    private _swapChainFormat: GPUTextureFormat;
    private _shadowMapPass: ShadowMapPass;
    private _textureHelper: GPUTextureHelper;
    private _useMipmap: boolean;
    private _vertexUniformBuffer: GPUBuffer;
    private _fragmentUniformBuffer: GPUBuffer;
    private _pipeline: GPURenderPipeline;
    private _atlasTexture: GPUTexture;
    private _atlasTextureView: GPUTextureView;
    private _sampler: GPUSampler;
    private _samplerShadowmap: GPUSampler;
    private _renderPassDescriptor: GPURenderPassDescriptor;
    private _bindGroup: GPUBindGroup;
    private _depthTexture: GPUTexture;
    private _depthTextureView: GPUTextureView;
    private _msaaTexture: GPUTexture;
    private _msaaTextureView: GPUTextureView;
    private _bindGroupLayout: GPUBindGroupLayout;
    private _useMSAA: boolean;
    private _pcfFiltering: number;

    public sunDir: Float32Array;
    public transformationMatrix: Float32Array;
    public lightTransformationMatrix: Float32Array;

    public get useMSAA(): boolean {
        return this._useMSAA;
    }

    public set useMSAA(useMSAA: boolean) {
        if (useMSAA === this._useMSAA) {
            return;
        }

        this._useMSAA = useMSAA;

        this._createPipeline();
        this.resize(window.innerWidth, window.innerHeight);
    }

    public get pcfFiltering(): number {
        return this._pcfFiltering;
    }

    public set pcfFiltering(value: number) {
        this._pcfFiltering = value;

        this._createPipeline();
        this.resize(window.innerWidth, window.innerHeight);
    }

    constructor(device: GPUDevice, glslang: any, scene: any, textureHelper: GPUTextureHelper, canvas: HTMLCanvasElement, swapChainFormat: GPUTextureFormat, shadowMapPass: ShadowMapPass, useMipmap = false) {
        this._scene = scene;
        this._device = device;
        this._glslang = glslang;
        this._swapChainFormat = swapChainFormat;
        this._shadowMapPass = shadowMapPass;
        this._textureHelper = textureHelper;
        this._useMipmap = useMipmap;
        this._useMSAA = true;

        this._pcfFiltering = 3;

        const context = canvas.getContext('gpupresent');

        // @ts-ignore:
        this._swapChain = context.configureSwapChain({
            device: this._device,
            format: swapChainFormat,
        });
    }

    public async init() {
        const _vertexUniformBufferSize = 4 * 16 * 2; // 2 4x4 matrices
        this._vertexUniformBuffer = this._device.createBuffer({
            size: _vertexUniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const _fragmentUniformBufferSize = 4 * 3 + 4 * 1 + 4 * 2; // vec3 light direction + padding + vec2 shadowMapSizeAndInverse
        this._fragmentUniformBuffer = this._device.createBuffer({
            size: _fragmentUniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        if (this._useMipmap) {
            this._atlasTexture = await this._textureHelper.generateMipmappedTexture('/resources/webgpu/powerplant2.png');
        } else {
            this._atlasTexture = await createTextureFromImage(this._device, '/resources/webgpu/powerplant2.png', GPUTextureUsage.SAMPLED);
        }

        this._atlasTextureView = this._atlasTexture.createView();

        this._sampler = this._device.createSampler({
            magFilter: FilterMode.Linear,
            minFilter: FilterMode.Linear,
            mipmapFilter: FilterMode.Linear,
        });

        this._samplerShadowmap = this._device.createSampler({
            magFilter: FilterMode.Linear,
            minFilter: FilterMode.Linear,
            compare: CompareFunction.LessEqual
        });

        this._renderPassDescriptor = {
            colorAttachments: [{
                attachment: undefined as any,
                resolveTarget: undefined,
                loadValue: { r: 124 / 255, g: 177 / 255, b: 226 / 255, a: 1.0 },
            }],

            depthStencilAttachment: {
                attachment: undefined as any,
                depthLoadValue: 1.0,
                depthStoreOp: StoreOp.Store,
                stencilLoadValue: 0,
                stencilStoreOp: StoreOp.Store,
            }
        };

        this._createPipeline();
    }

    public resize(width: number, height: number) {
        if (this._depthTexture) {
            this._depthTexture.destroy();
        }

        this._depthTexture = this._device.createTexture({
            size: {
                width,
                height,
                depth: 1
            },
            format: TextureFormat.Depth24PlusStencil8,
            usage: GPUTextureUsage.OUTPUT_ATTACHMENT,
            sampleCount: this._useMSAA ? 4 : 1
        });

        this._depthTextureView = this._depthTexture.createView();

        if (this._useMSAA) {
            if (this._msaaTexture) {
                this._msaaTexture.destroy();
            }

            this._msaaTexture = this._device.createTexture({
                size: {
                    width,
                    height,
                    depth: 1
                },
                format: this._swapChainFormat,
                usage: GPUTextureUsage.OUTPUT_ATTACHMENT,
                sampleCount: 4
            });

            this._msaaTextureView = this._msaaTexture.createView();
        }
    }

    public render(commandEncoder: GPUCommandEncoder, verticesBuffer: GPUBuffer, indicesBuffer: GPUBuffer) {
        if (this._shadowMapPass.shadowMapSizeChanged) {
            this._createBindGroup(this._shadowMapPass.depthTextureView);
        }

        this._device.defaultQueue.writeBuffer(
            this._vertexUniformBuffer,
            0,
            this.transformationMatrix.buffer,
            this.transformationMatrix.byteOffset,
            this.transformationMatrix.byteLength
        );

        this._device.defaultQueue.writeBuffer(
            this._vertexUniformBuffer,
            16 * 4,
            this.lightTransformationMatrix.buffer,
            this.lightTransformationMatrix.byteOffset,
            this.lightTransformationMatrix.byteLength
        );

        this._device.defaultQueue.writeBuffer(
            this._fragmentUniformBuffer,
            0,
            this.sunDir,
            this.sunDir.byteOffset,
            this.sunDir.byteLength
        );

        this._device.defaultQueue.writeBuffer(
            this._fragmentUniformBuffer,
            4 * 4,
            new Float32Array([this._shadowMapPass.shadowMapSize, 1 / this._shadowMapPass.shadowMapSize]).buffer,
            0,
            4 * 2
        );

        const colorTexture = this._swapChain.getCurrentTexture();
        const colorTextureView = colorTexture.createView();

        if (this._useMSAA) {
            (this._renderPassDescriptor.colorAttachments as Array<GPURenderPassColorAttachmentDescriptor>)[0].attachment = this._msaaTextureView;
            (this._renderPassDescriptor.colorAttachments as Array<GPURenderPassColorAttachmentDescriptor>)[0].resolveTarget = colorTextureView;
        } else {
            (this._renderPassDescriptor.colorAttachments as Array<GPURenderPassColorAttachmentDescriptor>)[0].attachment = colorTextureView;
            (this._renderPassDescriptor.colorAttachments as Array<GPURenderPassColorAttachmentDescriptor>)[0].resolveTarget = undefined;
        }

        this._renderPassDescriptor.depthStencilAttachment!.attachment = this._depthTextureView;

        //commandEncoder.insertDebugMarker("Render the scene");

        const passEncoder = commandEncoder.beginRenderPass(this._renderPassDescriptor);

        passEncoder.setPipeline(this._pipeline);
        passEncoder.setBindGroup(0, this._bindGroup);
        passEncoder.setVertexBuffer(0, verticesBuffer);
        passEncoder.setIndexBuffer(indicesBuffer, IndexFormat.Uint32);
        passEncoder.drawIndexed(this._scene.indices.length, 1, 0, 0, 0);
        passEncoder.endPass();
    }

    public dispose() {
        this._vertexUniformBuffer?.destroy();
        this._fragmentUniformBuffer?.destroy();
        this._pipeline = null as any;
        this._atlasTexture?.destroy();
        this._sampler = null as any;
        this._samplerShadowmap = null as any;
        this._depthTexture?.destroy();
        this._msaaTexture?.destroy();
    }

    protected _createPipeline() {
        this._bindGroupLayout = this._device.createBindGroupLayout({
            entries: [{
                    binding: 0,
                    visibility: ShaderStage.Vertex,
                    type: BindingType.UniformBuffer
                }, {
                    binding: 1,
                    visibility: ShaderStage.Fragment,
                    type: BindingType.Sampler
                }, {
                    binding: 2,
                    visibility: ShaderStage.Fragment,
                    type: BindingType.SampledTexture
                }, {
                    binding: 3,
                    visibility: ShaderStage.Fragment,
                    type: BindingType.UniformBuffer
                }, {
                    binding: 4,
                    visibility: ShaderStage.Fragment,
                    type: BindingType.ComparisonSampler
                }, {
                    binding: 5,
                    visibility: ShaderStage.Fragment,
                    type: BindingType.SampledTexture,
                    textureComponentType: TextureComponentType.DepthComparison
                }
            ]
        });

        this._pipeline = this._device.createRenderPipeline({
            layout: this._device.createPipelineLayout({
                bindGroupLayouts: [this._bindGroupLayout]
            }),
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
                    code: this._glslang.compileGLSL(mainFragmentShaderGLSL.replace("PCF_VALUE", "" + this._pcfFiltering), "fragment"),

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

            sampleCount: this._useMSAA ? 4 : 1,

            vertexState: {
                vertexBuffers: [{
                    arrayStride: this._scene.vertexSize,
                    attributes: [{
                        // position
                        shaderLocation: 0,
                        offset: this._scene.positionOffset,
                        format: VertexFormat.Float4
                    }, {
                        // uv
                        shaderLocation: 1,
                        offset: this._scene.uvOffset,
                        format: VertexFormat.Float2
                    }, {
                        // tileinfo
                        shaderLocation: 2,
                        offset: this._scene.tileinfoOffset,
                        format: VertexFormat.Float4
                    }, {
                        // normal
                        shaderLocation: 3,
                        offset: this._scene.normalOffset,
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

    protected _createBindGroup(depthTextureShadowmapView: GPUTextureView) {
        this._bindGroup = this._device.createBindGroup({
            layout: this._bindGroupLayout/*this._pipeline.getBindGroupLayout(0)*/,
            entries: [{
                binding: 0,
                resource: {
                    buffer: this._vertexUniformBuffer,
                },
            }, {
                binding: 1,
                resource: this._sampler,
            }, {
                binding: 2,
                resource: this._atlasTextureView,
            }, {
                binding: 3,
                resource: {
                    buffer: this._fragmentUniformBuffer,
                },
            }, {
                binding: 4,
                resource: this._samplerShadowmap,
            }, {
                binding: 5,
                resource: depthTextureShadowmapView,
            }],
        });
    }
}
