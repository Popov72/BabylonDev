// Copyright 2020 Brandon Jones
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

export class GPUTextureHelper {

    private device: GPUDevice;
    private mipmapSampler: GPUSampler;
    private mipmapPipeline: GPURenderPipeline;

    constructor(device: GPUDevice, glslang: any) {
        this.device = device;

        const mipmapVertexSource = `
            #version 450

            const vec2 pos[4] = vec2[4](vec2(-1.0f, 1.0f), vec2(1.0f, 1.0f), vec2(-1.0f, -1.0f), vec2(1.0f, -1.0f));
            const vec2 tex[4] = vec2[4](vec2(0.0f, 0.0f), vec2(1.0f, 0.0f), vec2(0.0f, 1.0f), vec2(1.0f, 1.0f));

            layout(location = 0) out vec2 vTex;

            void main() {
                vTex = tex[gl_VertexIndex];
                gl_Position = vec4(pos[gl_VertexIndex], 0.0, 1.0);
            }
        `;

        const mipmapFragmentSource = `
            #version 450

            layout(set = 0, binding = 0) uniform sampler imgSampler;
            layout(set = 0, binding = 1) uniform texture2D img;

            layout(location = 0) in vec2 vTex;
            layout(location = 0) out vec4 outColor;

            void main() {
                outColor = texture(sampler2D(img, imgSampler), vTex);
            }
        `;

        this.mipmapSampler = device.createSampler({ minFilter: 'linear' });

        this.mipmapPipeline = device.createRenderPipeline({
            vertexStage: {
                module: device.createShaderModule({
                    code: glslang.compileGLSL(mipmapVertexSource, 'vertex')
                }),
                entryPoint: 'main'
            },
            fragmentStage: {
                module: device.createShaderModule({
                    code: glslang.compileGLSL(mipmapFragmentSource, 'fragment')
                }),
                entryPoint: 'main'
            },
            primitiveTopology: 'triangle-strip',
            vertexState: {
                indexFormat: "uint16"
            },
            colorStates: [{
                format: 'rgba8unorm',
            }]
        });
    }

    async generateMipmappedTexture(image: ImageBitmap | string): Promise<GPUTexture> {
        let imageBitmap;

        if (image instanceof ImageBitmap) {
            imageBitmap = image;
        } else {
            const img = document.createElement('img');
            img.src = image;
            await img.decode();
            imageBitmap = await createImageBitmap(img);
        }

        let textureSize = {
            width: imageBitmap.width,
            height: imageBitmap.height,
            depth: 1,
        };

        const mipLevelCount = Math.floor(Math.log2(Math.max(imageBitmap.width, imageBitmap.height))) + 1;

        // Populate the top level of the srcTexture with the imageBitmap.
        const srcTexture = this.device.createTexture({
            size: textureSize,
            format: 'rgba8unorm',
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.SAMPLED | GPUTextureUsage.OUTPUT_ATTACHMENT,
            mipLevelCount
        });

        this.device.defaultQueue.copyImageBitmapToTexture({ imageBitmap }, { texture: srcTexture }, textureSize);

        const commandEncoder = this.device.createCommandEncoder({});

        const bindGroupLayout = this.mipmapPipeline.getBindGroupLayout(0);

        for (let i = 1; i < mipLevelCount; ++i) {
            const passEncoder = commandEncoder.beginRenderPass({
                colorAttachments: [{
                    attachment: srcTexture.createView({
                        baseMipLevel: i,
                        mipLevelCount: 1
                    }),
                    loadValue: { r: 1.0, g: 0.0, b: 0.0, a: 0.0 },
                }],
            });

            const bindGroup = this.device.createBindGroup({
                layout: bindGroupLayout,
                entries: [{
                    binding: 0,
                    resource: this.mipmapSampler,
                }, {
                    binding: 1,
                    resource: srcTexture.createView({
                        baseMipLevel: i - 1,
                        mipLevelCount: 1
                    }),
                }],
            });

            passEncoder.setPipeline(this.mipmapPipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.draw(4, 1, 0, 0);
            passEncoder.endPass();
        }

        this.device.defaultQueue.submit([commandEncoder.finish()]);

        return srcTexture;
    }
}