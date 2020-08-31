import { ICamera } from "./ICamera";
import { mat4, vec3, quat, glMatrix } from "gl-matrix";

const rotY180: quat = [0, 1, 0, 0]; // x <=> -x
const cstDeg = 180 / Math.PI;

export class Camera implements ICamera {

    public position: vec3;
    public quaternion: quat;

    public fov: number;
    public aspect: number;
    public minZ: number;
    public maxZ: number;

    protected _viewMatrix: mat4;
    protected _projectionMatrix: mat4;
    protected _transformationMatrix: mat4;
    protected _upVector: vec3 = [0, 1, 0];
    protected _currentTarget: vec3 = [0, 0, 5];
    protected _transformedReferencePoint: vec3 = [0, 0, 0];
    protected _referencePoint: vec3 = [0, 0, 1];
    protected _camMatrix: mat4 = mat4.create();

    constructor(fov: number, aspect: number) {
        this.fov = fov;
        this.aspect = aspect;
        this.minZ = 0.25;
        this.maxZ = 250.0;
        this.position = [0, 0, 0];
        this.quaternion = [0, 0, 0, 1];

        this._viewMatrix = mat4.create();
        this._projectionMatrix = mat4.create();
        this._transformationMatrix = mat4.create();
    }

    public getTransformationMatrix(): Float32Array {
        let q: quat = [0, 0, 0, 0];
        quat.multiply(q, this.quaternion, rotY180);

        vec3.transformQuat(this._upVector, [0, 1, 0], q);

        vec3.transformQuat(this._transformedReferencePoint, this._referencePoint, q);

        vec3.add(this._currentTarget, this.position, this._transformedReferencePoint);

        this._lookAtLH(this._viewMatrix, this.position, this._currentTarget, this._upVector);

        mat4.scale(this._viewMatrix, this._viewMatrix, [1, 1, -1]);

        mat4.perspective(this._projectionMatrix, this.fov, this.aspect, this.minZ, this.maxZ);

        mat4.multiply(this._transformationMatrix, this._projectionMatrix, this._viewMatrix);

        return this._transformationMatrix as Float32Array;
    }

    public setTarget(target: vec3): void {
        let temp: vec3 = [0, 0, 0];

        vec3.sub(temp, target, this.position);

        let initialFocalDistance = vec3.length(temp);

        if (this.position[2] === target[2]) {
            this.position[2] += 0.001;
        }

        vec3.normalize(this._referencePoint, this._referencePoint);
        vec3.scale(this._referencePoint, this._referencePoint, initialFocalDistance);

        this._lookAtLH(this._camMatrix, this.position, target, [0, 1, 0]);

        mat4.invert(this._camMatrix, this._camMatrix);

        let rotationX = Math.atan(this._camMatrix[6] / this._camMatrix[10]);
        let rotationY, rotationZ = 0;

        let vDir: vec3 = [0, 0, 0];

        vec3.sub(vDir, target, this.position);

        if (vDir[0] >= 0.0) {
            rotationY = (-Math.atan(vDir[2] / vDir[0]) + Math.PI / 2.0);
        } else {
            rotationY = (-Math.atan(vDir[2] / vDir[0]) - Math.PI / 2.0);
        }

        if (isNaN(rotationX)) {
            rotationX = 0;
        }

        if (isNaN(rotationY)) {
            rotationY = 0;
        }

        if (isNaN(rotationZ)) {
            rotationZ = 0;
        }

        quat.fromEuler(this.quaternion, rotationX * cstDeg, rotationY * cstDeg, rotationZ * cstDeg);
    }

    private _lookAtLH(out: mat4, eye: vec3, center: vec3, up: vec3): mat4 {
        let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
        let eyex = eye[0];
        let eyey = eye[1];
        let eyez = eye[2];
        let upx = up[0];
        let upy = up[1];
        let upz = up[2];
        let centerx = center[0];
        let centery = center[1];
        let centerz = center[2];

        if (
          Math.abs(eyex - centerx) < glMatrix.EPSILON &&
          Math.abs(eyey - centery) < glMatrix.EPSILON &&
          Math.abs(eyez - centerz) < glMatrix.EPSILON
        ) {
          return mat4.identity(out);
        }

        z0 = centerx - eyex;
        z1 = centery - eyey;
        z2 = centerz - eyez;

        len = 1 / Math.hypot(z0, z1, z2);
        z0 *= len;
        z1 *= len;
        z2 *= len;

        x0 = upy * z2 - upz * z1;
        x1 = upz * z0 - upx * z2;
        x2 = upx * z1 - upy * z0;
        len = Math.hypot(x0, x1, x2);
        if (!len) {
          x0 = 0;
          x1 = 0;
          x2 = 0;
        } else {
          len = 1 / len;
          x0 *= len;
          x1 *= len;
          x2 *= len;
        }

        y0 = z1 * x2 - z2 * x1;
        y1 = z2 * x0 - z0 * x2;
        y2 = z0 * x1 - z1 * x0;

        len = Math.hypot(y0, y1, y2);
        if (!len) {
          y0 = 0;
          y1 = 0;
          y2 = 0;
        } else {
          len = 1 / len;
          y0 *= len;
          y1 *= len;
          y2 *= len;
        }

        out[0] = x0;
        out[1] = y0;
        out[2] = z0;
        out[3] = 0;
        out[4] = x1;
        out[5] = y1;
        out[6] = z1;
        out[7] = 0;
        out[8] = x2;
        out[9] = y2;
        out[10] = z2;
        out[11] = 0;
        out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
        out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
        out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
        out[15] = 1;

        return out;
      }
}