import * as React from "react";

import {
    Grid,
    MenuItem,
    Paper,
    Select,
} from '@material-ui/core';

import {
    Vector3,
    Color3,
    Engine,
} from "babylonjs";

import MainGUI from "../MainGUI";
import Sample from "../Sample";

export default class GlobalGUI extends MainGUI {

    public scenes:  Array<any>;

    protected _selectedScene:   number;

    public get selectedScene(): number {
        return this._selectedScene;
    }

    constructor(name: string, engine: Engine, parent: Sample) {
        super(name, engine, parent);

        this._selectedScene = 0;
        this.scenes = [
            {
                "dname": "Power Plant",
                "path": "./resources/3d/powerplant/",
                "name": "powerplant.obj",
                "backfaceCulling": false,  // Some meshes have incorrect winding orders... use no backface culling for now
                "camera": {
                    "position": new Vector3(40, 5, 5),
                    "target": new Vector3(0, 5, 5),
                },
                "scaling": 0.5,
                "sunColor": new Color3(1, 1, 1),
            },
            {
                "dname": "Tower",
                "path": "./resources/3d/Tower/",
                "name": "Tower.obj",
                "backfaceCulling": true,
                "camera": {
                    "position": new Vector3(40, 5, 5),
                    "target": new Vector3(0, 5, 5),
                },
                "scaling": 0.025,
                "sunColor": new Color3(1, 0.8, 0.5),
            }/*,
            {
                "dname": "Dude",
                "path": "./resources/3d/Dude/",
                "name": "dude.babylon",
                "backfaceCulling": true,
                "camera": {
                    "position": new Vector3(0, 76, 154),
                    "target": new Vector3(0, 0, 0),
                },
                "scaling": 0.25,
            }*/,
            {
                "dname": "Columns",
                "path": "./resources/3d/Columns/",
                "name": "Columns.obj",
                "backfaceCulling": true,
                "camera": {
                    "position": new Vector3(40, 5, 5),
                    "target": new Vector3(0, 5, 5),
                },
                "scaling": 0.25,
                "sunColor": new Color3(1, 0.8, 0.5),
            }
        ];
    }

    protected createCustomGlobalGUIProperties(): React.ReactElement {
        const classes = this._useStyles();
        const [scene, setScene] = React.useState(this._selectedScene);

        const changeScene = (event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>, child: React.ReactNode) => {
            this._selectedScene = event.target.value as number;
            setScene(this._selectedScene);
        };

        return (
            <React.Fragment>
                <Grid item xs={6}>
                    <Paper className={classes.propertyTitle}>Scene</Paper>
                </Grid>
                <Grid item xs={6}>
                    <Select
                        className={classes.propertyValue}
                        id="scene"
                        value={scene}
                        onChange={changeScene}
                        >
                        { this.scenes.map((scene: any, idx: number) => {
                            return (
                                <MenuItem key={idx} value={idx}>{scene.dname}</MenuItem>
                            );
                        }) }
                    </Select>
                </Grid>
            </React.Fragment>
        );
    }

}
