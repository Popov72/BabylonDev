import jQuery from "jquery";

import {
    Engine
} from "babylonjs";

import "./allSamples";
import Browser from "./Browser";
import Sample from "./Sample";

declare var glMatrix: any;

const showDebugLayer = false;

glMatrix.glMatrix.setMatrixArrayType(Array);

const qs = Browser.QueryString;

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement,
      engine = new Engine(canvas, true, { premultipliedAlpha: false, stencil: true, disableWebGL2Support: false, preserveDrawingBuffer: true, antialias: false });

function setContainerDimensions() {
    engine.resize();
}

jQuery(window).on('resize', setContainerDimensions);
jQuery(window).on('load', setContainerDimensions);

let sampleName = Sample.sampleList.keys().next().value;

if (qs['sample']) {
    sampleName = qs['sample'];
}

const sample = Sample.createSample(sampleName, engine, canvas) as Sample;

if (sample === null) {
    alert(`Unknown sample "${sampleName}" !`);
} else {
    let divFps = document.getElementById("fps") as HTMLElement;

    /*if (showDebugLayer) {
        scene.debugLayer.show({ embedMode: false, handleResize: false, overlay: true, showExplorer: true, showInspector: true });
    }*/

    engine.runRenderLoop(function() {
        sample.onBeforeRender(engine.getDeltaTime() / 1000.0);

        sample.render();

        if (divFps) {
            divFps.innerHTML = engine.getFps().toFixed(2) + " fps";
        }
    });
}
