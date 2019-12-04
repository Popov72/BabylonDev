import { Scene, UniversalCamera } from "babylonjs";

export default class Split {

    public static className: string = "Split";

    public scene:       Scene;
    public camera:      UniversalCamera;
    public name:        string;
    public isLoading:   boolean;
    public group:       number;

    constructor(scene: Scene, camera: UniversalCamera, name: string = "default") {
        this.scene = scene;
        this.camera = camera;
        this.name = name;
        this.isLoading = false;
        this.group = 0;
    }

    public render(): void {
        this.scene.render();
    }
}
