import {
    Scene,
    Vector3,
    UniversalCamera,
    PointLight,
    Color3,
    CubeTexture,
    SceneLoader,
    ArcRotateCamera,
    PBRMaterial,
    DebugLayer,
    Engine,
    Nullable,
    HemisphericLight,
    MeshBuilder,
    StandardMaterial,
    Texture,
    Material,
    Mesh,
} from "babylonjs";

import {
    AdvancedDynamicTexture,
    Checkbox,
    TextBlock,
    Control,
    Container,
    Button,
    Grid,
    StackPanel,
    RadioButton,
    Slider,
} from "babylonjs-gui";

import SampleBasic from "../SampleBasic";

export default class Transparency extends SampleBasic {

    protected populateScene(scene: Scene, camera: UniversalCamera) {
        camera.position = new Vector3(0, 5, -10);
        camera.setTarget(Vector3.Zero());

        var light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

        light.intensity = 0.7;

        MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);

        // Sphere with std material (on the left)
        var sphereStd = MeshBuilder.CreateSphere("Standard", {diameter: 2, segments: 32}, scene);

        sphereStd.position.y = 1;
        sphereStd.position.x = -1.5;

        var matStd = new StandardMaterial("matstd", scene);

        sphereStd.material = matStd;

        matStd.diffuseTexture = new Texture("resources/texture/cloud.png", scene);
        matStd.diffuseTexture.hasAlpha = true;
        matStd.useAlphaFromDiffuseTexture = true;
        matStd.useSpecularOverAlpha = true;
        matStd.alphaCutOff = 0.4;

        // Sphere with PBR material (on the right)
        var spherePbr = MeshBuilder.CreateSphere("PBR", {diameter: 2, segments: 32}, scene);

        spherePbr.position.y = 1;
        spherePbr.position.x = 1.5;

        var matPbr = new PBRMaterial("matpbr", scene);

        spherePbr.material = matPbr;

        matPbr.metallic = 1.0;
        matPbr.roughness = 0.4;

        matPbr.albedoTexture = new Texture("resources/texture/cloud.png", scene);
        matPbr.albedoTexture.hasAlpha = true;
        matPbr.useAlphaFromAlbedoTexture = true;
        matPbr.alphaCutOff = 0.4;

        this.makeGUI([matStd, matPbr], [sphereStd, spherePbr]);

