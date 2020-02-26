import {
    Scene,
    Vector3,
    UniversalCamera,
    PointLight,
    Color3,
    CubeTexture,
    SceneLoader,
    ArcRotateCamera,
    PBRMaterial,
    DebugLayer,
    Engine,
    Nullable,
} from "babylonjs";

import SampleBasic from "../SampleBasic";

interface IParams {
    path: string;
    model: string;
    sheenColor: Color3;
    metallic: number;
    metallicF0Factor: number;
    roughness: number;
    sheenRoughness: number;
    lightPos: Vector3;
    lightIntensity: number;
    iblIntensity: number;
    camAlpha: number;
    camBeta: number;
    camRadius: number;
    setCamera: boolean;
    albedoColor: Nullable<Color3>;
}

const envTextures = [
    {
        "name": "&lt;None&gt;",
        "path": "",
    },
    {
        "name": "Studio",
        "path": "https://assets.babylonjs.com/environments/studio.env",
    },
    {
        "name": "Country",
        "path": "resources/texture/country.env",
    },
    {
        "name": "Forest",
        "path": "resources/texture/forest.env",
    },
    {
        "name": "Night",
        "path": "resources/texture/night.env",
    },
];

const scenes = [
    {
        "name": "Cloth on ball",
        "num": 0,
    },
    {
        "name": "Couch pillow",
        "num": 1,
    },
    {
        "name": "Cloth on cup",
        "num": 3,
    }
];

export default class Sheen extends SampleBasic {

    private _scene: Scene;
    private _currEnv: number;
    private _currScene: number;

    protected populateScene(scene: Scene, camera: UniversalCamera) {
        this._scene = scene;
        this._currEnv = 2;
        this._currScene = 2;

        this._loadScene(this._currScene);
    }

    private _loadScene(numScene: number): void {
        let scene = this._scene;

        if (scene.debugLayer.isVisible()) {
            scene.debugLayer.hide();
        }

        this._releaseScene(scene);

        this._currScene = numScene;

        const params = this._getModelParams(scenes[numScene].num);

        SceneLoader.Append(params.path, params.model, scene, () => {
            if (scene.activeCamera) {
                scene.activeCamera._activeMeshes.dispose();
                scene.activeCamera = null;
            }

            while (scene.cameras.length) {
                scene.cameras[0].dispose();
            }

            scene.createDefaultCamera(true, true, true);

            this._split.camera = scene.activeCamera as unknown as UniversalCamera;

            scene.environmentIntensity = params.iblIntensity;

            var l = new PointLight("light", params.lightPos, scene);

            l.intensity = params.lightIntensity;

            var camera = scene.activeCamera as unknown as ArcRotateCamera;

            camera.alpha = Math.PI / 3;
            camera.beta = Math.PI / 2 - 0.3;
            //camera.useAutoRotationBehavior = true;
            camera.lowerRadiusLimit = 0.5;
            camera.upperRadiusLimit = 1000;
            camera.panningSensibility = 0;
            camera.pinchDeltaPercentage = 0.005;

            if (params.setCamera) {
                camera.alpha = params.camAlpha;
                camera.beta = params.camBeta;
                camera.radius = params.camRadius;
            }

            var mesh = scene.meshes[1];
            var mat = mesh.material as PBRMaterial;

            (window as any).mat = mat;

            if (params.albedoColor) {
                mat.albedoColor = params.albedoColor;
            }
            mat.metallic = params.metallic;
            mat.metallicF0Factor = params.metallicF0Factor;
            mat.roughness = params.roughness;
            mat.sheen.color = params.sheenColor;
            mat.sheen.isEnabled = true;
            mat.sheen.roughness = params.sheenRoughness;

            this._setEnvironment(this._currEnv);

            /*var t = 0;

            scene.onBeforeRenderObservable.add(() => {
                l.position.x = 7 * Math.cos(t);
                l.position.z = 7 * Math.sin(t);
                t += 0.02;
            });*/

            /*mat.inspectableCustomProperties = [
                {
                    label: "Enable shadowing term",
                    propertyName: "enableShadowingTerm",
                    type: BABYLON.InspectableType.Checkbox
                }
            ];*/

            DebugLayer.InspectorURL = 'resources/lib/babylon.inspector.bundle.max.js';

            scene.debugLayer.show({ showExplorer: true }).then(() => {
                scene.debugLayer.select(mat, "SHEEN");
                this._makeGUI(scene, mat);
            });
        });
    }

