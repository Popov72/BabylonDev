import {
    AbstractMesh,
    Effect,
    IShadowGenerator,
    IShadowLight,
    MaterialDefines,
    Matrix,
    Nullable,
    RenderTargetTexture,
    Scene,
    ShadowGenerator,
    SubMesh,
    Vector3,
} from 'babylonjs';

declare type ShadowCSMGenerator = import("./csmShadowGenerator").CSMShadowGenerator;
declare type ICascade = import("./csmShadowGenerator").ICascade;

export class CSMShadowMap extends ShadowGenerator {

    protected static readonly frustumCornersNDCSpace = [
        new Vector3(-1.0,  1.0, -1.0),
        new Vector3( 1.0,  1.0, -1.0),
        new Vector3( 1.0, -1.0, -1.0),
        new Vector3(-1.0, -1.0, -1.0),
        new Vector3(-1.0,  1.0,  1.0),
        new Vector3( 1.0,  1.0,  1.0),
        new Vector3( 1.0, -1.0,  1.0),
        new Vector3(-1.0, -1.0,  1.0),
    ];

    protected _lightMinExtents: Vector3;

    public get lightMinExtents(): Vector3 {
        return this._lightMinExtents;
    }

    protected _lightMaxExtents: Vector3;

    public get lightMaxExtents(): Vector3 {
        return this._lightMaxExtents;
    }
    
    protected _parent: ShadowCSMGenerator;
    protected _cascade: Nullable<ICascade>;

    constructor(mapSize: number, light: IShadowLight, usefulFloatFirst: boolean, parent: ShadowCSMGenerator) {
        super(mapSize, light, usefulFloatFirst);

        this._light._shadowGenerator = parent;
        this._parent = parent;
        this._cascade = null;
        this._lightMinExtents = new Vector3(0, 0, 0);
        this._lightMaxExtents = new Vector3(0, 0, 0);
    }

    public get cascade(): Nullable<ICascade> {
        return this._cascade;
    }

    public set cascade(cascade: Nullable<ICascade>) {
        this._cascade = cascade;
    }

    public getTransformMatrix(): Matrix {
        var scene = this._scene;
        if (this._currentRenderID === scene.getRenderId() && this._currentFaceIndexCache === this._currentFaceIndex) {
            return this._transformMatrix;
        }

        this._currentRenderID = scene.getRenderId();
        this._currentFaceIndexCache = this._currentFaceIndex;

        var lightPosition = this._light.position;
        if (this._light.computeTransformedInformation()) {
            lightPosition = this._light.transformedPosition;
        }

        Vector3.NormalizeToRef(this._light.getShadowDirection(this._currentFaceIndex), this._lightDirection);
        if (Math.abs(Vector3.Dot(this._lightDirection, Vector3.Up())) === 1.0) {
            this._lightDirection.z = 0.0000000000001; // Required to avoid perfectly perpendicular light
        }

        if (this._light.needProjectionMatrixCompute() || !this._cachedPosition || !this._cachedDirection || !lightPosition.equals(this._cachedPosition) || !this._lightDirection.equals(this._cachedDirection)) {

            this._cachedPosition.copyFrom(lightPosition);
            this._cachedDirection.copyFrom(this._lightDirection);

            this._computeLightMatrices();
        }

        return this._transformMatrix;
    }

    // Get the 8 points of the view frustum in world space
    protected _computeFrustumInWorldSpace(): Array<Vector3> {
        const frustumCornersWorldSpace: Array<Vector3> = [];

        if (!this._cascade || !this._scene.activeCamera) {
            return frustumCornersWorldSpace;
        }

		const prevSplitDist = this._cascade.prevSplitDistance,
              splitDist = this._cascade.splitDistance;

        this._scene.activeCamera.getViewMatrix(); // make sure the transformation matrix we get when calling 'getTransformationMatrix()' is calculated with an up to date view matrix

        const invViewProj = Matrix.Invert(this._scene.activeCamera.getTransformationMatrix());
        for (let cornerIndex = 0; cornerIndex < CSMShadowMap.frustumCornersNDCSpace.length; ++cornerIndex) {
            frustumCornersWorldSpace.push(Vector3.TransformCoordinates(CSMShadowMap.frustumCornersNDCSpace[cornerIndex], invViewProj));
        }

        // Get the corners of the current cascade slice of the view frustum
        for (let cornerIndex = 0; cornerIndex < CSMShadowMap.frustumCornersNDCSpace.length / 2; ++cornerIndex) {
            const cornerRay = frustumCornersWorldSpace[cornerIndex + 4].subtract(frustumCornersWorldSpace[cornerIndex]),
                  nearCornerRay = cornerRay.scale(prevSplitDist),
                  farCornerRay = cornerRay.scale(splitDist);

            frustumCornersWorldSpace[cornerIndex + 4] = frustumCornersWorldSpace[cornerIndex].add(farCornerRay);
            frustumCornersWorldSpace[cornerIndex].addInPlace(nearCornerRay);
        }

        return frustumCornersWorldSpace;
    }

