import jQuery from "jquery";

import {
    Engine, UniversalCamera, Vector3, Scene
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

let divFps = document.getElementById("fps") as HTMLElement;

var scene = new Scene(engine);
var camera = new UniversalCamera("camera1", new Vector3(0, 5, -10), scene);

camera.setTarget(Vector3.Zero());
camera.attachControl(canvas, true);

scene.activeCamera = camera;

Sample.CreateScene(scene);

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

let locked = false;

scene.onPointerObservable.add((pointerInfo) => {
    switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERDOWN:
            if (pointerInfo.event.button == 2) {
                if (!locked) {
                    locked = true;
                    canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
                    if (canvas.requestPointerLock) {
                        canvas.requestPointerLock();
                    }
                } else {
                    document.exitPointerLock();
                    locked = false;
                }
            }
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
