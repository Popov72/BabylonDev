import { PrimitiveTopology, CompareFunction, TextureFormat, VertexFormat, CullMode, StoreOp, IndexFormat } from "@webgpu/types/dist/constants";
import { shadowmapVertexShaderGLSL, shadowmapFragmentShaderGLSL } from "./shaders";

export class ShadowMapPass {

    private _scene: any;
    private _device: GPUDevice;
    private _glslang: any;
    private _vertexUniformBuffer: GPUBuffer;
    private _pipeline: GPURenderPipeline;
    private _renderPassDescriptor: GPURenderPassDescriptor;
    private _uniformBindGroup: GPUBindGroup;
    private _renderTexture: GPUTexture;
    private _renderTextureView: GPUTextureView;
    private _depthTexture: GPUTexture;
    private _depthTextureView: GPUTextureView;

    public sunDir: Float32Array;
    public transformationMatrix: Float32Array;

    public get depthTextureView(): GPUTextureView {
        return this._depthTextureView;
    }

    constructor(device: GPUDevice, glslang: any, scene: any) {
        this._scene = scene;
        this._device = device;
        this._glslang = glslang;
    }

    public async init() {
        const vertexUniformBufferSize = 4 * 16; // 4x4 matrix
        this._vertexUniformBuffer = this._device.createBuffer({
            size: vertexUniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this._renderPassDescriptor = {
            colorAttachments: [{
                attachment: undefined as any,
                loadValue: { r: 0 / 255, g: 0 / 255, b: 255 / 255, a: 1.0 },
            }],

            depthStencilAttachment: {
                attachment: undefined as any,
                depthLoadValue: 1.0,
                depthStoreOp: StoreOp.Store,
                depthReadOnly: false,
                stencilLoadValue: 0,
                stencilStoreOp: StoreOp.Store,
            }
        };

        this._createPipeline();
        this._createBindGroup();
    }

    public resize(width: number, height: number) {
        if (this._renderTexture) {
            this._renderTexture.destroy();
        }

        this._renderTexture = this._device.createTexture({
            size: {
                width,
                height,
                depth: 1
            },
            format: TextureFormat.BGRA8Unorm, // todo: why can't I use another format?
            usage: GPUTextureUsage.OUTPUT_ATTACHMENT,
            sampleCount: 1
        });

        this._renderTextureView = this._renderTexture.createView();

        if (this._depthTexture) {
            this._depthTexture.destroy();
        }

        this._depthTexture = this._device.createTexture({
            size: {
                width,
                height,
                depth: 1
            },
            format: TextureFormat.Depth32Float,
            usage: GPUTextureUsage.OUTPUT_ATTACHMENT | GPUTextureUsage.SAMPLED,
            sampleCount: 1
        });

        this._depthTextureView = this._depthTexture.createView();
    }

    public render(commandEncoder: GPUCommandEncoder, verticesBuffer: GPUBuffer, indicesBuffer: GPUBuffer) {
        this._device.defaultQueue.writeBuffer(
            this._vertexUniformBuffer,
            0,
            this.transformationMatrix.buffer,
            this.transformationMatrix.byteOffset,
            this.transformationMatrix.byteLength
        );

        (this._renderPassDescriptor.colorAttachments as Array<GPURenderPassColorAttachmentDescriptor>)[0].attachment = this._renderTextureView;
        this._renderPassDescriptor.depthStencilAttachment!.attachment = this._depthTextureView;

        const passEncoderShadowmap = commandEncoder.beginRenderPass(this._renderPassDescriptor);

        passEncoderShadowmap.setPipeline(this._pipeline);
        passEncoderShadowmap.setBindGroup(0, this._uniformBindGroup);
        passEncoderShadowmap.setVertexBuffer(0, verticesBuffer);
        passEncoderShadowmap.setIndexBuffer(indicesBuffer, IndexFormat.Uint32);
        passEncoderShadowmap.drawIndexed(this._scene.indices.length, 1, 0, 0, 0);
        passEncoderShadowmap.endPass();
    }

    public dispose() {
        this._vertexUniformBuffer?.destroy();
        //this._fragmentUniformBuffer?.destroy();
        this._pipeline = null as any;
        this._renderTexture.destroy();
        this._depthTexture.destroy();
    }

    protected _createPipeline() {
        this._pipeline = this._device.createRenderPipeline({
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
                    arrayStride: this._scene.vertexSize,
                    attributes: [{
                        // position
                        shaderLocation: 0,
                        offset: this._scene.positionOffset,
                        format: VertexFormat.Float4
                    }]
                }],
            },

            rasterizationState: {
                cullMode: CullMode.None,
            },

            colorStates: [{
                format: TextureFormat.BGRA8Unorm,
                writeMask: 0,
            }],
        });
    }

    protected _createBindGroup() {
        this._uniformBindGroup = this._device.createBindGroup({
            layout: this._pipeline.getBindGroupLayout(0),
            entries: [{
                binding: 0,
                resource: {
                    buffer: this._vertexUniformBuffer,
                },
            }],
        });
    }
}