import {
    Scene,
    Vector3,
    UniversalCamera,
    HemisphericLight,
    StandardMaterial,
    MeshBuilder,
    Effect,
    ShaderMaterial,
    Color4,
    PointLight,
    Color3,
    Mesh,
    Engine,
    DynamicTexture,
    AbstractMesh,
    Material,
} from "babylonjs";

import * as GUI from "babylonjs-gui";

import SampleBasic from "../SampleBasic";

export default class DrawEdges extends SampleBasic {

    protected populateScene(scene: Scene, camera: UniversalCamera) {
        camera.position.x = 0;
        camera.position.y = 5;
        camera.position.z = -10;

        camera.setTarget(Vector3.Zero());

        scene.clearColor = new Color4(0.54, 0.74, 1., 1);

        var light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
        light.intensity = 0.7;
        var pl = new PointLight("pl", Vector3.Zero(), scene);
        pl.diffuse = new Color3(1, 1, 1);
        pl.specular = new Color3(1, 1, 1);
        pl.intensity = 0.8;

        // GUI
        var advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("ui1");

        var createLabel = function(mesh: AbstractMesh) {
            var label = new GUI.Rectangle("label for " + mesh.name);
            label.height = "30px";
            label.alpha = 0.5;
            label.width = "100px";
            label.linkOffsetY = 30;
            advancedTexture.addControl(label);
            label.linkWithMesh(mesh);

            var text1 = new GUI.TextBlock();
            text1.text = mesh.name;
            text1.color = "black";
            label.addControl(text1);

            return label;
        };

        const whiteMaterials = true;

        Effect.ShadersStore["customVertexShader"] = `
            precision highp float;
            // Attributes
            attribute vec3 position;
            // Uniforms
            uniform mat4 worldViewProjection;
            uniform mat4 world;
            // Varying
            varying vec4 wpos;
            void main(void) {
                vec4 q = vec4(position, 1.0);
                wpos = world * q;
                gl_Position = worldViewProjection * q;
            }`;

        Effect.ShadersStore["customFragmentShader"] = `
            precision highp float;
            uniform vec3 lineColor;
            varying vec4 wpos;
            void main(void) {
                vec4 col = vec4(lineColor, 1.);
                float sum = wpos.x + wpos.y + wpos.z;
                if (mod(sum, .33) < 0.12) discard;
                gl_FragColor = vec4(col.xyz, 0.3);
            }`;

        // define material
        const lineMaterial1 = new StandardMaterial("lineMaterial_1", scene);
        lineMaterial1.emissiveColor = whiteMaterials ? new Color3(0, 0, 0) : new Color3(1, 1, 1);
        lineMaterial1.disableLighting = true;

        var lineMaterial1_hidden = new ShaderMaterial("shader", scene, {
            vertex: "custom",
            fragment: "custom",
            },
            {
                attributes: ["position"],
                uniforms: ["world", "worldViewProjection", "lineColor"],
                needAlphaBlending: true
            });

        lineMaterial1_hidden.setColor3("lineColor", lineMaterial1.emissiveColor);
        lineMaterial1_hidden.depthFunction = Engine.ALWAYS;

        const lineMaterial2 = new StandardMaterial("lineMaterial_2", scene);
        lineMaterial2.diffuseColor = new Color3(1, 0, 0);

        const materialX = new StandardMaterial("materialX", scene);
        materialX.diffuseColor = whiteMaterials ? new Color3(1, 1, 1) : new Color3(0, 0, 1);
        if (whiteMaterials) {
            materialX.emissiveColor = materialX.diffuseColor;
            materialX.disableLighting = true;
        }
        // materialX.alpha = 0.2;

        const materialZ = new StandardMaterial("materialZ", scene);
        materialZ.diffuseColor = whiteMaterials ? new Color3(1, 1, 1) : new Color3(0, 1, 0);
        if (whiteMaterials) {
            materialZ.emissiveColor = materialZ.diffuseColor;
            materialZ.disableLighting = true;
        }
        // materialZ.alpha = 0.2;

        const materialY = new StandardMaterial("materialY", scene);
        materialY.diffuseColor = whiteMaterials ? new Color3(1, 1, 1) : new Color3(1, 0, 0);
        if (whiteMaterials) {
            materialY.emissiveColor = materialY.diffuseColor;
            materialY.disableLighting = true;
        }
        // materialY.alpha = 0.2;

        // create a line
        const createLine = (id: string, position: Vector3, length: number, direction: string, radius: number, mat?: Material) => {
            if (!radius) { radius = 0.005; }
            if (!mat) { mat = lineMaterial1; }
            const points = direction === 'y'
            ? [new Vector3(0, -length / 2, 0), new Vector3(0, length / 2, 0)]
            : direction === 'x'
                ? [new Vector3(-length / 2, 0, 0), new Vector3(length / 2, 0, 0)]
                : [new Vector3(0, 0, -length / 2), new Vector3(0, 0, length / 2)];

            const shape = MeshBuilder.CreateTube(id, {path: points, radius: radius, sideOrientation: Mesh.DOUBLESIDE}, scene);
            shape.position = position;
            shape.material = mat;
            shape.renderingGroupId = 0;
            return shape;
        };

        // distance from center of the shape to camera
        const distance = (mesh: AbstractMesh) => {
            const camPos = camera.position;
            const meshPos = mesh.position;
            const pow = Math.pow(meshPos.x - camPos.x, 2) + Math.pow(meshPos.y - camPos.y, 2) + Math.pow(meshPos.z - camPos.z, 2);
            return Math.sqrt(pow);
        };

        const planes: any = {};
        let counter = 0;
        const markers: any = {};

        // points should be in counter clockwise order
        const CreatePlanes = (points: Array<Vector3>, y: number) => {
            planes[`horizontal${counter}`] = MeshBuilder
                .CreatePolygon(`horizontal${counter}`, {shape: points, sideOrientation: Mesh.DOUBLESIDE }, scene);
            planes[`horizontal${counter}`].position.y = y;
            planes[`horizontal${counter}`].material = materialY;
            counter++;
        };

        const CreateMarkers = (points: Array<Vector3>) => {
            points.forEach((p, i) => {
                markers[`marker_${i}`] = Mesh.CreateSphere(`marker_${i}`, 32, 0.2, scene);
                markers[`marker_${i}`].position = new Vector3(p.x, p.y, p.z);
                markers[`marker_${i}`].material = lineMaterial2;
            });
        };

        const a = 1.5;
        const lineLength = 3;
        const b = lineLength / 2;

        const data = [
            // top
            { points: [0, a, b], length: lineLength, direction: 'x' },
            { points: [-b, a, 0], length: lineLength, direction: 'z' },
            { points: [0, a, -b], length: lineLength, direction: 'x' },
            { points: [b, a, -b +  lineLength / 6], length: lineLength / 3, direction: 'z' },
            { points: [lineLength / 3, a, -b + (lineLength / 3)], length: lineLength / 3, direction: 'x' },
            { points: [b - lineLength / 3, a, 0], length: lineLength / 3, direction: 'z' },
            { points: [lineLength / 3, a, b - lineLength / 3], length: lineLength / 3, direction: 'x' },
            { points: [b, a, b - lineLength / 6], length: lineLength / 3, direction: 'z' },
            // bottom
            { points: [0, -a, b], length: lineLength, direction: 'x' },
            { points: [-b, -a, 0], length: lineLength, direction: 'z' },
            { points: [0, -a, -b], length: lineLength, direction: 'x' },
            { points: [b, -a, -b +  lineLength / 6], length: lineLength / 3, direction: 'z' },
            { points: [lineLength / 3, -a, -b + (lineLength / 3)], length: lineLength / 3, direction: 'x' },
            { points: [b - lineLength / 3, -a, 0], length: lineLength / 3, direction: 'z' },
            { points: [lineLength / 3, -a, b - lineLength / 3], length: lineLength / 3, direction: 'x' },
            { points: [b, -a, b - lineLength / 6], length: lineLength / 3, direction: 'z' },
            // pillars
            { points: [b, 0, b], length: lineLength, direction: 'y' },
            { points: [-b, 0, b], length: lineLength, direction: 'y' },
            { points: [-b, 0, -b], length: lineLength, direction: 'y' },
            { points: [b, 0, -b], length: lineLength, direction: 'y' },
            { points: [b, 0, -b + lineLength / 3], length: lineLength, direction: 'y' },
            { points: [b - lineLength / 3, 0, -b + lineLength / 3], length: lineLength, direction: 'y' },
            { points: [b - lineLength / 3, 0, b - lineLength / 3], length: lineLength, direction: 'y' },
            { points: [b, 0, b - lineLength / 3], length: lineLength, direction: 'y' }
        ];

        const genHorizontalFaces = () => {
            // unique y values
            const uniqueValues = [...new Set(data.map((x) => x.points[1]))];
            uniqueValues.forEach((plane) => {
                const f = data.filter((d) => d.points[1] === plane);
                let face: Array<Vector3> = [];
                f.forEach((p) => {
                    if (p.direction === 'z') {
                        face.push(new Vector3(p.points[0], p.points[1], p.points[2] + p.length / 2));
                        face.push(new Vector3(p.points[0], p.points[1], p.points[2] - p.length / 2));
                    }
                    if (p.direction === 'x') {
                        face.push(new Vector3(p.points[0] + p.length / 2, p.points[1], p.points[2]));
                        face.push(new Vector3(p.points[0] - p.length / 2, p.points[1], p.points[2]));
                    }
                });
                // remove duplicates
                const dedup = face.filter((v, i, a) => a.findIndex((t) => (t.x === v.x && t.y === v.y && t.z === v.z)) === i);
                if (dedup.length) {
                    //CreateMarkers(dedup);
                    CreatePlanes(dedup, plane);
                }
            });
        };

        const genVerticalFacesX = () => {
            // unique y values
            const uniqueValues = [...new Set(data.map((x) => x.points[2]))];
            uniqueValues.forEach((plane) => {
                const f1 = data.filter((d) => d.points[2] === plane && d.direction === 'x');
                if (f1.length) {
                    const unique = [...new Set(f1.map((x) => x.points[2]))];
                    unique.forEach((x) => {
                        const f = f1.filter((d) => d.points[2] === x);
                        const height = f[0].points[1] - f[1].points[1];
                        const yStart = Math.min(f[0].points[1], f[1].points[1]);
                        planes[`verticalX${counter}`] = MeshBuilder
                            .CreateBox(`verticalX${counter}`, {height, width: f[0].length, depth: 0.001}, scene);
                        planes[`verticalX${counter}`].position =  new Vector3(f[0].points[0], 0, f[0].points[2]);
                        planes[`verticalX${counter}`].material = materialX;
                        counter++;
                    });
                }
            });
        };

        const genVerticalFacesZ = () => {
            // unique y values
            const uniqueValues = [...new Set(data.map((x) => x.points[2]))];
            uniqueValues.forEach((plane) => {
                const f1 = data.filter((d) => d.points[2] === plane && d.direction === 'z');
                if (f1.length) {
                    const unique = [...new Set(f1.map((x) => x.points[0]))];
                    unique.forEach((z) => {
                        const f = f1.filter((d) => d.points[0] === z);
                        const height = f[0].points[1] - f[1].points[1];
                        const yStart = Math.min(f[0].points[1], f[1].points[1]);
                        planes[`verticalZ${counter}`] = MeshBuilder
                            .CreateBox(`verticalZ${counter}`, {height, depth: f[0].length, width: 0.001}, scene);
                        planes[`verticalZ${counter}`].position =  new Vector3(f[0].points[0], 0, f[0].points[2]);
                        planes[`verticalZ${counter}`].material = materialZ;
                        counter++;
                    });
                }
            });
        };

        const genMarkers = () => {
            // unique y values
            const uniqueValues = [...new Set(data.map((x) => x.points[1]))];
            uniqueValues.forEach((plane) => {
                const f = data.filter((d) => d.points[1] === plane);
                let face: Array<Vector3> = [];
                f.forEach((p) => {
                    if (p.direction === 'z') {
                        face.push(new Vector3(p.points[0], p.points[1], p.points[2] + p.length / 2));
                        face.push(new Vector3(p.points[0], p.points[1], p.points[2] - p.length / 2));
                    }
                    if (p.direction === 'x') {
                        face.push(new Vector3(p.points[0] + p.length / 2, p.points[1], p.points[2]));
                        face.push(new Vector3(p.points[0] - p.length / 2, p.points[1], p.points[2]));
                    }
                });
                // remove duplicates
                const dedup = face.filter((v, i, a) => a.findIndex((t) => (t.x === v.x && t.y === v.y && t.z === v.z)) === i);
                if (dedup.length) {
                    CreateMarkers(dedup);
                }
            });
        };

        // comment these 3 functions to hide planes
        genHorizontalFaces();
        genVerticalFacesX();
        genVerticalFacesZ();

        const lines: any = {};
        data.forEach((d, i) => {
            const p = d.points;
            lines[`line_${i}`] = createLine(`line_${i}`, new Vector3(p[0], p[1], p[2]) , d.length, d.direction, 0.03);
        });

        data.forEach((d, i) => {
            const p = d.points;
            const meshl = createLine(`line2_${i}`, new Vector3(p[0], p[1], p[2]) , d.length, d.direction, 0.005, lineMaterial1_hidden);
        });

        genMarkers();

        function showWorldAxis(size: number) {
            var makeTextPlane = function(text: string, color: string, size: number) {
                var dynamicTexture = new DynamicTexture("DynamicTexture", 50, scene, true);
                dynamicTexture.hasAlpha = true;
                dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color , "transparent", true);
                var plane = Mesh.CreatePlane("TextPlane", size, scene, true);
                plane.material = new StandardMaterial("TextPlaneMaterial", scene);
                plane.material.backFaceCulling = false;
                (plane.material as StandardMaterial).specularColor = new Color3(0, 0, 0);
                (plane.material as StandardMaterial).diffuseTexture = dynamicTexture;
            return plane;
            };
            var axisX = Mesh.CreateLines("axisX", [
            Vector3.Zero(), new Vector3(size, 0, 0), new Vector3(size * 0.95, 0.05 * size, 0),
            new Vector3(size, 0, 0), new Vector3(size * 0.95, -0.05 * size, 0)
            ], scene);
            axisX.color = new Color3(1, 0, 0);
            var xChar = makeTextPlane("X", "red", size / 10);
            xChar.position = new Vector3(0.9 * size, -0.05 * size, 0);
            var axisY = Mesh.CreateLines("axisY", [
                Vector3.Zero(), new Vector3(0, size, 0), new Vector3(-0.05 * size, size * 0.95, 0),
                new Vector3(0, size, 0), new Vector3(0.05 * size, size * 0.95, 0)
                ], scene);
            axisY.color = new Color3(0, 1, 0);
            var yChar = makeTextPlane("Y", "green", size / 10);
            yChar.position = new Vector3(0, 0.9 * size, -0.05 * size);
            var axisZ = Mesh.CreateLines("axisZ", [
                Vector3.Zero(), new Vector3(0, 0, size), new Vector3(0 , -0.05 * size, size * 0.95),
                new Vector3(0, 0, size), new Vector3(0, 0.05 * size, size * 0.95)
                ], scene);
            axisZ.color = new Color3(0, 0, 1);
            var zChar = makeTextPlane("Z", "blue", size / 10);
            zChar.position = new Vector3(0, 0.05 * size, 0.9 * size);
        }

        showWorldAxis(1);

    }

}

SampleBasic.registerSampleClass("drawedges", {
    "displayName": "Create a Render Target Texture and use it in a post process pass",
    "description": "",
    "class": DrawEdges,
});
