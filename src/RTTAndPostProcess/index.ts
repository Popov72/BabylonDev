import {
    Scene,
    Vector3,
    UniversalCamera,
    HemisphericLight,
    StandardMaterial,
    Texture,
    MeshBuilder,
    PassPostProcess,
    Effect,
    ShaderMaterial,
    RenderTargetTexture,
    PostProcess,
    PostProcessRenderPipeline,
    PostProcessRenderEffect,
    SceneLoader,
    Nullable,
    MaterialDefines
} from "babylonjs";

import SampleBasic from "../SampleBasic";

export default class RTTAndPostProcess extends SampleBasic {

    protected populateScene(scene: Scene, camera: UniversalCamera) {
        camera.position.x = 0;
        camera.position.y = 5;
        camera.position.z = -10;

        camera.setTarget(Vector3.Zero());

        // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
        var light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

        // Default intensity is 1. Let's dim the light a small amount
        light.intensity = 0.7;

        // some material for the sphere.
        var grass0 = new StandardMaterial("grass0", scene);
        grass0.diffuseTexture = new Texture("resources/texture/grass.png", scene);

        // Our built-in 'ground' shape.
        var ground = MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);
        ground.material = grass0;

        // a depth pass.
        const depthPass = scene.enableDepthRenderer();

        // first pass, render scene with original materials
        var imagePass = new PassPostProcess("imagePass", 1.0, null, Texture.NEAREST_SAMPLINGMODE, this._engine);

        // second pass with a shader material
        Effect.ShadersStore.magicVertexShader = `
            precision highp float;

            attribute vec3 position;
            attribute vec2 uv;

    #ifdef INSTANCES
        attribute vec4 world0;
        attribute vec4 world1;
        attribute vec4 world2;
        attribute vec4 world3;
    #else
        uniform mat4 world;
    #endif
            uniform mat4 view;
            uniform mat4 projection;
            uniform mat4 worldViewProjection;

            varying vec2 vUV;

            #include<bonesDeclaration>

            void main() {
    #ifdef INSTANCES
        mat4 finalWorld = mat4(world0, world1, world2, world3);
    #else
        mat4 finalWorld = world;
    #endif

                vec3 positionUpdated = position;

                #include<bonesVertex>

                vec4 worldPos = finalWorld * vec4(positionUpdated, 1.0);

                vUV = uv;

                gl_Position = projection * view * worldPos;
            }`;
        Effect.ShadersStore.magicFragmentShader = `
            #ifdef GL_ES
            precision mediump float;
            #endif

            varying vec2 vUV;

            void main(void)
            {
                // basic, just returns a plain color
                gl_FragColor = vec4(1.0, 1.0, 0.1, 1.0);
            }
        `;

        const shaderMaterial = new ShaderMaterial(
            'magic shader material', // human name
            scene,
            'magic', // shader path
            {
                attributes: [ 'position', 'normal', 'uv' ],
                uniforms: [ 'world', 'worldView', 'worldViewProjection', 'view', 'projection', 'time', 'direction' ]
            }
        );

        shaderMaterial.freeze();

        const shaderMaterialForRobot = shaderMaterial.clone("cloned");

        shaderMaterialForRobot.freeze();

        const renderTarget = new RenderTargetTexture('magic texture', 512, scene);
        scene.customRenderTargets.push(renderTarget);

