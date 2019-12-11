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
    Slider,
    Switch,
    TextField,
    Typography,
} from '@material-ui/core';

import {
    withStyles,
} from '@material-ui/core/styles';

import {
    Engine,
    ShadowGenerator,
} from 'babylonjs';

import Sample from "../Sample";
import SplitGUI from "../SplitGUI";
import ISampleSplit from "./ISampleSplit";

const PrettoSlider = withStyles({
    root: {
      color: '#52af77',
      height: 8,
    },
    thumb: {
      height: 24,
      width: 24,
      backgroundColor: '#fff',
      border: '2px solid currentColor',
      marginTop: -8,
      marginLeft: -12,
      '&:focus,&:hover,&$active': {
        boxShadow: 'inherit',
      },
    },
    active: {},
    valueLabel: {
      left: 'calc(-50% + 4px)',
    },
    track: {
      height: 8,
      borderRadius: 4,
    },
    rail: {
      height: 8,
      borderRadius: 4,
    },
  })(Slider);
  
export default class SplitBaseGUI extends SplitGUI {

    protected _sparent: ISampleSplit;

    constructor(name: string, engine: Engine, container: Sample, parent: ISampleSplit) {
        super(name, engine, container, parent);

        this._sparent = parent;
    }

    protected createCustomGUI(): React.ReactElement {
        const classes = this._useStyles();

        const Properties = () => {
            //const [ignored, forceUpdate] = React.useReducer((x) => x + 1, 0);

            const [animateLight, setAnimateLight] = React.useState(this._sparent.animateLight);
            const [lightColor, setLightColor] = React.useState(this._sparent.lightColor);

            const [shadowMapSize, setShadowMapSize] = React.useState(this._sparent.shadowMapSize);
            const [shadowMapFilter, setShadowMapFilter] = React.useState(this._sparent.shadowMapFilter);

            const handleAnimateLight = (event: React.ChangeEvent, checked: boolean) => {
                setAnimateLight(checked);
                this._sparent.animateLight = checked;
            };

            const handleLightColor = (event: React.ChangeEvent<Element>) => {
                this._sparent.lightColor = (event.target as any).value;
                setLightColor(this._sparent.lightColor);
            };

            const changeShadowMapSize = (event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>, child: React.ReactNode) => {
                this._sparent.shadowMapSize = event.target.value as number;
                setShadowMapSize(this._sparent.shadowMapSize);
            };

            const changeShadowMapFilter = (event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>, child: React.ReactNode) => {
                this._sparent.shadowMapFilter = event.target.value as number;
                setShadowMapFilter(this._sparent.shadowMapFilter);
            };

            /*React.useEffect(() => {
                const handler = (event: Event) => {
                    forceUpdate(0);
                };

                window.addEventListener('gui_redraw', handler);

                return () => {
                    window.removeEventListener('gui_redraw', handler);
                };
            }, []);*/

            return (
                <>
                    <ExpansionPanel defaultExpanded={true}>
                        <ExpansionPanelSummary expandIcon={<Icon>expand_more</Icon>}>
                            <Typography>Scene Controls</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Paper className={classes.subPropertyTitle}>Current Scene</Paper>
                                </Grid>
                                <Grid item xs={6} className={classes.propertyValue}>
                                    <Paper className={classes.propertyValue}>{this._sparent.sceneName}</Paper>
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
                    <ExpansionPanel defaultExpanded={true}>
                        <ExpansionPanelSummary expandIcon={<Icon>expand_more</Icon>}>
                            <Typography>Shadow Map</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Paper className={classes.subPropertyTitle}>Size</Paper>
                                </Grid>
                                <Grid item xs={6} className={classes.propertyValue}>
                                    <Select
                                        className={classes.propertyValue}
                                        value={shadowMapSize}
                                        onChange={changeShadowMapSize}
                                        >
                                        <MenuItem value={2048}>2048x2048</MenuItem>
                                        <MenuItem value={1024}>1024x1024</MenuItem>
                                        <MenuItem value={512}>512x512</MenuItem>
                                        <MenuItem value={256}>256x256</MenuItem>
                                    </Select>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper className={classes.subPropertyTitle}>Filter Type</Paper>
                                </Grid>
                                <Grid item xs={6} className={classes.propertyValue}>
                                    <Select
                                        className={classes.propertyValue}
                                        value={shadowMapFilter}
                                        onChange={changeShadowMapFilter}
                                        >
                                        <MenuItem value={ShadowGenerator.FILTER_PCSS}>PCSS</MenuItem>
                                        <MenuItem value={ShadowGenerator.FILTER_PCF}>PCF</MenuItem>
                                        <MenuItem value={ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP}>CESM (Blur)</MenuItem>
                                        <MenuItem value={ShadowGenerator.FILTER_CLOSEEXPONENTIALSHADOWMAP}>CESM</MenuItem>
                                        <MenuItem value={ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP}>ESM (Blur)</MenuItem>
                                        <MenuItem value={ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP}>ESM</MenuItem>
                                        <MenuItem value={ShadowGenerator.FILTER_POISSONSAMPLING}>Poisson</MenuItem>
                                    </Select>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper className={classes.subPropertyTitle}>Bias</Paper>
                                </Grid>
                                <Grid item xs={6} className={classes.propertyValue}>
                                    <Paper className={classes.propertyValue}>
                                        <TextField type="number" value={0.007} variant="standard" inputProps={{ step: "0.001" }} />
                                    </Paper>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper className={classes.subPropertyTitle}>Normal Bias</Paper>
                                </Grid>
                                <Grid item xs={6} className={classes.propertyValue}>
                                    <Paper className={classes.propertyValue}>
                                        <TextField type="number" value={0} variant="standard" inputProps={{ step: "0.001" }} />
                                    </Paper>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper className={classes.subPropertyTitle}>Darkness</Paper>
                                </Grid>
                                <Grid item xs={6} className={classes.propertyValue}>
                                    <Paper className={classes.propertyValue}>
                                        <PrettoSlider valueLabelDisplay="auto" defaultValue={0} min={0} max={1} step={0.01} />
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
            <>
            </>
        );
    }

}
