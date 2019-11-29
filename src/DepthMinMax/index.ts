import {
    Scene,
    Vector3,
    HemisphericLight,
    Mesh
} from "babylonjs";

export default class Sample {
    public static CreateScene(scene: Scene): void {
        var light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);

        light.intensity = 0.7;

        var sphere = Mesh.CreateSphere("sphere1", 16, 2, scene);

        sphere.position.y = 1;

        var ground = Mesh.CreateGround("ground1", 6, 6, 2, scene);
    }
}
