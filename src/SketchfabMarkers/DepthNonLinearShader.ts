import {
    Effect,
    Scene,
    ShaderMaterial,
    StandardMaterial,
    UniversalCamera,
    Texture,
    Vector3,
    HemisphericLight,
    MeshBuilder,
    Engine,
    Vector2,
    DepthRenderer,
} from "babylonjs";

import Sample from "../Sample";
import Split from "../Split";

export default class DepthNonLinearShader extends Split {

    public createGUI(): void {
        this.gui!.dimensions.height = 50;
        this.gui!.showCloseButton = false;

        super.createGUI();
    }

    public initialize(): void {
        var light = new HemisphericLight("HemiLight", new Vector3(0, 2, 0), this.scene);

        var renderer = (this.scene as any).enableDepthRenderer(this.camera, true) as DepthRenderer;

        renderer.useOnlyInActiveCamera = true;
        renderer.getDepthMap().ignoreCameraViewport = false;

        Effect.ShadersStore["custom1VertexShader"] = `
            precision highp float;
            attribute vec3 position;
            attribute vec2 uv;
            uniform mat4 worldViewProjection;
            varying vec2 vUV;
            void main(void) {
                gl_Position = worldViewProjection * vec4(position, 1.0);
                vUV = uv;
            }`;

        Effect.ShadersStore["custom1FragmentShader"] = `
            precision highp float;
            varying vec2 vUV;
            uniform vec2 screenSize;
            uniform sampler2D textureSampler;
            uniform highp sampler2D depth;
               void main(void) {
                vec2 coords = gl_FragCoord.xy / screenSize;
                float d = texture2D(depth, coords).x;
                float z = gl_FragCoord.z;
                float a = z > d ? 0.3 : 1.0;
                gl_FragColor = vec4(texture2D(textureSampler, vUV).xyz, a);
            }`;

        // Box1
        var boxMaterial = new StandardMaterial("box", this.scene);

        boxMaterial.diffuseTexture = new Texture("resources/texture/crate.png", this.scene);

        var box = MeshBuilder.CreateBox("box", {}, this.scene);

        box.material = boxMaterial;

        // Box2
        var box2Material = new StandardMaterial("box2", this.scene);

        box2Material.diffuseTexture = new Texture("resources/texture/crate.png", this.scene);

        var box2 = MeshBuilder.CreateBox("box2", {}, this.scene);

        box2.material = box2Material;
        box2.position.x = 1.5;
        box2.position.z = 2;

        // Sprite1
        var spriteMaterial = new ShaderMaterial("mat1", this.scene, {
            vertex: "custom1",
            fragment: "custom1",
            },
            {
                attributes: ["position", "uv"],
                uniforms: ["worldViewProjection", "screenSize"],
                needAlphaBlending: true
            });

        spriteMaterial.setTexture("depth", renderer.getDepthMap());
        spriteMaterial.setTexture("textureSampler", new Texture("resources/texture/floor.png", this.scene));
        spriteMaterial.backFaceCulling = false;
        spriteMaterial.disableDepthWrite = true;
        spriteMaterial.alphaMode = Engine.ALPHA_COMBINE;
        spriteMaterial.depthFunction = Engine.ALWAYS;

        var sprite = MeshBuilder.CreatePlane("sprite", { size: 0.3 }, this.scene);

        sprite.material = spriteMaterial;
        sprite.position.x = 1.0;

        // Sprite2
        var sprite2 = MeshBuilder.CreatePlane("sprite", { size: 0.3 }, this.scene);

        sprite2.material = spriteMaterial;
        sprite2.position.y = 0.5;
        sprite2.position.z = 1.0;

        var engine = this.scene.getEngine();

        this.scene.autoClear = true;

        this.scene.onBeforeRenderObservable.add(() => {
            spriteMaterial.setVector2("screenSize", new Vector2(engine.getRenderWidth(), engine.getRenderHeight()));
        });

        [sprite, sprite2].forEach((spr) => {
            spr.onBeforeRenderObservable.add(() => {
                spr.lookAt(this.camera.position);
            });
        });
    }

}
