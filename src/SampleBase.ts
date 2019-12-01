import {
    Color3,
    CubeTexture,
    MeshBuilder,
    Scene,
    StandardMaterial,
    TargetCamera,
} from "babylonjs";

export default class Sample {

    protected scene:    Scene;
    protected camera:   TargetCamera;

    constructor(scene: Scene) {
        this.scene = scene;
        this.camera = scene.activeCamera as TargetCamera;
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

    protected addSkybox(skyboxName: string = "Runyon_Canyon_A_2k_cube_specular.dds"): void {
        const skybox = MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, this.scene);
        const skyboxMaterial = new StandardMaterial("skyBox", this.scene);

        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = CubeTexture.CreateFromPrefilteredData("resources/texture/" + skyboxName, this.scene);
        skyboxMaterial.reflectionTexture!.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
        skyboxMaterial.specularColor = new Color3(0, 0, 0);
        skyboxMaterial.disableLighting = true;
        skybox.material = skyboxMaterial;
    }

}
