import { Scene, UniversalCamera } from "babylonjs";

import Sample from "./Sample";
import Split from "./Split";

class SplitBasic extends Split {

    constructor(scene: Scene, camera: UniversalCamera, name: string = "default") {
        super(scene, camera, name);
    }
}

export default class SampleBasic extends Sample {

    protected populateScene(scene: Scene, camera: UniversalCamera) {
    }

    protected create() {
        this.registerClass("split", SplitBasic);

        let split = this.addSplit("split", "basic") as SplitBasic;

        this.populateScene(split.scene, split.camera);
    }

}