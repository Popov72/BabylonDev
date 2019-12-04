import {
    Scene,
    Vector3,
    UniversalCamera,
    HemisphericLight,
    MeshBuilder,
    Effect,
    PostProcess,
    Vector2,
    Vector4,
    Color3,
} from "babylonjs";

import SampleBasic from "../SampleBasic";

export default class RayMarching extends SampleBasic {

    protected populateScene(scene: Scene, camera: UniversalCamera) {
        camera.position.x = 10;
        camera.position.y = 10;
        camera.position.z = -10;

        camera.setTarget(Vector3.Zero());

        Effect.ShadersStore["raymarchVertexShader"] = `
        attribute vec2 position;
        uniform vec2 scale;

        // Output
        varying vec2 vUV;
        const vec2 madd = vec2(0.5, 0.5);
        void main(void) {
            vUV = (position * madd + madd) * scale;
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    Effect.ShadersStore["raymarchFragmentShader"] = `
        #ifdef GL_ES
            precision highp float;
        #endif

        // Samplers
        varying vec2 vUV;
        uniform sampler2D textureSampler;
        uniform sampler2D depthMap;

        uniform vec2 resolution;

        uniform float camMinZ;
        uniform float camMaxZ;
        uniform vec3 camPosition;
        uniform vec3 camDirection;
        uniform vec4 vLightData;
        uniform float camFov;
        uniform float time;

        uniform mat4 camView;
        uniform mat4 camProjection;
        uniform mat4 camWorld;
        uniform mat4 camTransform;

        uniform vec3 backgroundColor;

        #define MTL_BACKGROUND          -1.0
        #define MTL_GROUND              1.0
        #define MTL_AX                  2.0
        #define MTL_AY                  3.0
        #define MTL_AZ                  4.0
        #define MTL_OBJ1                5.0
        #define MTL_OBJ2                6.0

        #define NORMAL_EPS              0.0001

        #define MAX_RAYCAST_STEPS       100
        #define STEP_DAMPING            0.86
        #define DIST_EPSILON            0.001

        #define BACKGROUND_COLOR        vec3(0.3, 0.342, 0.5)

        #include<helperFunctions>
        #include<__decl__lightFragment>[0]

        struct lightingInfo
        {
            vec3 diffuse;
            vec3 specular;
        };


        lightingInfo computeHemisphericLighting(vec3 viewDirectionW, vec3 vNormal, vec4 lightData, vec3 diffuseColor, vec3 specularColor, vec3 groundColor, float glossiness) {
            lightingInfo result;

            // Diffuse
            float ndl = dot(vNormal, lightData.xyz) * 0.5 + 0.5;
        #ifdef NDOTL
            result.ndl = ndl;
        #endif

            result.diffuse = mix(groundColor, diffuseColor, ndl);

        #ifdef SPECULARTERM
            // Specular
            vec3 angleW = normalize(viewDirectionW + lightData.xyz);
            float specComp = max(0., dot(vNormal, angleW));
            specComp = pow(specComp, max(1., glossiness));

            result.specular = specComp * specularColor;
        #endif
                return result;
        }

        // Primitives
        float plane(vec3 p, vec3 n, float offs) { return dot(p, n) - offs; }
        float sphere(vec3 p, float r) { return length(p) - r; }
        float cone(in vec3 p, vec2 n) { return dot(vec2(length(p.xz), p.y), n);}
        float cone(vec3 p, float r, float h) {
            float ang = atan(r, h);
            vec2 n = vec2(cos(ang), sin(ang));
            float d = cone(vec3(p.x, p.y - h, p.z), n);
            return max(d, -p.y);
        }
        float cylinder(in vec3 p, float r) { return length(p.xz) - r; }
        float cylinder(in vec3 p, float r, float h) { return max(cylinder(p, r), abs(p.y) - h*0.5); }
        float torus(vec3 p, float ri, float ro) { return length(vec2(length(p.xz) - ri, p.y)) - ro; }

        // Boolean operations
        float diff(float d1, float d2) { return max(-d2, d1); }
        float add(float d1, float d2) { return min(d2, d1); }
        float intersect(float d1, float d2) { return max(d2, d1); }
        // Boolean operations (with material ID in second component)
        void diff(inout vec2 d1, in vec2 d2) {
            if (-d2.x > d1.x) {
                d1.x = -d2.x;
                d1.y = d2.y;
            }
        }
        void add(inout vec2 d1, in vec2 d2) { if (d2.x < d1.x) d1 = d2; }
        void intersect(inout vec2 d1, in vec2 d2) { if (d1.x < d2.x) d1 = d2; }

        // Affine transformations
        vec3 translate(vec3 p, vec3 d) {
            return p - d;
        }
        vec2 rotate(vec2 p, float ang) {
            float c = cos(ang), s = sin(ang);
            return vec2(p.x*c-p.y*s, p.x*s+p.y*c);
        }
        //  Repetition
        float repeat(float coord, float spacing) {
            return mod(coord, spacing) - spacing*0.5;
        }
        vec2 repeatAng(vec2 p, float n) {
            float ang = 2.0*PI/n;
            float sector = floor(atan(p.x, p.y)/ang + 0.5);
            p = rotate(p, sector*ang);
            return p;
        }
        vec3 repeatAngS(vec2 p, float n) {
            float ang = 2.0*PI/n;
            float sector = floor(atan(p.x, p.y)/ang + 0.5);
            p = rotate(p, sector*ang);
            return vec3(p.x, p.y, mod(sector, n));
        }

        vec2 map(vec3 p) {
            vec3 yP = p;
            yP.y = repeat(yP.y, 2.0);
            vec2 res = vec2(sphere(yP-vec3(2.0,0.0,0.0), 1.0), MTL_GROUND);
            return res;
        }


        vec3 calcNormal(in vec3 p)
        {
            vec2 d = vec2(NORMAL_EPS, 0.0);
            return normalize(vec3(
                map(p + d.xyy).x - map(p - d.xyy).x,
                map(p + d.yxy).x - map(p - d.yxy).x,
                map(p + d.yyx).x - map(p - d.yyx).x));
        }


        vec2 rayMarch(in vec3 ro, in vec3 rd) {
            float t = 0.0;
            float m = MTL_BACKGROUND;
            for (int i=0; i < MAX_RAYCAST_STEPS; i++) {
                vec2 res = map(ro + rd*t);
                if (res.x < DIST_EPSILON) break;
                t += res.x*STEP_DAMPING;
                m = res.y;
            }
            return vec2(t, m);
        }


        vec3 getMaterialColor(float matID) {
            vec3 col = backgroundColor;
            if (matID <= MTL_GROUND) col = vec3(0.8, 0.8, 0.8);
            else if (matID <= MTL_AX) col = vec3(1.0, 0.0, 0.0);
            else if (matID <= MTL_AY) col = vec3(0.0, 1.0, 0.0);
            else if (matID <= MTL_AZ) col = vec3(0.0, 0.0, 1.0);
            else if (matID <= MTL_OBJ1) col = vec3(0.8, 0.8, 1.8);
            else if (matID <= MTL_OBJ2) col = vec3(1.4, 1.3, 0.3);
            else col = vec3(0.7, 0.7, 1.8);
            return col;
        }


        vec3 applyFog(vec3 col, float dist) {
            return mix(col, backgroundColor, dist);
        }

        vec4 render(in vec3 ro, in vec3 rd) {
            vec2 res = rayMarch(ro, rd);
            float t = res.x;
            float mtlID = res.y;
            vec3  lig = -rd;
            vec3 pos = ro + t*rd;

            vec4 posProj = camTransform * vec4(pos, 1);
            float z = (posProj.z + camMinZ) / (camMaxZ + camMinZ);
            if (z < 0.0 /*|| z > 1.0*/) { // no need to check against 1.0, as if z > 1.0 the check of z against depth in main() will fail
                mtlID = MTL_BACKGROUND;
                z = 1.0; // to be sure the test against depth fails in main()
            }

            vec3 nor = calcNormal(pos);
            vec3 mtlColor = getMaterialColor(mtlID);
            float ambient = 0.;
            lightingInfo info = computeHemisphericLighting(rd, nor, vLightData, vec3(1.0, 1.0, 1.0)/*Light Color*/, vec3(1.0)/*Light Specular*/, vec3(0.)/*Ground Color*/, 0.0/*Glossy*/);

            vec3 ref = reflect(rd, nor);
            float specular = pow(clamp(dot(ref, vLightData.xyz), 0.0, 1.0), 16.0);

            vec3 col = mtlColor*(ambient + info.diffuse + specular);
            col = applyFog(col, z);

            return vec4(col, z);
        }

        vec3 getRayFromScreenSpace()
        {
            mat4 invMat =  inverse(camTransform);
            vec4 near = vec4((vUV.x - 0.5) * 2.0, (vUV.y - 0.5) * 2.0, -1, 1.0);
            vec4 far = vec4((vUV.x - 0.5) * 2.0, (vUV.y - 0.5) * 2.0, 1, 1.0);
            vec4 nearResult = invMat*near;
            vec4 farResult = invMat*far;
            nearResult /= nearResult.w;
            farResult /= farResult.w;
            vec3 dir = vec3(farResult - nearResult );
            return normalize(dir);
        }

        void main(void){
            vec4 baseColor = texture2D(textureSampler, vUV);
            float depth = texture2D(depthMap, vUV).x;
            vec2 p = vUV*2.0-1.0;
            p.x *= resolution.x/resolution.y;
            vec3 rayDir = getRayFromScreenSpace();
            vec4 renderData = render(camPosition, rayDir);

            if(renderData.w < depth){
                baseColor.rgb = renderData.rgb;
            }


            gl_FragColor = baseColor;
        }
    `;

        camera.minZ = 1;
        camera.maxZ = 100.;
        //scene.fogEnabled = true;

        var light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;

        var sphere = MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);
        sphere.position.y = 1;

        var ground = MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);

        var raymarchPass = new PostProcess("raymarching", "raymarch",
        [
            'resolution',
            'camMinZ',
            'camMaxZ',
            'camPosition',
            'camDirection',
            'camFov',
            'camView',
            'camProjection',
            'camWorld',
            'camTransform',
            'vLightData',
            'time',
            'backgroundColor'
        ],
        [
            'depthMap'
        ], 1.0, camera, 0, this._engine, false, '', 0, 'raymarch');

        var render = scene.enableDepthRenderer();
        var time = 0.0;

        raymarchPass.onApply = function(effect) {
            time += scene.getEngine().getDeltaTime() * 0.001;
            effect.setFloat('time', time);
            effect.setTexture('depthMap', render.getDepthMap());
            let cvas = scene.getEngine().getRenderingCanvas()!;
            effect.setVector2('resolution', new Vector2(cvas.width, cvas.height));
            effect.setVector3('camPosition', scene.activeCamera!.position);
            effect.setVector3('camDirection', scene.activeCamera!.getForwardRay(1).direction);
            effect.setFloat('camMinZ', scene.activeCamera!.minZ);
            effect.setFloat('camMaxZ', scene.activeCamera!.maxZ);
            effect.setFloat('camFov', scene.activeCamera!.fov);

            effect.setMatrix('camView', scene.activeCamera!.getViewMatrix());
            effect.setMatrix('camProjection', scene.activeCamera!.getProjectionMatrix());
            effect.setMatrix('camWorld', scene.activeCamera!.getWorldMatrix());
            effect.setMatrix('camTransform', scene.activeCamera!.getTransformationMatrix());

            effect.setColor3('backgroundColor', new Color3(scene.clearColor.r, scene.clearColor.g, scene.clearColor.b));

            let lightDir = light.direction.clone().normalize();

            effect.setVector4('vLightData',
                new Vector4(
                    lightDir.x,
                    lightDir.y,
                    lightDir.z,
                    0.0
                )
            );
        };
    }

}

SampleBasic.registerSampleClass("raymarching", {
    "displayName":  "A raymarching test",
    "description":  "",
    "class": RayMarching,
});
