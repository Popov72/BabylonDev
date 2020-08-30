import SampleBasic from "../SampleBasic";

import glslangModule from './glslang';
import { mat4, vec3, quat } from 'gl-matrix';
import { checkWebGPUSupport } from './helpers';
import { GPUTextureHelper } from "./gpuTextureHelper";

const mainVertexShaderGLSL = `
    #version 450

    layout(set = 0, binding = 0) uniform Uniforms {
        mat4 modelViewProjectionMatrix;
    } uniforms;

    layout(location = 0) in vec4 position;
    layout(location = 1) in vec2 uv;
    layout(location = 2) in vec4 tileinfo;

    layout(location = 0) out vec2 fragUV;
    layout(location = 1) out vec4 vTileinfo;

    void main() {
        gl_Position = uniforms.modelViewProjectionMatrix * position;
        fragUV = uv;
        vTileinfo = tileinfo;
    }
`;

const mainFragmentShaderGLSL = `
    #version 450

    layout(set = 0, binding = 1) uniform sampler mySampler;
    layout(set = 0, binding = 2) uniform texture2D myTexture;
    layout(set = 0, binding = 3) uniform Uniforms {
        vec3 lightDirection;
    } uniforms;

    layout(location = 0) in vec2 fragUV;
    layout(location = 1) in vec4 vTileinfo;
    layout(location = 0) out vec4 outColor;

    void main() {
        float fx = clamp(fract(fragUV.x), 0., 1.), fy = clamp(fract(fragUV.y), 0., 1.);
        vec2 uvCoord = vec2(vTileinfo.x + fx * vTileinfo.z, vTileinfo.y + fy * vTileinfo.w);
        outColor = texture(sampler2D(myTexture, mySampler), uvCoord);
    }
`;

export class WebGPUShadow {

    protected _device: GPUDevice;
    protected _glslang: any;
    protected _swapChain: GPUSwapChain;
    protected _colorTexture: GPUTexture;
    protected _colorTextureView: GPUTextureView;
    protected _depthTexture: GPUTexture;
    protected _depthTextureView: GPUTextureView;

    protected _canvas: HTMLCanvasElement;
    protected _sunDir: Float32Array;

    constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas;
        this._sunDir = new Float32Array([-1, -1, -1]);
        vec3.normalize(this._sunDir, this._sunDir);
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

        window.onresize = () => {
            this._canvas.width = window.innerWidth;
            this._canvas.height = window.innerHeight;
            this._resize();
        };

        const frame = await this.init(this._canvas);

        function doFrame(timestamp: any) {
            frame(timestamp);
            requestAnimationFrame(doFrame);
        }

