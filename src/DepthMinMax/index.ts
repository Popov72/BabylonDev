import {
    DirectionalLight,
    Scene,
    Vector3,
    UniversalCamera,
    HemisphericLight,
} from "babylonjs";

import SampleBasic from "../SampleBasic";
import Utils from "../Utils";

export default class DepthMinMax extends SampleBasic {

    protected async populateScene(scene: Scene, camera: UniversalCamera) {
        camera.position.x = 100;
        camera.position.y = 5;
        camera.position.z = 5;

        camera.setTarget(Vector3.Zero());

        await Utils.loadObj(scene, "./resources/3d/powerplant/", "powerplant.obj");

        Utils.addSkybox("Clouds.dds", scene);

        let sunDir = new Vector3(32, -30, 22);

        let sun = new DirectionalLight("sun", sunDir, scene);
        sun.intensity = 1;

        let hemil = new HemisphericLight("hemil", new Vector3(0, 1, 0), scene);
        hemil.intensity = 1;

        return Promise.resolve(0);
    }

}

SampleBasic.registerSampleClass("depthminmax", {
    "displayName": "Calculate depth min and max in scene zbuffer",
    "description": "",
    "class": DepthMinMax,
});