    private _getModelParams(numModel: number): IParams {
        const params = this._getDefaultParams();

        switch (numModel) {
            case 0:
                break;
            case 1:
                params.path = "resources/3d/couch_pillow/";
                params.model = "scene.gltf";
                params.sheenColor = new Color3(207 / 255, 207 / 255, 207 / 255);
                break;
            case 2:
                params.path = "resources/3d/4_sacks/";
                params.model = "scene.gltf";
                params.sheenColor = new Color3(207 / 255, 207 / 255, 207 / 255);
                params.lightPos = new Vector3(3, 100, 0);
                params.lightIntensity = 1000;
                break;
            case 3:
                params.path = "resources/3d/cloth_on_cup/";
                params.model = "scene.gltf";
                params.sheenColor = new Color3(1, 1, 1);
                params.lightPos = new Vector3(3, 10, 0);
                params.lightIntensity = 100;
                params.setCamera = true;
                params.camAlpha = -1.3933468840693315;
                params.camBeta = 0.9755170324890405;
                params.camRadius = 7.6498204430171235;
                params.albedoColor = new Color3(12 / 255, 60 / 255, 222 / 255);
                break;
        }

        return params;
    }

    private _getDefaultParams(): IParams {
        return {
            path: "https://models.babylonjs.com/Sheen/",
            model: "Cloth.gltf",
            sheenColor: new Color3(159 / 255, 162 / 255, 247 / 255),
            metallic: 0,
            metallicF0Factor: 0.0,
            roughness: 0.8,
            sheenRoughness: 0.5,
            lightPos: new Vector3(3, 3, 0),
            lightIntensity: 16,
            iblIntensity: 0.25,
            camAlpha: -1,
            camBeta: -1,
            camRadius: -1,
            setCamera: false,
            albedoColor: null,
        };
    }

    private _makeGUI(scene: Scene, mat: PBRMaterial): void {
        let c = jQuery('#renderCanvas').parent();

        c.css('position', 'relative')
            .css('text-shadow', '1px 1px black')
            .css('font-family', '"Arial');

        let that = this as any;

        let environmentTexture = jQuery('<span>Env texture </span>')
            .append('<select>' + envTextures.map((env, idx) => '<option value="' + idx + '" ' + (idx == this._currEnv ? 'selected' : '') + '>' + env.name + '</option>').join('') + '</select>')
            .css('color', 'white')
            .css('position', 'absolute')
            .css('left', '10px')
            .css('top', '10px')
            .on('change', function(e) {
                that._setEnvironment(parseInt('' + jQuery(this).find('select').val()));
            });

        let sceneObjects = jQuery('<span>Scene </span>')
            .append('<select>' + scenes.map((sc, idx) => '<option value="' + idx + '" ' + (idx == this._currScene ? 'selected' : '') + '>' + sc.name + '</option>').join('') + '</select>')
            .css('color', 'white')
            .css('position', 'absolute')
            .css('left', '10px')
            .css('top', '35px')
            .on('change', function(e) {
                that._loadScene(parseInt('' + jQuery(this).find('select').val()));
            });

        let enableSheen = jQuery('<span>Enable sheen </span>')
            .append('<input type="checkbox" checked>')
            .css('color', 'white')
            .css('position', 'absolute')
            .css('left', '10px')
            .css('top', '60px')
            .on('click', function(e) {
                mat.sheen.isEnabled = jQuery(this).find('input').prop('checked');
            });

        c.append(environmentTexture);
        c.append(sceneObjects);
        c.append(enableSheen);
    }