        requestAnimationFrame(doFrame);
    }

    protected async _initWebGPU() {
        const adapter = await navigator.gpu!.requestAdapter() as GPUAdapter;

        this._device = await adapter.requestDevice() as GPUDevice;
        this._glslang = await glslangModule();

        const context = this._canvas.getContext('gpupresent');

        // @ts-ignore:
        this._swapChain = context.configureSwapChain({
            device: this._device,
            format: "bgra8unorm",
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

        const textureHelper = new GPUTextureHelper(this._device, this._glslang);

        const atlasTexture = await textureHelper.generateMipmappedTexture('/resources/webgpu/powerplant2.png');

        const sampler = this._device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
            mipmapFilter: "linear",
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
            }],
        });

        return [vertexUniformBuffer, fragmentUniformBuffer, uniformBindGroup];
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

            primitiveTopology: "triangle-list",

            depthStencilState: {
                depthWriteEnabled: true,
                depthCompare: "less",
                format: "depth24plus-stencil8",
            },

            vertexState: {
                vertexBuffers: [{
                    arrayStride: scene.vertexSize,
                    attributes: [{
                        // position
                        shaderLocation: 0,
                        offset: scene.positionOffset,
                        format: "float4"
                    }, {
                        // uv
                        shaderLocation: 1,
                        offset: scene.uvOffset,
                        format: "float2"
                    }, {
                        // tileinfo
                        shaderLocation: 2,
                        offset: scene.tileinfoOffset,
                        format: "float4"
                    }]
                }],
            },

            rasterizationState: {
                cullMode: 'none',
            },

            colorStates: [{
                format: "bgra8unorm",
            }],
        });
    }

    protected _resize() {
        if (this._depthTexture) {
            this._depthTexture.destroy();
        }

        this._depthTexture = this._device.createTexture({
            size: {
                width: this._canvas.width,
                height: this._canvas.height,
                depth: 1
            },
            format: "depth24plus-stencil8",
            usage: GPUTextureUsage.OUTPUT_ATTACHMENT
        });

        this._depthTextureView = this._depthTexture.createView();
    }

    public async init(canvas: HTMLCanvasElement) {
        await this._initWebGPU();

        let [verticesBuffer, indicesBuffer, scene] = await this._makeGeometryBuffers();

        const aspect = Math.abs(canvas.width / canvas.height);
        let projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, 0.59, aspect, 0.25, 250.0);

        const pipelineMain = await this._createPiplineForMainRender(scene);

        let [vertexUniformBuffer, fragmentUniformBuffer, uniformBindGroup] = await this._createBindGroup(pipelineMain.getBindGroupLayout(0));

        this._resize();

        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [{
                attachment: this._colorTextureView,
                loadValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
            }],

            depthStencilAttachment: {
                attachment: this._depthTextureView,
                depthLoadValue: 1.0,
                depthStoreOp: "store",
                stencilLoadValue: 0,
                stencilStoreOp: "store",
            }
        };

        function getTransformationMatrix() {
            /*let viewMatrix = mat4.create();
            mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(-40, -5, -5));

            //let scale = vec3.fromValues(-1, 1, 1);
            //mat4.scale(viewMatrix, viewMatrix, scale);

            /*let q = quat.fromValues(0.04393725652967226, -0.7057491885986513, 0.043938354988460625, 0.7057315448698508);
            let matRot = mat4.create();
            mat4.fromQuat(matRot, q);

            mat4.multiply(viewMatrix, matRot, viewMatrix);/

            let modelViewProjectionMatrix = mat4.create();
            mat4.multiply(modelViewProjectionMatrix, projectionMatrix, viewMatrix);

            return modelViewProjectionMatrix as Float32Array;*/
            return new Float32Array([
                -0.00003991925768787041, -0.40888771414756775, -0.9942644238471985, -0.9922778606414795,
                0, 3.271101713180542, -0.12428305298089981, -0.12403473258018494,
                1.5967704057693481, -0.000010222192941000685, -0.000024856610252754763, -0.00002480694638506975,
                -7.983851909637451, 0.000051110964705003425, 39.89161682128906, 40.3114128112793
            ]);
        }

        return (timestamp: any) => {
            const transformationMatrix = getTransformationMatrix();
            this._device.defaultQueue.writeBuffer(
                vertexUniformBuffer,
                0,
                transformationMatrix.buffer,
                transformationMatrix.byteOffset,
                transformationMatrix.byteLength
            );

            this._device.defaultQueue.writeBuffer(
                fragmentUniformBuffer,
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

            (renderPassDescriptor.colorAttachments as Array<GPURenderPassColorAttachmentDescriptor>)[0].attachment = this._colorTextureView;
            renderPassDescriptor.depthStencilAttachment!.attachment = this._depthTextureView;

            const commandEncoder = this._device.createCommandEncoder();
            const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

            passEncoder.setPipeline(pipelineMain);
            passEncoder.setBindGroup(0, uniformBindGroup);
            passEncoder.setVertexBuffer(0, verticesBuffer);
            passEncoder.setIndexBuffer(indicesBuffer, "uint32");
            passEncoder.drawIndexed(scene.indices.length, 1, 0, 0, 0);
            passEncoder.endPass();

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
