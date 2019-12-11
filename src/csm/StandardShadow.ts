import {
    Color3,
    DirectionalLight,
    Matrix,
    Mesh,
    Scene,
    ShadowGenerator,
    StandardMaterial,
    UniversalCamera,
    Vector3,
} from "babylonjs";

import Sample from "../Sample";
import Utils from "../Utils";
import ISampleSplit from "./ISampleSplit";
import { ISceneDescription } from "./GlobalGUI";
import SplitBase from "./SplitBase";
import StandardShadowGUI from "./StandardShadowGUI";

export default class StandardShadow extends SplitBase {

    public static className: string = "Standard";

    protected bias: number;
    protected filteringQuality: number;
    protected sun: DirectionalLight;
    protected _shadowGenerator: ShadowGenerator;

    constructor(scene: Scene, camera: UniversalCamera, parent: Sample, name: string) {
        super(scene, camera, parent, name);

        this.bias = 0.007;
        this.filteringQuality = ShadowGenerator.QUALITY_HIGH;
        this.sun = null as any;
        this._shadowGenerator = null as any;
    }

    public get lightColor(): string {
        return this._sunColor.toHexString();
    }

    public set lightColor(lc: string) {
        this._sunColor = Color3.FromHexString(lc);
        this.sun.diffuse = this._sunColor;
    }

    public get lightDirection(): Vector3 {
        return this._sunDir;
    }

    public set lightDirection(ld: Vector3) {
        this._sunDir = ld;
        this.sun.direction = ld;
    }

    public get shadowMapSize(): number {
        return this._shadowMapSize;
    }

    public set shadowMapSize(sms: number) {
        this._shadowMapSize = sms;
        this.createShadowGenerator();
    }

    public get shadowMapFilter(): number {
        return this._shadowMapFilter;
    }

    public set shadowMapFilter(smf: number) {
        this._shadowGenerator.filter = smf;
        this._shadowMapFilter = this._shadowGenerator.filter;
    }

    public createGUI(): void {
        this.gui = new StandardShadowGUI(this.name, this.scene.getEngine(), this._container, this);

        this.gui.createGUI();
    }

    public async initialize(scene: ISceneDescription, ambientColor: Color3, sunDir: Vector3): Promise<ISampleSplit> {
        this.scene.metadata = { "name": this.name };
        this._sceneName = scene.dname;

        this._sunDir = sunDir;
        this._sunColor = scene.sunColor.clone();

        this.sun = new DirectionalLight("sun", sunDir, this.scene);
        this.sun.intensity = 1;
        this.sun.shadowMinZ = -80;
        this.sun.shadowMaxZ = 150;
        this.sun.diffuse = this._sunColor;

        await Utils.loadObj(this.scene, scene.path, scene.name);

        this.scene.activeCamera = this.camera;

        Utils.addSkybox("Clouds.dds", this.scene, this.camera.maxZ - 1);

        this.scene.meshes.forEach((m) => {
            if (m.name == 'skyBox' || m.name.endsWith("_gui")) { return; }

            if (!m.material) { return; }

            const mat = m.material as StandardMaterial;

            mat.diffuseColor = new Color3(1., 1., 1.);
            mat.specularColor = new Color3(0., 0., 0.);
            mat.ambientColor = ambientColor;
            mat.ambientTexture = null;
            mat.backFaceCulling = scene.backfaceCulling;

            if (!mat.diffuseTexture) {
                mat.ambientColor = new Color3(0, 0, 0);
            }
            //!mat.freeze();

            m.receiveShadows = true;

            if (scene.scaling != 1) {
                let matrix = Matrix.Identity();
                matrix.scaleToRef(scene.scaling, matrix);
                matrix.setRowFromFloats(3, 0, 0, 0, 1);
                (m as Mesh).bakeTransformIntoVertices(matrix);
            }
        });

        this.createShadowGenerator();

        return this;
    }

    protected createShadowGenerator(): void {
        if (this._shadowGenerator) {
            this._shadowGenerator.dispose();
            this._shadowGenerator = null as any;
        }

        const shadowGenerator = new ShadowGenerator(this.shadowMapSize, this.sun);

        shadowGenerator.filter = this._shadowMapFilter;
        shadowGenerator.bias = this.bias;
        shadowGenerator.filteringQuality = this.filteringQuality;

        this._shadowGenerator = shadowGenerator;

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
