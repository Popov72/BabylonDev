import SampleBasic from "../SampleBasic";

import glslangModule from './glslang';
import { mat4, vec3, quat } from 'gl-matrix';
import { createTextureFromImage } from './helpers';

export class WebGPUShadow {

    private _canvas: HTMLCanvasElement;

    constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas;
    }

    public async run() {
        const width = this._canvas.width;
        const height = this._canvas.height;

        this._canvas.style.display = "none";

        this._canvas = document.createElement('canvas');
        this._canvas.width = width;
        this._canvas.height = height;

        document.body.appendChild(this._canvas);

        /*window.onresize = () => {
            this._canvas.width = window.innerWidth;
            this._canvas.height = window.innerHeight;
        };*/

        const frame = await this.init(this._canvas);

        function doFrame(timestamp: any) {
            frame(timestamp);
            requestAnimationFrame(doFrame);
        }

        requestAnimationFrame(doFrame);
    }

    public async init(canvas: HTMLCanvasElement) {
        const vertexShaderGLSL = `#version 450
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

        const fragmentShaderGLSL = `#version 450
        layout(set = 0, binding = 1) uniform sampler mySampler;
        layout(set = 0, binding = 2) uniform texture2D myTexture;

        layout(location = 0) in vec2 fragUV;
        layout(location = 1) in vec4 vTileinfo;
        layout(location = 0) out vec4 outColor;

        void main() {
            float fx = clamp(fract(fragUV.x), 0., 1.), fy = clamp(fract(fragUV.y), 0., 1.);
            vec2 uvCoord = vec2(vTileinfo.x + fx * vTileinfo.z, 1.0 - (vTileinfo.y + fy * vTileinfo.w));
            outColor =  texture(sampler2D(myTexture, mySampler), uvCoord);
        }
        `;

        const adapter = await navigator.gpu!.requestAdapter() as GPUAdapter;
        const device = await adapter.requestDevice() as GPUDevice;
        const glslang = await glslangModule();

        const aspect = Math.abs(canvas.width / canvas.height);
        let projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, 0.59, aspect, 0.25, 250.0);

        const context = canvas.getContext('gpupresent');

        // @ts-ignore:
        const swapChain = context.configureSwapChain({
            device,
            format: "bgra8unorm",
        });

        const scene: any = await fetch("/resources/webgpu/powerplant.json").then((response) => response.json());

        console.log(scene.indices.length);

        const vertexArray = new Float32Array(scene.vertexArray);

        const verticesBuffer = device.createBuffer({
            size: vertexArray.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });
        new Float32Array(verticesBuffer.getMappedRange()).set(vertexArray);
        verticesBuffer.unmap();

        const indices = new Uint32Array(scene.indices);

        const indicesBuffer = device.createBuffer({
            size: indices.byteLength,
            usage: GPUBufferUsage.INDEX,
            mappedAtCreation: true,
        });
        new Uint32Array(indicesBuffer.getMappedRange()).set(indices);
        indicesBuffer.unmap();

        const bindGroupLayout = device.createBindGroupLayout({
            entries: [{
                // Transform
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                type: "uniform-buffer"
            }, {
                // Sampler
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                type: "sampler"
            }, {
                // Texture view
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                type: "sampled-texture"
            }]
        });

        const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });
        const pipeline = device.createRenderPipeline({
            layout: pipelineLayout,

            vertexStage: {
                module: device.createShaderModule({
                    code: glslang.compileGLSL(vertexShaderGLSL, "vertex"),

                    // @ts-ignore
                    source: vertexShaderGLSL,
                    transform: (source: any) => glslang.compileGLSL(source, "vertex"),
                }),
                entryPoint: "main"
            },
            fragmentStage: {
                module: device.createShaderModule({
                    code: glslang.compileGLSL(fragmentShaderGLSL, "fragment"),

                    // @ts-ignore
                    source: fragmentShaderGLSL,
                    transform: (source: any) => glslang.compileGLSL(source, "fragment"),
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
                indexFormat: "uint32",
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

        const depthTexture = device.createTexture({
            size: { width: canvas.width, height: canvas.height, depth: 1 },
            format: "depth24plus-stencil8",
            usage: GPUTextureUsage.OUTPUT_ATTACHMENT
        });

        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [{
                attachment: undefined as unknown as GPUTextureView, // Assigned later

                loadValue: { r: 0.5, g: 0.5, b: 0.5, a: 1.0 },
            }],
            depthStencilAttachment: {
                attachment: depthTexture.createView(),

                depthLoadValue: 1.0,
                depthStoreOp: "store",
                stencilLoadValue: 0,
                stencilStoreOp: "store",
            }
        };

        const uniformBufferSize = 4 * 16; // 4x4 matrix
        const uniformBuffer = device.createBuffer({
            size: uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const atlasTexture = await createTextureFromImage(device, '/resources/webgpu/powerplant.png', GPUTextureUsage.SAMPLED);

        const sampler = device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
        });

        const uniformBindGroup = device.createBindGroup({
            layout: bindGroupLayout,
            entries: [{
                binding: 0,
                resource: {
                    buffer: uniformBuffer,
                },
            }, {
                binding: 1,
                resource: sampler,
            }, {
                binding: 2,
                resource: atlasTexture.createView(),
            }],
        });

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

        return function frame(timestamp: any) {
            const transformationMatrix = getTransformationMatrix();
            device.defaultQueue.writeBuffer(
                uniformBuffer,
                0,
                transformationMatrix.buffer,
                transformationMatrix.byteOffset,
                transformationMatrix.byteLength
            );
            (renderPassDescriptor.colorAttachments as Array<GPURenderPassColorAttachmentDescriptor>)[0].attachment = swapChain.getCurrentTexture().createView();

            const commandEncoder = device.createCommandEncoder();
            const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
            passEncoder.setPipeline(pipeline);
            passEncoder.setBindGroup(0, uniformBindGroup);
            passEncoder.setVertexBuffer(0, verticesBuffer);
            passEncoder.setIndexBuffer(indicesBuffer);
            passEncoder.drawIndexed(indices.length, 1, 0, 0, 0);
            //passEncoder.draw(vertexArray.length, 0);
            passEncoder.endPass();
            device.defaultQueue.submit([commandEncoder.finish()]);
        };
    }
}

SampleBasic.registerSampleClass("webgpushadow", {
    "displayName": "Display a scene width shadows using WebGPU",
    "description": "",
    "class": WebGPUShadow,
    "nonbabylon": true,
});
