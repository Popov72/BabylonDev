import { ICamera } from "./ICamera";
import { mat4, vec3, quat } from "gl-matrix";
import { lookAtLH, perspectiveLH } from "./math";

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
    protected _currentTarget: vec3 = [0, 0, 0];
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
        vec3.transformQuat(this._upVector, [0, 1, 0], this.quaternion);

        vec3.transformQuat(this._transformedReferencePoint, this._referencePoint, this.quaternion);

        vec3.add(this._currentTarget, this.position, this._transformedReferencePoint);

        lookAtLH(this._viewMatrix, this.position, this._currentTarget, this._upVector);

        perspectiveLH(this._projectionMatrix, this.fov, this.aspect, this.minZ, this.maxZ);

        mat4.multiply(this._transformationMatrix, this._projectionMatrix, this._viewMatrix);

        return this._transformationMatrix as Float32Array;
    }

    public setTarget(target: vec3): void {
        vec3.normalize(this._upVector, this._upVector);

        let temp: vec3 = [0, 0, 0];

        vec3.sub(temp, target, this.position);

        let initialFocalDistance = vec3.length(temp);

        if (this.position[2] === target[2]) {
            this.position[2] += 0.001;
        }

        vec3.normalize(this._referencePoint, this._referencePoint);
        vec3.scale(this._referencePoint, this._referencePoint, initialFocalDistance);

        lookAtLH(this._camMatrix, this.position, target, [0, 1, 0]);

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

}
