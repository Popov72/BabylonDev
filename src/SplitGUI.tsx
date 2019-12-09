import {
    Engine,
} from "babylonjs";

import GUI from "./GUI";
import Sample from "./Sample";
import Split from "./Split";

export default class SplitGUI extends GUI {

    protected _container:   Sample;
    protected _parent:      Split;

    constructor(name: string, engine: Engine, container: Sample, parent: Split) {
        super(name, engine);

        this._container = container;
        this._parent = parent;
    }

    public getBounds(): { x: number, y: number, w: number, h: number } {
        return this._container.getSplitBounds(this._parent);
    }

    public canClose(): boolean {
        return this._container.splitNumber > 1;
    }

    public closed(): void {
        this._container.removeSplit(this._parent);
    }

}