    private _setEnvironment(envNum: number): void {
        this._currEnv = envNum;

        let sky = this._scene.getMeshByID('hdrSkyBox');

        if (sky) {
            sky.material?.dispose();
            sky.dispose();
        }

        if (envNum === 0) {
            this._scene.environmentIntensity = 0;
        } else {
            if (this._scene.environmentTexture) {
                this._scene.environmentTexture.dispose();
            }
            this._scene.environmentTexture = CubeTexture.CreateFromPrefilteredData(envTextures[envNum].path, this._scene);
            this._scene.createDefaultSkybox(this._scene.environmentTexture!, false, 1000, 0, false);
            const params = this._getModelParams(scenes[this._currScene].num);
            this._scene.environmentIntensity = params.iblIntensity;
        }
    }

    private _getEnvBRDFTexture(engine: Engine, scene: Scene): void {
        window.setTimeout(() => {
            let w = 256, h = 256;
            let buffer = new Float32Array(4 * w * h);

            engine._readTexturePixels(scene.environmentBRDFTexture.getInternalTexture()!, w, h, -1, 0, buffer);

            let img = {
                name: "environmentBRDF",
                r: [],
                g: [],
                b: [],
            };

            for (let i = 0; i < w * h; ++i) {
                (img.r as number[]).push(buffer[i * 4 + 0]);
                (img.g as number[]).push(buffer[i * 4 + 1]);
                (img.b as number[]).push(buffer[i * 4 + 2]);
            }

            console.log(JSON.stringify(img));

            (window as any).ii = img;
        }, 2000);

    }

