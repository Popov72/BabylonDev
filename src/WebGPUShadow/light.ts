import { mat4, vec3, quat } from "gl-matrix";
import { lookAtLH, orthoLH, XMScalarModAngle } from "./math";

const up: vec3 = [0, 1, 0];

export class Light {

    private _direction: vec3 = vec3.create();
    private _position: vec3 = vec3.create();
    private _dirty: boolean;
    private _viewMatrix: mat4 = mat4.create();
    private _projectionMatrix: mat4 = mat4.create();
    private _transformMatrix: mat4 = mat4.create();
    private _target: vec3 = [0, 0, 0];

    public get direction(): Float32Array {
        return this._direction as Float32Array;
    }

    public set direction(dir: Float32Array) {
        this._direction = dir;
        this._dirty = true;
    }

    constructor(direction: vec3, position?: vec3) {
        vec3.copy(this._direction, direction);
        vec3.normalize(this._direction, this._direction);

        if (position === undefined) {
            vec3.copy(this._position, this._direction);
            vec3.negate(this._position, this._position);
        } else {
            vec3.copy(this._position, position);
        }

        this._dirty = true;
    }

    public getTransformationMatrix(): Float32Array {
        if (this._dirty) {
            this.computeTransformationMatrix();
        }

        return this._transformMatrix as Float32Array;
    }

    public rotateLight(deltaTime: number): void {
        let matrix = mat4.create();

        let rotY = XMScalarModAngle(deltaTime * 0.25);

        let rotation: quat = quat.create();

        quat.setAxisAngle(rotation, up, rotY);

        mat4.fromQuat(matrix, rotation);

        vec3.transformMat4(this._direction, this._direction, matrix);
    }

    protected computeTransformationMatrix() {
        vec3.add(this._target, this._position, this._direction);

        lookAtLH(this._viewMatrix, this._position, this._target, [0, 1, 0]);

        const _orthoRight = 67.59060364524424, _orthoLeft = -63.64187195930481;
        const _orthoTop = 46.65612685078382, _orthoBottom = -39.246330294585235;
        const shadowMinZ = -90, shadowMaxZ = 130;

        const xOffset = _orthoRight - _orthoLeft;
        const yOffset = _orthoTop - _orthoBottom;
        const shadowOrthoScale = 0.1;

        orthoLH(this._projectionMatrix, _orthoLeft - xOffset * shadowOrthoScale, _orthoRight + xOffset * shadowOrthoScale,
            _orthoBottom - yOffset * shadowOrthoScale, _orthoTop + yOffset * shadowOrthoScale,
            shadowMinZ, shadowMaxZ);

        mat4.multiply(this._transformMatrix, this._projectionMatrix, this._viewMatrix);
    }
}
