import { Scene, UniversalCamera } from "babylonjs";

import Sample from "./Sample";
import Split from "./Split";

class SplitBasic extends Split {

    constructor(scene: Scene, camera: UniversalCamera, parent: Sample, name: string = "default") {
        super(scene, camera, parent, name);
    }
}

export default class SampleBasic extends Sample {

    protected _split: Split;

    protected populateScene(scene: Scene, camera: UniversalCamera) {
    }

    protected create() {
        this.registerClass("split", SplitBasic);

        let split = this.addSplit("split", "basic", true, false) as SplitBasic;

        this._split = split;

        this.populateScene(split.scene, split.camera);

        jQuery(document.body).append('<div id="fps"></div>');
    }

}
