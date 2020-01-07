import {
    Camera,
    Constants,
    DepthRenderer,
    Nullable,
} from "babylonjs";

import { MinMaxReducer } from "./MinMaxReducer";

export class DepthReducer extends MinMaxReducer {

    private _depthRenderer: Nullable<DepthRenderer>;
    private _depthRendererId: string;

    constructor(camera: Camera) {
        super(camera);
    }

    public setDepthRenderer(depthRenderer: Nullable<DepthRenderer> = null, type: number = Constants.TEXTURETYPE_HALF_FLOAT, forceFullscreenViewport = true): void {
        const scene = this._camera.getScene();

        if (this._depthRenderer) {
            delete scene._depthRenderer[this._depthRendererId];

            this._depthRenderer.dispose();
            this._depthRenderer = null;
        }

        if (depthRenderer === null) {
            if (!scene._depthRenderer) {
                scene._depthRenderer = {};
            }

            depthRenderer = this._depthRenderer = new DepthRenderer(scene, type, this._camera, false);

            depthRenderer.getDepthMap().updateSamplingMode(Constants.TEXTURE_NEAREST_NEAREST);
            depthRenderer.enabled = false;

            this._depthRendererId = "minmax" + this._camera.id;

            scene._depthRenderer[this._depthRendererId] = depthRenderer;
        }

        super.setSourceTexture(depthRenderer.getDepthMap(), true, type, forceFullscreenViewport);
    }

    public activate(): void {
        if (this._depthRenderer) {
            this._depthRenderer.enabled = true;
        }

        super.activate();
    }

    public deactivate(): void {
        super.deactivate();

        if (this._depthRenderer) {
            this._depthRenderer.enabled = false;
        }
    }

    public dispose(disposeAll = true): void {
        super.dispose(disposeAll);

        if (this._depthRenderer && disposeAll) {
            delete this._depthRenderer.getDepthMap().getScene()?._depthRenderer[this._depthRendererId];

            this._depthRenderer.dispose();
            this._depthRenderer = null;
        }
    }

}