import {
    Scene,
    UniversalCamera,
    Color4,
} from "babylonjs";

import { RENDERING_2D_TEXTURE } from "./constants";
import { create2dPlan, createPlan, createRooms, racksToRooms } from "./utils";

import SampleBasic from "../SampleBasic";
import {
    AdvancedDynamicTexture,
    Checkbox,
    Control,
    TextBlock,
    Container,
} from "babylonjs-gui";

export default class ScrollViewer extends SampleBasic {

    protected _countChildren(lc: Control[]): number {
        let num = 0;

        for (let c of lc) {
            num++;
            if (c instanceof Container) {
                num += this._countChildren(c._children);
            }
        }

        return num;
    }

    protected populateScene(scene: Scene, camera: UniversalCamera) {
        camera.position.copyFromFloats(-250, 250, -250);

        scene.clearColor = new Color4(0.9, 0.9, 0.85, 1.0);
        //scene.attachControl();

        const adt = AdvancedDynamicTexture.CreateFullscreenUI(
          RENDERING_2D_TEXTURE,
          false,
          scene
        );
        adt.renderScale = 1.5;
        adt.isForeground = false;

        const mappingConfig = {
          roomPadding: 5,
          racksSpacingX: 10,
          racksSpacingY: 80,
          minRoomWidth: 100,
          minRoomDepth: 100,
          planPadding: 10,
          roomSpacingX: 50,
          roomHeight: 100,
          planHeight: 0
        };

        const racks = createRooms({
          rooms: 10,
          racksPerRoom: 100,
          devicesPerRack: 30,
          devicesPerPosition: 1,
          rackHeight: 49,
          racksPerRow: 3,
          deviceHeight: 1
        });

        const rooms = racksToRooms(racks, mappingConfig);
        const planData = createPlan("plan001", rooms, mappingConfig);
        const main = create2dPlan(planData);

        main.forceHorizontalBar = true;
        main.forceVerticalBar = true;

        var checkbox = new Checkbox();
        checkbox.top = "5px";
        checkbox.left = "5px";
        checkbox.width = "20px";
        checkbox.height = "20px";
        checkbox.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        checkbox.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        checkbox.isChecked = false;
        checkbox.color = "green";
        checkbox.onIsCheckedChangedObservable.add(function(value) {
            main.freezeControls = value;
            setbuckets.isEnabled = value;
        });
        adt.addControl(checkbox);

        var header = new TextBlock();
        header.top = "5px";
        header.left = "30px";
        header.text = "freeze controls";
        header.width = "120px";
        header.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        header.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        header.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        header.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        header.color = "black";
        adt.addControl(header);

        var setbuckets = new Checkbox();
        setbuckets.top = "30px";
        setbuckets.left = "30px";
        setbuckets.width = "20px";
        setbuckets.height = "20px";
        setbuckets.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        setbuckets.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        setbuckets.isChecked = false;
        setbuckets.isEnabled = false;
        setbuckets.color = "green";
        setbuckets.onIsCheckedChangedObservable.add(function(value) {
            main.setBucketSizes(value ? 280 : 0, value ? 30 : 0);
        });
        adt.addControl(setbuckets);

        header = new TextBlock();
        header.top = "30px";
        header.left = "55px";
        header.text = "use buckets";
        header.width = "120px";
        header.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        header.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        header.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        header.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        header.color = "black";
        adt.addControl(header);

        var stats = new TextBlock();
        stats.top = "55px";
        stats.left = "5px";
        stats.text = "";
        stats.width = "500px";
        stats.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        stats.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        stats.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        stats.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        stats.color = "black";
        adt.addControl(stats);

        scene.onBeforeRenderObservable.add(() => adt.markAsDirty()); // make sure the GUI is redrawn continously

        let numChildControls = this._countChildren(main._children);

        let lastTime = new Date().getTime();

        scene.onAfterRenderObservable.add(() => {
            let curTime = new Date().getTime();

            stats.text = numChildControls + " controls, " + adt.numLayoutCalls + " layout calls, " + adt.numRenderCalls + " render calls";
            //console.log("duration=" + (curTime - lastTime));

            lastTime = curTime;
        });

        adt.addControl(main);
    }

}

SampleBasic.registerSampleClass("scrollviewer", {
    "displayName": "Display lots of controls in a scroll viewer",
    "description": "",
    "class": ScrollViewer,
});
