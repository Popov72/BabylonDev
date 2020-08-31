import SampleBasic from "../SampleBasic";

import glslangModule from './glslang';
import { mat4, vec3, quat } from 'gl-matrix';
import { checkWebGPUSupport } from './helpers';
import { GPUTextureHelper } from "./gpuTextureHelper";
import { Camera } from "./camera";
import { BasicControl } from "./BasicControl";

const swapChainFormat = "bgra8unorm";

const mainVertexShaderGLSL = `
    #version 450

    layout(set = 0, binding = 0) uniform Uniforms {
        mat4 modelViewProjectionMatrix;
    } uniforms;

    layout(location = 0) in vec4 position;
    layout(location = 1) in vec2 uv;
    layout(location = 2) in vec4 tileinfo;
    layout(location = 3) in vec4 normal;

    layout(location = 0) out vec2 fragUV;
    layout(location = 1) out vec4 vTileinfo;
    layout(location = 2) out vec3 vPositionW;
    layout(location = 3) out vec3 vNormalW;

    void main() {
        gl_Position = uniforms.modelViewProjectionMatrix * position;
        fragUV = uv;
        vTileinfo = tileinfo;
        vPositionW = vec3(position);
        vNormalW = normal.xyz;
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
    layout(location = 2) in vec3 vPositionW;
    layout(location = 3) in vec3 vNormalW;

    layout(location = 0) out vec4 outColor;

    void main() {
        float fx = clamp(fract(fragUV.x), 0., 1.), fy = clamp(fract(fragUV.y), 0., 1.);
        vec2 uvCoord = vec2(vTileinfo.x + fx * vTileinfo.z, vTileinfo.y + fy * vTileinfo.w);
        vec4 baseColor = texture(sampler2D(myTexture, mySampler), uvCoord);

        vec3 normalW = normalize(vNormalW);

        vec3 lightVectorW = normalize(-uniforms.lightDirection);

        float ndl = max(0., dot(normalW, lightVectorW));
        vec3 diffuse = ndl * vec3(1.); // vec3(1.) == diffuse color of light

        vec3 finalDiffuse = clamp(diffuse + vec3(0.3), 0.0, 1.0) * baseColor.rgb;

        outColor = vec4(finalDiffuse, baseColor.a);
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
    protected _msaaTexture: GPUTexture;
    protected _msaaTextureView: GPUTextureView;

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
        this._camera.quaternion = [0, 0, 0, 1];

        this._basicControl = new BasicControl(this._camera, { move: 0.02, rotation: 0.04, mouserotation: 0.008 });
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

            sampleCount: 4,

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
                    }, {
                        // normal
                        shaderLocation: 3,
                        offset: scene.normalOffset,
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
        this._camera.aspect = Math.abs(this._canvas.width / this._canvas.height);

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
    }

    public async init(canvas: HTMLCanvasElement) {
        await this._initWebGPU();

        let [verticesBuffer, indicesBuffer, scene] = await this._makeGeometryBuffers();

        const pipelineMain = await this._createPiplineForMainRender(scene);

        let [vertexUniformBuffer, fragmentUniformBuffer, uniformBindGroup] = await this._createBindGroup(pipelineMain.getBindGroupLayout(0));

        this._resize();

        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [{
                attachment: this._msaaTextureView,
                resolveTarget: this._colorTextureView,
                loadValue: { r: 124 / 255, g: 177 / 255, b: 226 / 255, a: 1.0 },
            }],

            depthStencilAttachment: {
                attachment: this._depthTextureView,
                depthLoadValue: 1.0,
                depthStoreOp: "store",
                stencilLoadValue: 0,
                stencilStoreOp: "store",
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

            (renderPassDescriptor.colorAttachments as Array<GPURenderPassColorAttachmentDescriptor>)[0].resolveTarget = this._colorTextureView;
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
