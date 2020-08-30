import { ICamera } from "./ICamera";
import { mat4, vec3, quat } from "gl-matrix";

const rotY180: quat = [0, 1, 0, 0]; // x <=> -x
const defaultUp: vec3 = [0, 1, 0];
const referencePoint: vec3 = [0, 0, 1];

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

    constructor(fov: number, aspect: number) {
        this.fov = fov;
        this.aspect = aspect;
        this.minZ = 0.25;
        this.maxZ = 250.0;

        this._viewMatrix = mat4.create();
        this._projectionMatrix = mat4.create();
        this._transformationMatrix = mat4.create();
    }

    //updateMatrixWorld(): void;

    public getTransformationMatrix(): Float32Array {
        let q: quat = [0, 0, 0, 0];
        quat.multiply(q, this.quaternion, rotY180);

        let upVector: vec3 = [0, 0, 0];
        vec3.transformQuat(upVector, defaultUp, q);

        let transformedReferencePoint: vec3 = [0, 0, 0];
        vec3.transformQuat(transformedReferencePoint, referencePoint, q);

        let currentTarget: vec3 = [0, 0, 0];
        vec3.add(currentTarget, this.position, transformedReferencePoint);

        mat4.lookAt(this._viewMatrix, this.position, currentTarget, upVector);

        mat4.perspective(this._projectionMatrix, this.fov, this.aspect, this.minZ, this.maxZ);

        mat4.multiply(this._transformationMatrix, this._projectionMatrix, this._viewMatrix);

        return this._transformationMatrix as Float32Array;
    }

    public lookAt(pos: vec3): void {

    }

}