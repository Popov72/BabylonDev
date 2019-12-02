import jQuery from "jquery";

import {
    Engine, UniversalCamera, Vector3, Scene
} from "babylonjs";

import Sample from "./DepthMinMax/index";

declare var glMatrix: any;

const showDebugLayer = false;

glMatrix.glMatrix.setMatrixArrayType(Array);

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement,
      engine = new Engine(canvas, true, { premultipliedAlpha: false, stencil: true, disableWebGL2Support: false, preserveDrawingBuffer: true, antialias: false });

function setContainerDimensions() {
    engine.resize();
}

jQuery(window).on('resize', setContainerDimensions);
jQuery(window).on('load', setContainerDimensions);

let divFps = document.getElementById("fps") as HTMLElement;

const sample = new Sample(engine, canvas);

sample.create();

/*if (showDebugLayer) {
    scene.debugLayer.show({ embedMode: false, handleResize: false, overlay: true, showExplorer: true, showInspector: true });
}*/

engine.runRenderLoop(function() {
    sample.onBeforeRender(engine.getDeltaTime() / 1000.0);

    sample.render();

    divFps.innerHTML = engine.getFps().toFixed() + " fps";
});