        renderTarget.onBeforeRender = (e) => {
            // Apply the shader on all meshes
            for (let i = 0; i < renderTarget.renderList!.length; ++i) {
                const mesh = renderTarget.renderList![i];
                mesh.metadata = mesh.metadata || {};
                if (mesh.material && !mesh.material.isFrozen && mesh.isReady(true)) { // the PBR material takes some time to be loaded, it's possible that in the first few frames mesh.material is null...
                    const _orig_subMeshEffects: Array<[Nullable<Effect>, Nullable<MaterialDefines>]> = [];
                    mesh.subMeshes.forEach((submesh) => {
                        _orig_subMeshEffects.push([submesh.effect, submesh._materialDefines]);
                    });
                    mesh.material.freeze();
                    mesh.metadata._saved_orig_material = mesh.material;
                    mesh.metadata._orig_subMeshEffects = _orig_subMeshEffects;
                }
                if (!mesh.metadata._orig_subMeshEffects) { continue; }
                mesh.material = i == 0 ? shaderMaterial : shaderMaterialForRobot;
                if (mesh.metadata._rtt_subMeshEffects) {
                    for (let s = 0; s < mesh.subMeshes.length; ++s) {
                        mesh.subMeshes[s].setEffect(...(mesh.metadata._rtt_subMeshEffects[s] as [Nullable<Effect>, Nullable<MaterialDefines>]));
                    }
                }
            }
        };
        renderTarget.onAfterRender = () => {
            // Set the original shader on all meshes
            for (let i = 0; i < renderTarget.renderList!.length; ++i) {
                const mesh = renderTarget.renderList![i];
                if (!mesh.metadata._orig_subMeshEffects) { continue; }
                if (!mesh.metadata._rtt_subMeshEffects) {
                    mesh.metadata._rtt_subMeshEffects = [];
                    mesh.subMeshes.forEach((submesh) => {
                        mesh.metadata._rtt_subMeshEffects.push([submesh.effect, submesh._materialDefines]);
                    });
                }
                mesh.material = mesh.metadata._saved_orig_material;
                for (let s = 0; s < mesh.subMeshes.length; ++s) {
                    mesh.subMeshes[s].setEffect(...(mesh.metadata._orig_subMeshEffects[s] as [Nullable<Effect>, Nullable<MaterialDefines>]));
                }
            }
        };

        // third pass: merge two passes
        Effect.ShadersStore.finalVertexShader = `
            precision highp float;

            attribute vec3 position;
            attribute vec2 uv;

            uniform mat4 worldViewProjection;

            varying vec2 vUV;

            void main() {
                vUV = uv;
                gl_Position = worldViewProjection * vec4(position, 1.0);
            }`;

        Effect.ShadersStore.finalFragmentShader = `
            #ifdef GL_ES
            precision mediump float;
            #endif

            varying vec2 vUV;

            uniform sampler2D textureSampler;
            uniform sampler2D secondTexture;
            uniform sampler2D depthTexture;

            void main(void)
            {
                vec4 first = texture2D(textureSampler, vUV);
                vec4 second = texture2D(secondTexture, vUV);
                // mixes colors
                gl_FragColor = mix(first, second, vUV.x);
            }
        `;

        // create the pass
        var finalPass = new PostProcess(
            'Final compose shader',
            'final',  // shader
            null, // attributes
            ['baseTexture', 'secondTexture', 'depthTexture' ], // textures
            1.0,  // options
            null, // camera
            Texture.BILINEAR_SAMPLINGMODE, // sampling
            this._engine // engine
        );

        finalPass.onApply = (effect) => {
            effect.setTextureFromPostProcess('baseTexture', imagePass);
            effect.setTexture('secondTexture', renderTarget);
            effect.setTexture('depthTexture', depthPass.getDepthMap());
        };

        // the render pipeline
        var pipeline = new PostProcessRenderPipeline(this._engine, 'pipeline');
        var renderPasses = new PostProcessRenderEffect(
            this._engine, 'renderPasses', function() { return [imagePass, finalPass]; });

        pipeline.addEffect(renderPasses);
        scene.postProcessRenderPipelineManager.addPipeline(pipeline);
        scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline('pipeline', camera);

        // Our built-in 'sphere' shape.
        SceneLoader.ImportMesh("", "resources/3d/BrainStem/", "BrainStem.gltf", scene, function(meshes) {
            renderTarget.renderList!.push(ground);
            meshes.forEach((mesh) => {
                renderTarget.renderList!.push(mesh);
            });
        });
    }

}

SampleBasic.registerSampleClass("rttandpostprocess", {
    "displayName": "Create a Render Target Texture and use it in a post process pass",
    "description": "",
    "class": RTTAndPostProcess,
});