    protected _computeLightFrustum(frustumCornersWorldSpace: Array<Vector3>): [Vector3, Vector3, Vector3] {
        let minExtents = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE),
            maxExtents = new Vector3(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE),
            frustumCenter = new Vector3(0, 0, 0);

        const camera = this._scene.activeCamera;

        if (!camera) {
            return [minExtents, maxExtents, frustumCenter];
        }

        // Calculate the centroid of the view frustum slice
        for (let cornerIndex = 0; cornerIndex < frustumCornersWorldSpace.length; ++cornerIndex) {
            frustumCenter.addInPlace(frustumCornersWorldSpace[cornerIndex]);
        }

        frustumCenter.scaleInPlace(1 / frustumCornersWorldSpace.length);

        if (this._parent.stabilizeCascades) {
            // Calculate the radius of a bounding sphere surrounding the frustum corners
            let sphereRadius = 0;
            for (let cornerIndex = 0; cornerIndex < frustumCornersWorldSpace.length; ++cornerIndex) {
                const dist = frustumCornersWorldSpace[cornerIndex].subtract(frustumCenter).length();
                sphereRadius = Math.max(sphereRadius, dist);
            }

            //sphereRadius = Math.ceil(sphereRadius * 16) / 16;

            maxExtents.set(sphereRadius, sphereRadius, sphereRadius);
            minExtents.set(-sphereRadius, -sphereRadius, -sphereRadius);
        } else {
            // Create a temporary view matrix for the light
            const upDir = camera.getDirection(new Vector3(1, 0, 0));

            const lightCameraPos = frustumCenter,
                  lookAt = frustumCenter.add(this._lightDirection);

            let lightView = Matrix.LookAtLH(lightCameraPos, lookAt, upDir);

            // Calculate an AABB around the frustum corners
            for (let cornerIndex = 0; cornerIndex < frustumCornersWorldSpace.length; ++cornerIndex) {
                const corner = Vector3.TransformCoordinates(frustumCornersWorldSpace[cornerIndex], lightView);

                minExtents = Vector3.Minimize(minExtents, corner);
                maxExtents = Vector3.Maximize(maxExtents, corner);
            }

            // Adjust the min/max to accommodate the filtering size
            /*float scale = (ShadowMapSize + AppSettings::FixedFilterKernelSize()) / static_cast<float>(ShadowMapSize);
            minExtents.x *= scale;
            minExtents.y *= scale;
            maxExtents.x *= scale;
            maxExtents.y *= scale;*/
        }

        return [minExtents, maxExtents, frustumCenter];
    }

    protected _computeLightMatrices(): void {
        const camera = this._scene.activeCamera;

        if (!camera) {
            return;
        }

        const frustumCornersWorldSpace = this._computeFrustumInWorldSpace(),
              [minExtents, maxExtents, frustumCenter] = this._computeLightFrustum(frustumCornersWorldSpace);

        const cascadeExtents = maxExtents.subtract(minExtents);

        // Get position of the shadow camera
        const shadowCameraPos = frustumCenter.add(this._lightDirection.scale(minExtents.z));

        // Come up with a new orthographic camera for the shadow caster
        const upDir = this._parent.stabilizeCascades ? Vector3.Up() : camera.getDirection(new Vector3(1, 0, 0));

        Matrix.LookAtLHToRef(shadowCameraPos, frustumCenter, upDir, this._viewMatrix);

        if (this._scene.useRightHandedSystem) {
            Matrix.OrthoOffCenterRHToRef(minExtents.x, maxExtents.x, minExtents.y, maxExtents.y, 0, cascadeExtents.z, this._projectionMatrix);
        } else {
            Matrix.OrthoOffCenterLHToRef(minExtents.x, maxExtents.x, minExtents.y, maxExtents.y, 0, cascadeExtents.z, this._projectionMatrix);
        }

        this._lightMinExtents.set(minExtents.x, minExtents.y, 0);
        this._lightMaxExtents.set(maxExtents.x, maxExtents.y, cascadeExtents.z);

        /*if(AppSettings::StabilizeCascades)
        {
            // Create the rounding matrix, by projecting the world-space origin and determining
            // the fractional offset in texel space
            XMMATRIX shadowMatrix = shadowCamera.ViewProjectionMatrix().ToSIMD();
            XMVECTOR shadowOrigin = XMVectorSet(0.0f, 0.0f, 0.0f, 1.0f);
            shadowOrigin = XMVector4Transform(shadowOrigin, shadowMatrix);
            shadowOrigin = XMVectorScale(shadowOrigin, sMapSize / 2.0f);

            XMVECTOR roundedOrigin = XMVectorRound(shadowOrigin);
            XMVECTOR roundOffset = XMVectorSubtract(roundedOrigin, shadowOrigin);
            roundOffset = XMVectorScale(roundOffset, 2.0f / sMapSize);
            roundOffset = XMVectorSetZ(roundOffset, 0.0f);
            roundOffset = XMVectorSetW(roundOffset, 0.0f);

            XMMATRIX shadowProj = shadowCamera.ProjectionMatrix().ToSIMD();
            shadowProj.r[3] = XMVectorAdd(shadowProj.r[3], roundOffset);
            shadowCamera.SetProjection(shadowProj);
        }*/

        this._viewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);
    }
}
