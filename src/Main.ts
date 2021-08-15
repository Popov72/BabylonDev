import jQuery from "jquery";

import {
    Engine
} from "babylonjs";

import "./allSamples";
import Browser from "./Browser";
import Sample from "./Sample";

declare var glMatrix: any;

async function startIt() {
    glMatrix.glMatrix.setMatrixArrayType(Array);

    const qs = Browser.QueryString;

    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let sampleName = Sample.sampleList.keys().next().value;

    if (qs['sample']) {
        sampleName = qs['sample'];
    }

    const sampleDescr = Sample.sampleList.get(sampleName);

    if (!sampleDescr) {
        throw new Error("Invalid sample name: " + sampleName);
    }

    let engine: Engine | null = null;

    if (!sampleDescr.nonbabylon) {
        engine = new Engine(canvas, true, { premultipliedAlpha: false, stencil: true, disableWebGL2Support: false, preserveDrawingBuffer: true });
        /*var glslangOptions = {
            jsPath: "/resources/lib/glslang.js",
            wasmPath: "/resources/lib/glslang.wasm"
        };

        engine = new BABYLON.WebGPUEngine(canvas, {
            deviceDescriptor: {
                extensions: [
                    "texture-compression-bc",
                    "timestamp-query",
                    "pipeline-statistics-query",
                    "depth-clamping",
                    "depth24unorm-stencil8",
                    "depth32float-stencil8"
                ]
            }
        });
        await engine.initAsync(glslangOptions);*/

        jQuery(window).on('resize', engine.resize as any);
        jQuery(window).on('load', engine.resize as any);
    }

    const sample = Sample.createSample(sampleName, engine, canvas) as Sample;

    if (sample === null) {
        alert(`Unknown sample "${sampleName}" !`);
    } else if (!(sample instanceof Sample)) {
        (sample as any).run();
    } else {
        let divFps = document.getElementById("fps") as HTMLElement;

        engine!.runRenderLoop(function() {
            sample.onBeforeRender(engine!.getDeltaTime() / 1000.0);

            sample.render();

            if (divFps) {
                divFps.innerHTML = engine!.getFps().toFixed(2) + " fps";
            }
        });
    }
}

startIt();