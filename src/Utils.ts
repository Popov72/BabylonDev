import {
    Color3,
    CubeTexture,
    Mesh,
    MeshBuilder,
    SceneLoader,
    StandardMaterial,
    Scene
} from "babylonjs";

import {
    OBJFileLoader
} from "babylonjs-loaders";

export default class Utils {

    public static XMScalarModAngle(angle: number): number {
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

    public static addSkybox(skyboxName: string = "Runyon_Canyon_A_2k_cube_specular.dds", scene: Scene, size: number = 1000): Mesh {
        const skybox = MeshBuilder.CreateBox("skyBox", { size: size }, scene);
        const skyboxMaterial = new StandardMaterial("skyBox", scene);

        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new CubeTexture("resources/texture/" + skyboxName, scene);
        skyboxMaterial.reflectionTexture!.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
        skyboxMaterial.specularColor = new Color3(0, 0, 0);
        skyboxMaterial.disableLighting = true;
        skyboxMaterial.disableDepthWrite = true;

        skybox.material = skyboxMaterial;
        skybox.alwaysSelectAsActiveMesh = true;

        return skybox;
    }

    public static async loadObj(scene: Scene, path: string, name: string) {
        //OBJFileLoader.COMPUTE_NORMALS = true;
        //OBJFileLoader.INVERT_Y  = false;
        OBJFileLoader.OPTIMIZE_WITH_UV = true;
        OBJFileLoader.MATERIAL_LOADING_FAILS_SILENTLY = false;
        OBJFileLoader.INVERT_TEXTURE_Y  = false;

        return SceneLoader.AppendAsync(path, name, scene);
    }

}
