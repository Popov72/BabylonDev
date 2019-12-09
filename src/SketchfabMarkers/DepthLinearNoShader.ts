import {
    Scene,
    StandardMaterial,
    UniversalCamera,
    Texture,
    Vector3,
    HemisphericLight,
    MeshBuilder,
    DepthRenderer,
} from "babylonjs";

import Sample from "../Sample";
import Split from "../Split";

export default class DepthLinearNoShader extends Split {

    constructor(scene: Scene, camera: UniversalCamera, parent: Sample, name: string) {
        super(scene, camera, parent, name);

        this.dimensions.height = 50;
        this.showCloseButton = false;
    }

    public initialize(): void {
        var light = new HemisphericLight("HemiLight", new Vector3(0, 2, 0), this.scene);

        this.camera.maxZ = 100;

        var renderer = (this.scene as any).enableDepthRenderer(this.camera, false) as DepthRenderer;

        renderer.useOnlyInActiveCamera = true;
        renderer.getDepthMap().ignoreCameraViewport = false;

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

        var canvasZone = document.body;

        var sprites = [
            { pos: new Vector3(1, 0, 0), elem: document.createElement('div'), color: '#00ff00', width: 40, height: 40 },
            { pos: new Vector3(0, 0.5, 1.0), elem: document.createElement('div'), color: '#ff0000', width: 40, height: 40 }
        ];

        sprites.forEach((sprite) => {
            sprite.elem.style.position = 'absolute';
            sprite.elem.style.width = sprite.width + 'px';
            sprite.elem.style.height = sprite.height + 'px';
            sprite.elem.style.backgroundColor = sprite.color;
            sprite.elem.style.top = '0px';
            sprite.elem.style.left = '0px';

            canvasZone.appendChild(sprite.elem);
        });

        var depthMap = renderer.getDepthMap();

        var buffer = new Float32Array(4 * depthMap.getSize().width * depthMap.getSize().height);

        //this.scene.autoClear = true;

        this.scene.onAfterRenderObservable.add(() => {

            depthMap.readPixels(0, 0, buffer); // that's too slow to do that each frame...

            sprites.forEach((sprite) => {
                var posInView = Vector3.TransformCoordinates(sprite.pos, this.scene.getViewMatrix());
                var posInViewProj = Vector3.TransformCoordinates(sprite.pos, this.scene.getTransformMatrix());
                var screenCoords = posInViewProj.multiplyByFloats(0.5, -0.5, 1.0).add(new Vector3(0.5, 0.5, 0.0)).
                                        multiplyByFloats(this.scene.getEngine().getRenderWidth(), this.scene.getEngine().getRenderHeight(), 1);

                var px = screenCoords.x - sprite.width / 2;
                var py = screenCoords.y - sprite.height / 2;

                sprite.elem.style.left = (px + canvasZone.offsetLeft) + 'px';
                sprite.elem.style.top = (py + canvasZone.offsetTop) + 'px';

                px = Math.floor(px + sprite.width / 2);
                py = Math.floor(this.scene.getEngine().getRenderHeight() - (py + sprite.height / 2));

                var zInZBuff = buffer[4 * (px + py * depthMap.getSize().width)];

                var z = (posInView.z - this.camera.minZ) / (-this.camera.minZ + this.camera.maxZ);

                if (z > zInZBuff) {
                    sprite.elem.style.opacity = "0.3";
                } else {
                    sprite.elem.style.opacity = "1.0";
                }
            });
        });
    }

}
