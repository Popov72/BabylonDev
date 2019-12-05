import {
    Mesh,
    MeshBuilder,
    Scene,
    UniversalCamera,
    Vector3,
} from "babylonjs";

import * as GUI from "babylonjs-gui";

export default class Split {

    public static className: string = "Split";

    public scene:           Scene;
    public camera:          UniversalCamera;
    public name:            string;
    public isLoading:       boolean;
    public group:           number;

    public gui:             GUI.AdvancedDynamicTexture;
    public guiPlane:        Mesh;
    public guiPlaneWidth:   number;
    public guiPlaneHeight:  number;

    constructor(scene: Scene, camera: UniversalCamera, name: string = "default") {
        this.scene = scene;
        this.camera = camera;
        this.name = name;
        this.isLoading = false;
        this.group = 0;
        this.gui = <any>null;
        this.guiPlane = <any>null;
        this.guiPlaneWidth = this.guiPlaneHeight = 0;
    }

    public render(): void {
        this.scene.render();
    }

    public createGUI(textureWidth: number, textureHeight: number): void {
        this.guiPlaneWidth = textureWidth / textureHeight;
        this.guiPlaneHeight = 1;

        this.guiPlane = MeshBuilder.CreatePlane(this.name + "_gui", {
            "width": this.guiPlaneWidth,
            "height": this.guiPlaneHeight,
            "sideOrientation": Mesh.DOUBLESIDE,
        }, this.scene);

        this.guiPlane.position.x += this.guiPlaneWidth / 2;
        this.guiPlane.position.y -= this.guiPlaneHeight / 2;
        this.guiPlane.bakeCurrentTransformIntoVertices();

        this.guiPlane.alwaysSelectAsActiveMesh = true;

        this.gui = GUI.AdvancedDynamicTexture.CreateForMesh(this.guiPlane, textureWidth, textureHeight, false);

        var button1 = GUI.Button.CreateSimpleButton("but1", "Click Me");

        button1.width = 1;
        button1.height = 1;
        button1.color = "white";
        button1.fontSize = 50;
        button1.background = "green";

        this.gui.addControl(button1);
    }
}
