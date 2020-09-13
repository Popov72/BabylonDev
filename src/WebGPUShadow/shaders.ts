export const mainVertexShaderGLSL = `
    #version 450

    layout(set = 0, binding = 0) uniform Uniforms {
        mat4 modelViewProjectionMatrix;
        mat4 lightTransformationMatrix;
    } uniforms;

    layout(location = 0) in vec4 position;
    layout(location = 1) in vec2 uv;
    layout(location = 2) in vec4 tileinfo;
    layout(location = 3) in vec4 normal;

    layout(location = 0) out vec2 fragUV;
    layout(location = 1) out vec4 vTileinfo;
    layout(location = 2) out vec3 vPositionW;
    layout(location = 3) out vec3 vNormalW;
    layout(location = 4) out vec4 vPositionFromLight;

    void main() {
        gl_Position = uniforms.modelViewProjectionMatrix * position;
        vPositionFromLight = uniforms.lightTransformationMatrix * position;
        fragUV = uv;
        vTileinfo = tileinfo;
        vPositionW = vec3(position);
        vNormalW = normal.xyz;
        //gl_Position.y *= -1.0;
        gl_Position.z = (gl_Position.z + gl_Position.w) / 2.0;
    }
`;

export const mainFragmentShaderGLSL = `
    #version 450

    layout(set = 0, binding = 1) uniform sampler mySampler;
    layout(set = 0, binding = 2) uniform texture2D myTexture;
    layout(set = 0, binding = 3) uniform Uniforms {
        vec3 lightDirection;
    } uniforms;
    layout(set = 0, binding = 4) uniform samplerShadow samplerShadowmap;
    layout(set = 0, binding = 5) uniform texture2D textureShadowmap;

    layout(location = 0) in vec2 fragUV;
    layout(location = 1) in vec4 vTileinfo;
    layout(location = 2) in vec3 vPositionW;
    layout(location = 3) in vec3 vNormalW;
    layout(location = 4) in vec4 vPositionFromLight;

    layout(location = 0) out vec4 outColor;

    #define GREATEST_LESS_THAN_ONE 0.99999994

    void main() {
        float fx = clamp(fract(fragUV.x), 0., 1.), fy = clamp(fract(fragUV.y), 0., 1.);
        vec2 uvCoord = vec2(vTileinfo.x + fx * vTileinfo.z, vTileinfo.y + fy * vTileinfo.w);
        vec4 baseColor = texture(sampler2D(myTexture, mySampler), uvCoord);

        vec3 normalW = normalize(vNormalW);

        vec3 lightVectorW = normalize(-uniforms.lightDirection);

        float ndl = max(0., dot(normalW, lightVectorW));
        vec3 diffuse = ndl * vec3(1.); // vec3(1.) == diffuse color of light

        vec3 clipSpace = vPositionFromLight.xyz / vPositionFromLight.w;
        vec3 uvDepth = vec3(0.5 * clipSpace.xyz + vec3(0.5));

        uvDepth.z = clamp(uvDepth.z, 0., GREATEST_LESS_THAN_ONE);

        //float shadow = clipSpace.x < -1. || clipSpace.y > 1. || clipSpace.y < -1. || clipSpace.y > 1. ? 1. : texture(sampler2D(textureShadowmap, samplerShadowmap), uvDepth.xy).r < uvDepth.z ? 0. : 1.;
        float shadow = clipSpace.x < -1. || clipSpace.y > 1. || clipSpace.y < -1. || clipSpace.y > 1. ? 1. : texture(sampler2DShadow(textureShadowmap, samplerShadowmap), uvDepth);
        //float shadow = texture2D(shadowSampler, uvDepth);
        //shadow = mix(0., 1., shadow);

        vec3 finalDiffuse = clamp(diffuse * shadow + vec3(0.3), 0.0, 1.0) * baseColor.rgb;


        outColor = vec4(finalDiffuse, baseColor.a);
    }
`;

export const shadowmapVertexShaderGLSL = `
    #version 450

    layout(set = 0, binding = 0) uniform Uniforms {
        mat4 modelViewProjectionMatrix;
        vec3 lightDirection;
        vec2 bias;
    } uniforms;

    layout(location = 0) in vec4 position;
    layout(location = 1) in vec4 normal;

    void main() {
        vec4 worldPos = position;

        vec3 worldLightDir = normalize(-uniforms.lightDirection);

        float ndl = dot(normal.xyz, worldLightDir);
        float sinNL = sqrt(1.0 - ndl * ndl);
        float normalBias = uniforms.bias.y * sinNL;

        worldPos.xyz -= normal.xyz * normalBias;

        gl_Position = uniforms.modelViewProjectionMatrix * worldPos;
        gl_Position.z += uniforms.bias.x * gl_Position.w;

        gl_Position.y *= -1.0;
        gl_Position.z = (gl_Position.z + gl_Position.w) / 2.0;
    }
`;

export const shadowmapFragmentShaderGLSL = `
    #version 450

    layout(location = 0) out vec4 outColor;

    void main() {
        outColor = vec4(0., 1., 0., 1.);
    }
`;
