import {
    Scene,
    UniversalCamera,
} from "babylonjs";

import SampleBasic from "../SampleBasic";

import {
    AdvancedDynamicTexture,
    Checkbox,
    TextBlock,
    Control,
    ScrollViewer,
    Container,
    Button,
} from "babylonjs-gui";

export default class ScrollViewer2 extends SampleBasic {

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
        var adt = AdvancedDynamicTexture.CreateFullscreenUI("UI");

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
            sv.freezeControls = value;
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
        header.color = "white";
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
            sv.setBucketSizes(value ? 110 : 0, value ? 40 : 0);
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
        header.color = "white";
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
        stats.color = "white";
        adt.addControl(stats);

        var sv = new ScrollViewer();
        sv.width = 0.50;
        sv.height = 0.75;
        sv.background = "orange";
        sv.forceHorizontalBar = true;
        sv.forceVerticalBar = true;

        (window as any).sv = sv;

        adt.addControl(sv);

        var cwidth = 10000, cheight = 10000;
        var numButtons = 10000;
        var btnWidth = 100, btnHeight = 30, btnFontSize = 12;
        var colors = ['red', 'blue', 'green', 'yellow', 'white', 'lightgreen'];

        var main = new Container();
        main.width = cwidth + "px";
        main.height = cheight + "px";

        sv.addControl(main);

        for (let i = 0; i < numButtons; ++i) {
            var btn = Button.CreateSimpleButton("btn" + i, "Button " + i);
            btn.width = btnWidth + "px";
            btn.height = btnHeight + "px";
            btn.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            btn.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            btn.fontSize = btnFontSize;
            btn.background = colors[Math.floor(Math.random() * colors.length)];
            btn.left = Math.random() * cwidth + "px";
            btn.top = Math.random() * cheight + "px";
            main.addControl(btn);
        }

        scene.onBeforeRenderObservable.add(() => adt.markAsDirty()); // make sure the GUI is redrawn continously

        let numChildControls = this._countChildren(main._children);

        scene.onAfterRenderObservable.add(() => {
            stats.text = numChildControls + " controls, " + adt.numLayoutCalls + " layout calls, " + adt.numRenderCalls + " render calls";
        });

    }
}

SampleBasic.registerSampleClass("scrollviewer2", {
    "displayName": "Display lots of controls in a scroll viewer",
    "description": "",
    "class": ScrollViewer2,
});
