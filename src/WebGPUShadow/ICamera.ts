import { vec3, quat } from 'gl-matrix';

export interface ICamera {

    aspect: number;
    fov: number;

    position: vec3;
    quaternion: quat;

    getTransformationMatrix(): Float32Array;

    setTarget(target: vec3): void;
}
