import * as React from "react";

import {
    Scene,
    UniversalCamera,
} from "babylonjs";

import GUI from "./GUI";
import Sample from "./Sample";

export default class Split extends GUI {

    public static className: string = "Split";

    public scene:           Scene;
    public camera:          UniversalCamera;
    public name:            string;
    public isLoading:       boolean;
    public group:           number;

    protected _container:   Sample;

    constructor(scene: Scene, camera: UniversalCamera, parent: Sample, name: string = "default") {
        super(name, scene.getEngine());

        this.scene = scene;
        this.camera = camera;
        this.name = name;
        this.isLoading = false;
        this.group = 0;
        this._container = parent;
    }

    public render(): void {
        this.scene.render();
    }

    public canClose(): boolean {
        return this._container.splitNumber > 1;
    }

    public closed(): void {
        this._container.removeSplit(this);
    }

    public getBounds(): { x: number, y: number, w: number, h: number } {
        return this._container.getSplitBounds(this);
    }

}
