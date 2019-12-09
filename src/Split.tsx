import * as React from "react";

import {
    Scene,
    UniversalCamera,
} from "babylonjs";

import SplitGUI from "./SplitGUI";
import Sample from "./Sample";

export default class Split {

    public static className: string = "Split";

    public scene:           Scene;
    public camera:          UniversalCamera;
    public name:            string;
    public isLoading:       boolean;
    public group:           number;
    public gui:             SplitGUI | null;

    protected _container:   Sample;

    constructor(scene: Scene, camera: UniversalCamera, parent: Sample, name: string = "default") {
        this.scene = scene;
        this.camera = camera;
        this.name = name;
        this.isLoading = false;
        this.group = 0;
        this._container = parent;
        this.gui = new SplitGUI(this.name, this.scene.getEngine(), this._container, this);
    }

    public render(): void {
        this.scene.render();
    }

    public createGUI(): void {
        this.gui!.createGUI();
    }

}