    private _releaseScene(scene: Scene): void {
        scene.beforeRender = null;
        scene.afterRender = null;

        scene.skeletons = [];
        scene.morphTargetManagers = [];
        (scene as any)._transientComponents = [];
        scene._isReadyForMeshStage.clear();
        scene._beforeEvaluateActiveMeshStage.clear();
        scene._evaluateSubMeshStage.clear();
        scene._activeMeshStage.clear();
        scene._cameraDrawRenderTargetStage.clear();
        scene._beforeCameraDrawStage.clear();
        scene._beforeRenderTargetDrawStage.clear();
        scene._beforeRenderingGroupDrawStage.clear();
        scene._beforeRenderingMeshStage.clear();
        scene._afterRenderingMeshStage.clear();
        scene._afterRenderingGroupDrawStage.clear();
        scene._afterCameraDrawStage.clear();
        scene._afterRenderTargetDrawStage.clear();
        scene._afterRenderStage.clear();
        scene._beforeCameraUpdateStage.clear();
        scene._beforeClearStage.clear();
        scene._gatherRenderTargetsStage.clear();
        scene._gatherActiveCameraRenderTargetsStage.clear();
        scene._pointerMoveStage.clear();
        scene._pointerDownStage.clear();
        scene._pointerUpStage.clear();

        for (let component of scene._components) {
            component.dispose();
        }

        scene._components = [];

        scene.importedMeshesFiles = new Array<string>();

        if (scene.stopAllAnimations) {
            scene.stopAllAnimations();
        }

        scene.resetCachedMaterial();

        // Smart arrays
        (scene as any)._activeMeshes.reset();
        scene._activeParticleSystems.reset();
        (scene as any)._activeSkeletons.reset();
        (scene as any)._softwareSkinnedMeshes.reset();
        (scene as any)._renderTargets.reset();
        (scene as any)._registeredForLateAnimationBindings.reset();
        (scene as any)._meshesForIntersections.reset();
        (scene as any)._toBeDisposed = [];

        // Abort active requests
        for (let request of (scene as any)._activeRequests) {
            request.abort();
        }

        // Events
        scene.onDisposeObservable.clear();
        scene.onBeforeRenderObservable.clear();
        scene.onAfterRenderObservable.clear();
        scene.onBeforeRenderTargetsRenderObservable.clear();
        scene.onAfterRenderTargetsRenderObservable.clear();
        scene.onAfterStepObservable.clear();
        scene.onBeforeStepObservable.clear();
        scene.onBeforeActiveMeshesEvaluationObservable.clear();
        scene.onAfterActiveMeshesEvaluationObservable.clear();
        scene.onBeforeParticlesRenderingObservable.clear();
        scene.onAfterParticlesRenderingObservable.clear();
        scene.onBeforeDrawPhaseObservable.clear();
        scene.onAfterDrawPhaseObservable.clear();
        scene.onBeforeAnimationsObservable.clear();
        scene.onAfterAnimationsObservable.clear();
        scene.onDataLoadedObservable.clear();
        scene.onBeforeRenderingGroupObservable.clear();
        scene.onAfterRenderingGroupObservable.clear();
        scene.onMeshImportedObservable.clear();
        scene.onBeforeCameraRenderObservable.clear();
        scene.onAfterCameraRenderObservable.clear();
        scene.onReadyObservable.clear();
        scene.onNewCameraAddedObservable.clear();
        scene.onCameraRemovedObservable.clear();
        scene.onNewLightAddedObservable.clear();
        scene.onLightRemovedObservable.clear();
        scene.onNewGeometryAddedObservable.clear();
        scene.onGeometryRemovedObservable.clear();
        scene.onNewTransformNodeAddedObservable.clear();
        scene.onTransformNodeRemovedObservable.clear();
        scene.onNewMeshAddedObservable.clear();
        scene.onMeshRemovedObservable.clear();
        scene.onNewSkeletonAddedObservable.clear();
        scene.onSkeletonRemovedObservable.clear();
        scene.onNewMaterialAddedObservable.clear();
        scene.onMaterialRemovedObservable.clear();
        scene.onNewTextureAddedObservable.clear();
        scene.onTextureRemovedObservable.clear();
        scene.onPrePointerObservable.clear();
        scene.onPointerObservable.clear();
        scene.onPreKeyboardObservable.clear();
        scene.onKeyboardObservable.clear();
        scene.onActiveCameraChanged.clear();

        //scene.detachControl();

        // Detach cameras
        var canvas = scene.getEngine().getInputElement();

        if (canvas) {
            var index;
            for (index = 0; index < scene.cameras.length; index++) {
                scene.cameras[index].detachControl(canvas);
            }
        }

        // Release animation groups
        while (scene.animationGroups.length) {
            scene.animationGroups[0].dispose();
        }

        // Release lights
        while (scene.lights.length) {
            scene.lights[0].dispose();
        }

        // Release meshes
        while (scene.meshes.length) {
            scene.meshes[0].dispose(true);
        }
        while (scene.transformNodes.length) {
            scene.transformNodes[0].dispose(true);
        }

        // Release materials
        if ((scene as any)._defaultMaterial) {
            (scene as any)._defaultMaterial.dispose();
        }
        while (scene.multiMaterials.length) {
            scene.multiMaterials[0].dispose();
        }
        while (scene.materials.length) {
            scene.materials[0].dispose();
        }

        // Release particles
        while (scene.particleSystems.length) {
            scene.particleSystems[0].dispose();
        }

        // Release postProcesses
        while (scene.postProcesses.length) {
            scene.postProcesses[0].dispose();
        }

        // Release textures
        while (scene.textures.length) {
            scene.textures[0].dispose();
        }

        (scene as any).environmentBRDFTexture = null;

        // Release UBO
        /*!scene._sceneUbo.dispose();

        if (scene._multiviewSceneUbo) {
            scene._multiviewSceneUbo.dispose();
        }*/

        // Post-processes
        //!scene.postProcessManager.dispose();

        // Remove from engine
        /*index = scene._engine.scenes.indexOf(this);

        if (index > -1) {
            this._engine.scenes.splice(index, 1);
        }
*/
        this._engine.wipeCaches(true);
    }

}

SampleBasic.registerSampleClass("sheen", {
    "displayName": "Test of the new sheen implementation",
    "description": "",
    "class": Sheen,
});
