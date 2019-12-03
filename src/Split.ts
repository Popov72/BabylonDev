import { Scene, UniversalCamera } from "babylonjs";

export default class Split {

    public scene:       Scene;
    public camera:      UniversalCamera;
    public name:        string;
    public isLoading:   boolean;

    constructor(scene: Scene, camera: UniversalCamera, name: string = "default") {
        this.scene = scene;
        this.camera = camera;
        this.name = name;
        this.isLoading = false;
    }

    public render(): void {
        this.scene.render();
    }
}