        return scene;
    }

    private makeGUI(materials: Array<Material>, meshes: Array<Mesh>) {
        var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

        var grid = new Grid("grid");

        grid.addColumnDefinition(220, true);
        grid.addColumnDefinition(300, true);
        grid.addColumnDefinition(300, true);

        advancedTexture.addControl(grid);

        var stack = new StackPanel("panel");

        stack.left = "10px";
        stack.isVertical = true;
        stack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        stack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        grid.addControl(stack, 0, 0);

        // transparencyMode
        var addRadio = function(text: string, parent: Container, val: number | null) {
            var button = new RadioButton();
            button.width = "35px";
            button.height = "20px";
            button.color = "white";
            button.background = "green";
            button.isChecked = val == materials[0].transparencyMode;
            button.group = "g1";
            button.paddingLeft = "15px";

            button.onIsCheckedChangedObservable.add((state) => {
                if (state) {
                    materials.forEach((mat) => mat.transparencyMode = val);
                }
            });

            var header = Control.AddHeader(button, text, "250px", { isHorizontal: true, controlFirst: true });
            header.height = "25px";
            header.color = "white";
            header.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

            parent.addControl(header);
        };

        var header = new TextBlock();

        header.text = "Transparency mode:";
        header.width = "180px";
        header.height = "25px";
        header.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        header.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        header.color = "white";

        stack.addControl(header);

        addRadio("null", stack, null);
        addRadio("Opaque", stack, 0);
        addRadio("Alpha Test", stack, 1);
        addRadio("Alpha Blend", stack, 2);
        addRadio("Alpha Test + Blend", stack, 3);

        // alpha
        var stack2 = new StackPanel("panel2");

        stack2.left = "10px";
        stack2.isVertical = true;
        stack2.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        stack2.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        grid.addControl(stack2, 0, 1);

        var headerAlpha = new TextBlock();

        headerAlpha.text = "Alpha: " + materials[0].alpha;
        headerAlpha.height = "25px";
        headerAlpha.color = "white";
        headerAlpha.paddingLeft = "70px";
        headerAlpha.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        headerAlpha.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

        stack2.addControl(headerAlpha);

        var slider = new Slider();

        slider.minimum = 0;
        slider.maximum = 1;
        slider.value = 1;
        slider.height = "20px";
        slider.width = "200px";
        slider.color = "green";
        slider.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        slider.onValueChangedObservable.add(function(value) {
            headerAlpha.text = "Alpha: " + value;
            materials.forEach((mat) => mat.alpha = value);
        });

        stack2.addControl(slider);

        // alpha cut off
        var headerAlphaC = new TextBlock();

        headerAlphaC.text = "Alpha Cut Off: " + (materials[0] as any).alphaCutOff;
        headerAlphaC.height = "25px";
        headerAlphaC.color = "white";
        headerAlphaC.paddingLeft = "10px";
        headerAlphaC.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        headerAlphaC.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;

        stack2.addControl(headerAlphaC);

        slider = new Slider();

        slider.minimum = 0;
        slider.maximum = 1;
        slider.value = (materials[0] as any).alphaCutOff;
        slider.height = "20px";
        slider.width = "200px";
        slider.color = "green";
        slider.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        slider.onValueChangedObservable.add(function(value) {
            headerAlphaC.text = "Alpha Cut Off: " + value;
            materials.forEach((mat) => (mat as any).alphaCutOff = value);
        });

        stack2.addControl(slider);

        // use alpha from texture
        var checkbox = new Checkbox();

        checkbox.width = "20px";
        checkbox.height = "20px";
        checkbox.isChecked = (materials[0] as any).useAlphaFromDiffuseTexture;
        checkbox.color = "green";
        checkbox.onIsCheckedChangedObservable.add(function(value) {
            (materials[0] as any).useAlphaFromDiffuseTexture = value;
            (materials[1] as any).useAlphaFromAlbedoTexture = value;
        });

        header = Control.AddHeader(checkbox, "Use alpha from texture", "190px", { isHorizontal: true, controlFirst: false });

        header.height = "35px";
        header.color = "white";
        header.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

        stack2.addControl(header);

        // mesh visibility
        var headerVisibility = new TextBlock();

        headerVisibility.text = "Mesh visibility: " + meshes[0].visibility;
        headerVisibility.height = "50px";
        headerVisibility.color = "white";
        headerVisibility.paddingLeft = "20px";
        headerVisibility.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        headerVisibility.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;

        stack2.addControl(headerVisibility);

        slider = new Slider();

        slider.minimum = 0;
        slider.maximum = 1;
        slider.value = 1;
        slider.height = "20px";
        slider.width = "200px";
        slider.color = "green";
        slider.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        slider.onValueChangedObservable.add(function(value) {
            headerVisibility.text = "Mesh visibility: " + value;
            meshes.forEach((m) => m.visibility = value);
        });

        stack2.addControl(slider);

        // strict transparency mode
        var checkbox = new Checkbox();

        checkbox.width = "20px";
        checkbox.height = "20px";
        checkbox.isChecked = materials[0].strictTransparencyMode;
        checkbox.color = "green";
        checkbox.onIsCheckedChangedObservable.add(function(value) {
            materials.forEach((mat) => mat.strictTransparencyMode = value);
        });

        header = Control.AddHeader(checkbox, "Strict transparency mode", "210px", { isHorizontal: true, controlFirst: false });

        header.height = "35px";
        header.color = "white";
        header.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        header.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;

        grid.addControl(header, 0, 2);

        // mesh labels
        meshes.forEach((m) => {
            let btn = Button.CreateSimpleButton(m.name, m.name);

            btn.width = "150px";
            btn.height = "35px";
            btn.color = "white";
            btn.background = "green";
            btn.cornerRadius = 10;

            advancedTexture.addControl(btn);

            btn.linkWithMesh(m);
            btn.linkOffsetY = 160;
        });
    }
}

SampleBasic.registerSampleClass("transparency", {
    "displayName": "Test of the transparency/alpha properties",
    "description": "",
    "class": Transparency,
});
