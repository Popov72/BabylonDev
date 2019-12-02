import {
    Color3,
    CubeTexture,
    MeshBuilder,
    Scene,
    StandardMaterial,
    UniversalCamera,
    Engine,
    Vector3,
    SceneLoader,
} from "babylonjs";

import {
    OBJFileLoader
} from "babylonjs-loaders";

const cameraSpeed = 5,
      shiftMultiplier = 3;

export default class Sample {

    protected engine:       Engine;
    protected canvas:       HTMLCanvasElement;
    protected mapKeys:      Map<String, boolean>;
    protected cameras:      Array<UniversalCamera>;

    protected mainScene:    Scene | undefined;
    protected mainCamera:   UniversalCamera | undefined;

    constructor(engine: Engine, canvas: HTMLCanvasElement) {
        this.engine = engine;
        this.canvas = canvas;
        this.mapKeys = new Map<String, boolean>();
        this.cameras = [];
    }

    public create(): void {

    }

    public onBeforeRender(deltaTime: number): void {
        if (!this.mainCamera) {
            return;
        }

        this.cameras.forEach((camera) => {
            camera.speed = cameraSpeed * (this.mapKeys.get('Shift') ? shiftMultiplier : 1);

            if (this.mapKeys.get(' ')) {
                camera.cameraDirection = new Vector3(0, 1, 0);
            }

            if (this.mapKeys.get('x')) {
                camera.cameraDirection = new Vector3(0, -1, 0);
            }
        });
    }

    public render(): void {
        if (this.mainScene) {
            this.mainScene.render();
        }
    }

    protected createSceneAndCamera(): [Scene, UniversalCamera] {
        const scene = new Scene(this.engine);
        const camera = new UniversalCamera("camera" + this.cameras.length, new Vector3(0, 5, -10), scene);

        camera.fov = Math.PI / 4;
        camera.setTarget(Vector3.Zero());

        this.cameras.push(camera);

        camera.inertia = 0;
        camera.angularSensibility = 500;

        camera.keysUp.push(90); // Z
        camera.keysDown.push(83); // S
        camera.keysLeft.push(81); // Q
        camera.keysRight.push(68); // D

        scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    this.mapKeys.set(kbInfo.event.key, true);
                    break;
                case BABYLON.KeyboardEventTypes.KEYUP:
                    this.mapKeys.set(kbInfo.event.key, false);
                    break;
            }
        });

        this.enablePointerLock(scene);

        camera.attachControl(this.canvas, true);

        if (!this.mainScene) {
            this.mainScene = scene;
        }

        if (!this.mainCamera) {
            this.mainCamera = camera;
        }

        scene.activeCamera = camera;

        return [scene, camera];
    }

    protected enablePointerLock(scene: Scene): void {
        let locked = false;

        scene.onPointerObservable.add((pointerInfo) => {
            switch (pointerInfo.type) {
                case BABYLON.PointerEventTypes.POINTERDOWN:
                    if (pointerInfo.event.button == 2) {
                        if (!locked) {
                            locked = true;
                            this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.msRequestPointerLock || this.canvas.mozRequestPointerLock || this.canvas.webkitRequestPointerLock;
                            if (this.canvas.requestPointerLock) {
                                this.canvas.requestPointerLock();
                            }
                        } else {
                            document.exitPointerLock();
                            locked = false;
                        }
                    }
                    break;
            }
        });
    }

    protected XMScalarModAngle(angle: number): number {
        // Normalize the range from 0.0f to XM_2PI
        angle = angle + Math.PI;

        // Perform the modulo, unsigned
        let fTemp = Math.abs(angle);

        const PIPI = Math.PI * 2;

        fTemp = fTemp - (PIPI * Math.floor(fTemp / PIPI));

        // Restore the number to the range of -XM_PI to XM_PI-epsilon
        fTemp = fTemp - Math.PI;

        // If the modulo'd value was negative, restore negation
        if (angle < 0.0) {
            fTemp = -fTemp;
        }

        return fTemp;
    }

    protected addSkybox(skyboxName: string = "Runyon_Canyon_A_2k_cube_specular.dds", scene: Scene): void {
        const skybox = MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
        const skyboxMaterial = new StandardMaterial("skyBox", scene);

        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new CubeTexture("resources/texture/" + skyboxName, scene);
        skyboxMaterial.reflectionTexture!.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
        skyboxMaterial.specularColor = new Color3(0, 0, 0);
        skyboxMaterial.disableLighting = true;
        skybox.material = skyboxMaterial;
    }

    protected async loadObj(scene: Scene, path: string, name: string) {
        //OBJFileLoader.COMPUTE_NORMALS = true;
        //OBJFileLoader.INVERT_Y  = false;
        OBJFileLoader.OPTIMIZE_WITH_UV = true;
        OBJFileLoader.MATERIAL_LOADING_FAILS_SILENTLY = false;
        OBJFileLoader.INVERT_TEXTURE_Y  = false;

        return SceneLoader.AppendAsync(path, name, scene);
    }

}
