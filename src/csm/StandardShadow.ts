import {
    Color3,
    DirectionalLight,
    Mesh,
    Scene,
    ShadowGenerator,
    StandardMaterial,
    UniversalCamera,
    Vector3,
} from "babylonjs";

import Split from "../Split";
import Utils from "../Utils";
import ISampleSplit from "./ISampleSplit";

export default class StandardShadow extends Split implements ISampleSplit {

    public static className: string = "Standard";

    protected shadowGenerator: ShadowGenerator;
    protected bias: number;
    protected filter: number;
    protected filteringQuality: number;
    protected shadowTextureSize: number;
    protected sun: DirectionalLight;

    constructor(scene: Scene, camera: UniversalCamera, name: string) {
        super(scene, camera, name);

        this.shadowGenerator = <any>null;
        this.filter = ShadowGenerator.FILTER_NONE;
        this.bias = 0.007;
        this.filteringQuality = ShadowGenerator.QUALITY_HIGH;
        this.shadowTextureSize = 1024;
        this.sun = <any>null;
    }

    public updateLightDirection(lightDir: Vector3): void {
        this.sun.direction = lightDir;
    }

    public async initialize(scenePath: string, sceneName: string, ambientColor: Color3, sunDir: Vector3, backfaceCulling: boolean): Promise<ISampleSplit> {
        this.scene.metadata = { "name": this.name };

        this.sun = new DirectionalLight("sun", sunDir, this.scene);
        this.sun.intensity = 1;
        this.sun.shadowMinZ = -80;
        this.sun.shadowMaxZ = 150;

        await Utils.loadObj(this.scene, scenePath, sceneName);

        this.scene.activeCamera = this.camera;

        Utils.addSkybox("Clouds.dds", this.scene);

        this.scene.meshes.forEach((m) => {
            if (m.name == 'skyBox') { return; }

            if (!m.material) { return; }

            const mat = m.material as StandardMaterial;

            mat.diffuseColor = new Color3(1., 1., 1.);
            mat.specularColor = new Color3(0., 0., 0.);
            mat.ambientColor = ambientColor;
            mat.ambientTexture = null;
            mat.backFaceCulling = backfaceCulling;
            //!mat.freeze();

            m.receiveShadows = true;
        });

        this.createShadowGenerator();

        return this;
    }

    protected createShadowGenerator(): void {
        const shadowGenerator = new ShadowGenerator(this.shadowTextureSize, this.sun);

        shadowGenerator.filter = this.filter;
        shadowGenerator.bias = this.bias;
        shadowGenerator.filteringQuality = this.filteringQuality;

        this.shadowGenerator = shadowGenerator;

        const renderList = shadowGenerator.getShadowMap()!.renderList!;

        let num = 0, lstm: Array<Mesh> = [];
        this.scene.meshes.forEach((m) => {
            if (m.name == 'skyBox') { return; }
            renderList.push(m);
            /*if (m.name == "mesh_108_Mesh_main_floor_subset_6" || m.name == "mesh_121_Mesh_g_bace_main05_subset_0") {
                if (m.name=="mesh_121_Mesh_g_bace_main05_subset_0")
                    renderList.push(m);
            } else
                lstm.push(m);*/
        });
        lstm.forEach((m) => {
            m.dispose();
        });
    }

}
