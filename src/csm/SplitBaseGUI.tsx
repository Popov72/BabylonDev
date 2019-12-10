import * as React from "react";

import {
    Button,
    Checkbox,
    ExpansionPanel,
    ExpansionPanelDetails,
    ExpansionPanelSummary,
    Grid,
    Icon,
    MenuItem,
    Paper,
    Select,
    Switch,
    TextField,
    Typography,
} from '@material-ui/core';

import {
    Engine,
} from 'babylonjs';

import Sample from "../Sample";
import SplitGUI from "../SplitGUI";
import ISampleSplit from "./ISampleSplit";

export default class SplitBaseGUI extends SplitGUI {

    protected _sparent: ISampleSplit;

    constructor(name: string, engine: Engine, container: Sample, parent: ISampleSplit) {
        super(name, engine, container, parent);

        this._sparent = parent;
    }

    protected createCustomGUI(): React.ReactElement {
        const classes = this._useStyles();

        const Properties = () => {
            const [animateLight, setAnimateLight] = React.useState(this._sparent.animateLight);
            const [lightColor, setLightColor] = React.useState(this._sparent.lightColor);

            const handleAnimateLight = (event: React.ChangeEvent, checked: boolean) => {
                setAnimateLight(checked);
                this._sparent.animateLight = checked;
            };

            const handleLightColor = (event: React.ChangeEvent<Element>) => {
                this._sparent.lightColor = (event.target as any).value;
                setLightColor(this._sparent.lightColor);
            };

            return (
                <>
                    <ExpansionPanel defaultExpanded={true}>
                        <ExpansionPanelSummary expandIcon={<Icon>expand_more</Icon>}>
                            <Typography>SceneControls</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Paper className={classes.subPropertyTitle}>Current Scene</Paper>
                                </Grid>
                                <Grid item xs={6} className={classes.propertyValue}>
                                    <Paper className={classes.propertyValue}>{this._sparent.sceneName}></Paper>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper className={classes.subPropertyTitle}>Animate Light</Paper>
                                </Grid>
                                <Grid item xs={6} className={classes.propertyValue}>
                                    <Paper className={classes.propertyValue}>
                                        <Switch checked={animateLight} onChange={handleAnimateLight} />                                
                                    </Paper>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper className={classes.subPropertyTitle}>Light Color</Paper>
                                </Grid>
                                <Grid item xs={6} className={classes.propertyValue}>
                                    <Paper className={classes.propertyValue}>
                                        <TextField type="color" value={lightColor} variant="filled" onChange={handleLightColor} />
                                    </Paper>
                                </Grid>
                            </Grid>
                        </ExpansionPanelDetails>
                    </ExpansionPanel>
                    {this.createCustomGUIProperties()}
                </>
            );
        };

        return Properties();
    }

    protected createCustomGUIProperties(): React.ReactElement {
        return (
            <React.Fragment>
            </React.Fragment>
        );
    }

}
