import { vec3, quat } from 'gl-matrix';

export interface ICamera {

    aspect: number;
    fov: number;

    position: vec3;
    quaternion: quat;

    //updateMatrixWorld(): void;

    getTransformationMatrix(): Float32Array;

    lookAt(pos: vec3): void;
}
