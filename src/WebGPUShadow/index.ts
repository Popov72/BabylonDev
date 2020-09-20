import SampleBasic from "../SampleBasic";

import glslangModule from './glslang';
import { checkWebGPUSupport } from './helpers';
import { GPUTextureHelper } from "./gpuTextureHelper";
import { Camera } from "./camera";
import { BasicControl } from "./BasicControl";
import { MainPass } from "./mainPass";
import { ShadowMapPass } from "./shadowMapPass";
import { Light } from "./light";
import dat from "dat.gui";

const useMipmap = false;

const swapChainFormat = "bgra8unorm";

export class WebGPUShadow {

    protected _device: GPUDevice;
    protected _glslang: any;

    protected _canvas: HTMLCanvasElement;
    protected _light: Light;
    protected _camera: Camera;
    protected _basicControl: BasicControl;
    protected _options: any;

    protected _textureHelper: GPUTextureHelper;
    protected _mainPass: MainPass;
    protected _shadowMapPass: ShadowMapPass;

    constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas;

        this._light = new Light([-1, -1, -1]);
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

        const frame = await this.init(this._canvas);

        window.onresize = () => {
            this._canvas.width = window.innerWidth;
            this._canvas.height = window.innerHeight;
            this._resize();
        };

        console.log("start");

        function doFrame(timestamp: any) {
            frame(timestamp);
            requestAnimationFrame(doFrame);
        }

        requestAnimationFrame(doFrame);
    }

    protected _resize() {
        this._camera.aspect = Math.abs(this._canvas.width / this._canvas.height);

        this._shadowMapPass.resize(this._canvas.width, this._canvas.height);
        this._mainPass.resize(this._canvas.width, this._canvas.height);
    }

    protected async _initWebGPU() {
        const adapter = await navigator.gpu!.requestAdapter() as GPUAdapter;

        console.log("Adapter limits=", adapter.limits);

        this._device = await adapter.requestDevice() as GPUDevice;
        this._glslang = await glslangModule();

        console.log("Device limits=", this._device.limits);
        console.log("Device extensions=", this._device.extensions);
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

    private _makeGUI() {
        const gui = new dat.GUI();

        this._options = {
            "global_msaa": this._mainPass.useMSAA,
            "global_animateLight": false,

            "shadowmap_size": this._shadowMapPass.shadowMapSize,
            "shadowmap_bias": this._shadowMapPass.bias,
            "shadowmap_normalBias": this._shadowMapPass.normalBias,

            "shadow_pcffiltering": this._mainPass.pcfFiltering,
        };

        gui.domElement.style.marginTop = "50px";

        // Global
        const global = gui.addFolder("Global");

        global.add(this._options, "global_msaa")
            .name("Use MSAA")
            .onChange((value) => this._mainPass.useMSAA = value);

        global.add(this._options, "global_animateLight")
            .name("Animate light")
            .onChange((value) => this._mainPass.useMSAA = value);

        global.open();

        // Shadow map
        const shadowMap = gui.addFolder("Shadow map");

        shadowMap.add(this._options, "shadowmap_size", [512, 1024, 2048, 4096])
            .name("Size")
            .onChange((value) => this._shadowMapPass.shadowMapSize = value);

        shadowMap.add(this._options, "shadowmap_bias", 0, 0.2, 0.001)
            .name("Bias")
            .onChange((value) => this._shadowMapPass.bias = value);

        shadowMap.add(this._options, "shadowmap_normalBias", 0, 0.2, 0.001)
            .name("Normal bias")
            .onChange((value) => this._shadowMapPass.normalBias = value);

        shadowMap.add(this._options, "shadow_pcffiltering", [1, 3, 5])
            .name("PCF filtering")
            .onChange((value) => this._mainPass.pcfFiltering = value);

        shadowMap.open();
    }

    public async init(canvas: HTMLCanvasElement) {
        await this._initWebGPU();

        this._textureHelper = new GPUTextureHelper(this._device, this._glslang);

        let [verticesBuffer, indicesBuffer, scene] = await this._makeGeometryBuffers();

        this._shadowMapPass = new ShadowMapPass(this._device, this._glslang, scene);
        this._mainPass = new MainPass(this._device, this._glslang, scene, this._textureHelper, canvas, swapChainFormat, this._shadowMapPass, useMipmap);

        (window as any).smp = this._shadowMapPass;
        (window as any).mp = this._mainPass;

        await this._shadowMapPass.init();
        await this._mainPass.init();

        this._resize();

        this._shadowMapPass.bias = 0.003;
        this._shadowMapPass.normalBias = 0;

        let prevTimestamp = -1;

        this._makeGUI();

        return (timestamp: number) => {
            if (prevTimestamp < 0) {
                prevTimestamp = timestamp;
            }

            const delta = timestamp - prevTimestamp;

            this._basicControl.update(0, delta);

            if (this._options.global_animateLight) {
                this._light.rotateLight(delta / 1000);
            }

            prevTimestamp = timestamp;

            const commandEncoder = this._device.createCommandEncoder();

            this._shadowMapPass.render(commandEncoder, verticesBuffer, indicesBuffer, this._light);

            this._mainPass.transformationMatrix = this._camera.getTransformationMatrix();
            this._mainPass.lightTransformationMatrix = this._light.getTransformationMatrix();
            this._mainPass.sunDir = this._light.direction;
            this._mainPass.render(commandEncoder, verticesBuffer, indicesBuffer);

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
