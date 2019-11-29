import jQuery from "jquery";

import {
    Engine, UniversalCamera, Vector3
} from "babylonjs";

import Sample from "./DepthMinMax/index";

declare var glMatrix: any;

glMatrix.glMatrix.setMatrixArrayType(Array);

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement,
      engine = new Engine(canvas, true, { premultipliedAlpha: false, stencil: true, disableWebGL2Support: false, preserveDrawingBuffer: true });

function setContainerDimensions() {
    engine.resize();
}

jQuery(window).on('resize', setContainerDimensions);
jQuery(window).on('load', setContainerDimensions);

let scene = Sample.CreateScene(engine, canvas);
let camera = scene.activeCamera as UniversalCamera;
let divFps = document.getElementById("fps") as HTMLElement;

(window as any).camera = camera;
(window as any).scene = scene;

const   cameraSpeed = 5,
        shiftMultiplier = 3;

camera.inertia = 0;
camera.angularSensibility = 500;

camera.keysUp.push(90); // Z
camera.keysDown.push(83); // S
camera.keysLeft.push(81); // Q
camera.keysRight.push(68); // D

let mapKeys = new Map<String, boolean>();

scene.onKeyboardObservable.add((kbInfo) => {
    switch (kbInfo.type) {
        case BABYLON.KeyboardEventTypes.KEYDOWN:
            mapKeys.set(kbInfo.event.key, true);
            break;
        case BABYLON.KeyboardEventTypes.KEYUP:
            mapKeys.set(kbInfo.event.key, false);
            break;
    }
});

engine.runRenderLoop(function() {
    camera.speed = cameraSpeed * (mapKeys.get('Shift') ? shiftMultiplier : 1);

    if (mapKeys.get(' ')) {
        camera.cameraDirection = new Vector3(0, 1, 0);
    }
    if (mapKeys.get('x')) {
        camera.cameraDirection = new Vector3(0, -1, 0);
    }

    if (scene.activeCamera) {
        scene.render();
    }

    divFps.innerHTML = engine.getFps().toFixed() + " fps";
});
