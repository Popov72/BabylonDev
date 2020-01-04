import * as React from "react";

import {
    Engine,
} from 'babylonjs';

import SplitBaseGUI from "./SplitBaseGUI";
import Sample from "../Sample";
import ISampleSplit from "./ISampleSplit";

export default class CSMGUI extends SplitBaseGUI {

    constructor(name: string, engine: Engine, container: Sample, parent: ISampleSplit) {
        super(name, engine, container, parent);

        this._showAutoCalcPlanes = false;
        this._showCSM = true;
        this.dimensions.height = 950;
    }

    protected createCustomGUIProperties(): React.ReactElement {
        const Properties = () => {

            return (
                <>
                </>
            );
        };

        return Properties();
    }

}
