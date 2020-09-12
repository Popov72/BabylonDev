export const mainVertexShaderGLSL = `
    #version 450

    layout(set = 0, binding = 0) uniform Uniforms {
        mat4 modelViewProjectionMatrix;
    } uniforms;

    layout(location = 0) in vec4 position;
    layout(location = 1) in vec2 uv;
    layout(location = 2) in vec4 tileinfo;
    layout(location = 3) in vec4 normal;

    layout(location = 0) out vec2 fragUV;
    layout(location = 1) out vec4 vTileinfo;
    layout(location = 2) out vec3 vPositionW;
    layout(location = 3) out vec3 vNormalW;

    void main() {
        gl_Position = uniforms.modelViewProjectionMatrix * position;
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
    layout(set = 0, binding = 4) uniform sampler samplerShadowmap;
    layout(set = 0, binding = 5) uniform texture2D textureShadowmap;

    layout(location = 0) in vec2 fragUV;
    layout(location = 1) in vec4 vTileinfo;
    layout(location = 2) in vec3 vPositionW;
    layout(location = 3) in vec3 vNormalW;

    layout(location = 0) out vec4 outColor;

    void main() {
        float fx = clamp(fract(fragUV.x), 0., 1.), fy = clamp(fract(fragUV.y), 0., 1.);
        vec2 uvCoord = vec2(vTileinfo.x + fx * vTileinfo.z, vTileinfo.y + fy * vTileinfo.w);
        vec4 baseColor = texture(sampler2D(myTexture, mySampler), uvCoord);

        vec3 normalW = normalize(vNormalW);

        vec3 lightVectorW = normalize(-uniforms.lightDirection);

        float ndl = max(0., dot(normalW, lightVectorW));
        vec3 diffuse = ndl * vec3(1.); // vec3(1.) == diffuse color of light

        vec3 finalDiffuse = clamp(diffuse + vec3(0.3), 0.0, 1.0) * baseColor.rgb;

        vec4 depth = texture(sampler2D(textureShadowmap, samplerShadowmap), uvCoord);

        outColor = vec4(finalDiffuse * depth.rrr, baseColor.a);
    }
`;

export const shadowmapVertexShaderGLSL = `
    #version 450

    layout(set = 0, binding = 0) uniform Uniforms {
        mat4 modelViewProjectionMatrix;
    } uniforms;

    layout(location = 0) in vec4 position;

    void main() {
        gl_Position = uniforms.modelViewProjectionMatrix * position;
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
