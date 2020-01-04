import * as React from "react";

import {
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
    ShadowGenerator,
} from 'babylonjs';

import { PrettoSlider } from "../GUI";
import Sample from "../Sample";
import SplitGUI from "../SplitGUI";
import ISampleSplit from "./ISampleSplit";
import { CascadedShadowGenerator } from "./cascadedShadowGenerator";

export default class SplitBaseGUI extends SplitGUI {

    protected _sparent: ISampleSplit;
    protected _showAutoCalcPlanes: boolean;
    protected _showCSM: boolean;

    constructor(name: string, engine: Engine, container: Sample, parent: ISampleSplit) {
        super(name, engine, container, parent);

        this._sparent = parent;
        this._showAutoCalcPlanes = true;
        this._showCSM = false;
        this.dimensions.width = 320;
        this.dimensions.height = 750;
    }

    protected createCustomGUI(): React.ReactElement {
        const classes = this._useStyles();

        const Properties = () => {
            //const [ignored, forceUpdate] = React.useReducer((x) => x + 1, 0);

            const [cameraNearPlane, setCameraNearPlane] = React.useState(this._sparent.cameraNearPlane);
            const [cameraFarPlane, setCameraFarPlane] = React.useState(this._sparent.cameraFarPlane);

            const [animateLight, setAnimateLight] = React.useState(this._sparent.animateLight);
            const [lightColor, setLightColor] = React.useState(this._sparent.lightColor);
            const [lightNearPlane, setLightNearPlane] = React.useState(Math.floor(this._sparent.lightNearPlane));
            const [lightFarPlane, setLightFarPlane] = React.useState(Math.floor(this._sparent.lightFarPlane));
            const [autoCalcShadowZBounds, setAutoCalcShadowZBounds] = React.useState(this._sparent.autoCalcShadowZBounds);
            const [showLightHelper, setShowLightHelper] = React.useState(this._sparent.showLightHelper);

            const [shadowMapShowDepthMap, setShadowMapShowDepthMap] = React.useState(this._sparent.shadowMapShowDepthMap);
            const [shadowMapSize, setShadowMapSize] = React.useState(this._sparent.shadowMapSize);
            const [shadowMapBias, setShadowMapBias] = React.useState(this._sparent.shadowMapBias);
            const [shadowMapNormalBias, setShadowMapNormalBias] = React.useState(this._sparent.shadowMapNormalBias);
            const [shadowMapDarkness, setShadowMapDarkness] = React.useState(this._sparent.shadowMapDarkness);
            const [shadowMapFilter, setShadowMapFilter] = React.useState(this._sparent.shadowMapFilter);
            const [shadowMapQuality, setShadowMapQuality] = React.useState(this._sparent.shadowMapQuality);
            const [shadowMapDepthScale, setShadowMapDepthScale] = React.useState(this._sparent.shadowMapDepthScale);
            const [shadowMapBlurScale, setShadowMapBlurScale] = React.useState(this._sparent.shadowMapBlurScale);
            const [shadowMapUseKernelBlur, setShadowMapUseKernelBlur] = React.useState(this._sparent.shadowMapUseKernelBlur);
            const [shadowMapBlurKernel, setShadowMapBlurKernel] = React.useState(this._sparent.shadowMapBlurKernel);
            const [shadowMapBlurBoxOffset, setShadowMapBlurBoxOffset] = React.useState(this._sparent.shadowMapBlurBoxOffset);
            const [shadowMapLightSizeUVRatio, setShadowMapLightSizeUVRatio] = React.useState(this._sparent.shadowMapLightSizeUVRatio);

            const [csmNumCascades, setCSMNumCascades] = React.useState(this._sparent.csmNumCascades);
            const [csmActiveCascade, setCSMActiveCascade] = React.useState(this._sparent.csmActiveCascade);
            const [csmVisualizeCascades, setCSMVisualizeCascades] = React.useState(this._sparent.csmVisualizeCascades);
            const [csmStabilizeCascades, setCSMStabilizeCascades] = React.useState(this._sparent.csmStabilizeCascades);
            const [csmDepthClamp, setCSMDepthClamp] = React.useState(this._sparent.csmDepthClamp);
            const [csmLambda, setCSMLambda] = React.useState(this._sparent.csmLambda);
            const [csmSplitBlendPercentage, setCSMSplitBlendPercentage] = React.useState(this._sparent.csmSplitBlendPercentage);
            const [csmLightSizeCorrection, setCSMLightSizeCorrection] = React.useState(this._sparent.csmLightSizeCorrection);
            const [csmDepthCorrection, setCSMDepthCorrection] = React.useState(this._sparent.csmDepthCorrection);
            const [csmPenumbraDarkness, setCSMPenumbraDarkness] = React.useState(this._sparent.csmPenumbraDarkness);
            const [csmShadowMaxZ, setCSMShadowMaxZ] = React.useState(this._sparent.csmShadowMaxZ);
            const [csmAutoCalcDepthBounds, setCSMAutoCalcDepthBounds] = React.useState(this._sparent.csmAutoCalcDepthBounds);

            const changeCameraNearPlane = (event: React.ChangeEvent<{}>, value: number | number[]) => {
                this._sparent.cameraNearPlane = value as number;
                setCameraNearPlane(this._sparent.cameraNearPlane);
            };

            const changeCameraFarPlane = (event: React.ChangeEvent<{}>, value: number | number[]) => {
                this._sparent.cameraFarPlane = value as number;
                setCameraFarPlane(this._sparent.cameraFarPlane);
            };

            const changeAnimateLight = (event: React.ChangeEvent, checked: boolean) => {
                setAnimateLight(checked);
                this._sparent.animateLight = checked;
            };

            const changeLightColor = (event: React.ChangeEvent<Element>) => {
                this._sparent.lightColor = (event.target as any).value;
                setLightColor(this._sparent.lightColor);
            };

            const changeLightNearPlane = (event: React.ChangeEvent<{}>, value: number | number[]) => {
                this._sparent.lightNearPlane = value as number;
                setLightNearPlane(this._sparent.lightNearPlane);
            };

            const changeLightFarPlane = (event: React.ChangeEvent<{}>, value: number | number[]) => {
                this._sparent.lightFarPlane = value as number;
                setLightFarPlane(this._sparent.lightFarPlane);
            };

            const changeAutoCalcShadowZBounds = (event: React.ChangeEvent, checked: boolean) => {
                setAutoCalcShadowZBounds(checked);
                this._sparent.autoCalcShadowZBounds = checked;
            };

            const changeShowLightHelper = (event: React.ChangeEvent, checked: boolean) => {
                setShowLightHelper(checked);
                this._sparent.showLightHelper = checked;
            };

            const changeShadowMapShowDepthMap = (event: React.ChangeEvent, checked: boolean) => {
                setShadowMapShowDepthMap(checked);
                this._sparent.shadowMapShowDepthMap = checked;
            };

            const changeShadowMapSize = (event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>, child: React.ReactNode) => {
                this._sparent.shadowMapSize = event.target.value as number;
                setShadowMapSize(this._sparent.shadowMapSize);
            };

            const changeShadowMapBias = (event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>) => {
                this._sparent.shadowMapBias = event.target.value as number;
                setShadowMapBias(this._sparent.shadowMapBias);
            };

            const changeShadowMapNormalBias = (event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>) => {
                this._sparent.shadowMapNormalBias = event.target.value as number;
                setShadowMapNormalBias(this._sparent.shadowMapNormalBias);
            };

            const changeShadowMapDarkness = (event: React.ChangeEvent<{}>, value: number | number[]) => {
                this._sparent.shadowMapDarkness = value as number;
                setShadowMapDarkness(this._sparent.shadowMapDarkness);
            };

            const changeShadowMapFilter = (event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>, child: React.ReactNode) => {
                this._sparent.shadowMapFilter = event.target.value as number;
                setShadowMapFilter(this._sparent.shadowMapFilter);
            };

            const changeShadowMapQuality = (event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>, child: React.ReactNode) => {
                this._sparent.shadowMapQuality = event.target.value as number;
                setShadowMapQuality(this._sparent.shadowMapQuality);
            };

            const changeShadowMapDepthScale = (event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>) => {
                this._sparent.shadowMapDepthScale = event.target.value as number;
                setShadowMapDepthScale(this._sparent.shadowMapDepthScale);
            };

            const changeShadowMapBlurScale = (event: React.ChangeEvent<{}>, value: number | number[]) => {
                this._sparent.shadowMapBlurScale = value as number;
                setShadowMapBlurScale(this._sparent.shadowMapBlurScale);
            };

            const changeShadowMapUseKernelBlur = (event: React.ChangeEvent, checked: boolean) => {
                setShadowMapUseKernelBlur(checked);
                this._sparent.shadowMapUseKernelBlur = checked;
            };

            const changeShadowMapBlurKernel = (event: React.ChangeEvent<{}>, value: number | number[]) => {
                this._sparent.shadowMapBlurKernel = value as number;
                setShadowMapBlurKernel(this._sparent.shadowMapBlurKernel);
            };

            const changeShadowMapBlurBoxOffset = (event: React.ChangeEvent<{}>, value: number | number[]) => {
                this._sparent.shadowMapBlurBoxOffset = value as number;
                setShadowMapBlurBoxOffset(this._sparent.shadowMapBlurBoxOffset);
            };

            const changeShadowMapLightSizeUVRatio = (event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>) => {
                this._sparent.shadowMapLightSizeUVRatio = event.target.value as number;
                setShadowMapLightSizeUVRatio(this._sparent.shadowMapLightSizeUVRatio);
            };

            const changeNumCascades = (event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>, child: React.ReactNode) => {
                this._sparent.csmNumCascades = event.target.value as number;
                setCSMNumCascades(this._sparent.csmNumCascades);
                setCSMActiveCascade(this._sparent.csmActiveCascade);
            };

            const changeActiveCascade = (event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>, child: React.ReactNode) => {
                this._sparent.csmActiveCascade = event.target.value as number;
                setCSMActiveCascade(this._sparent.csmActiveCascade);
                setShadowMapBias(this._sparent.shadowMapBias);
                setShadowMapNormalBias(this._sparent.shadowMapNormalBias);
                setShadowMapDarkness(this._sparent.shadowMapDarkness);
                setShadowMapFilter(this._sparent.shadowMapFilter);
                setShadowMapQuality(this._sparent.shadowMapQuality);
            };

            const changeCSMVisualizeCascades = (event: React.ChangeEvent, checked: boolean) => {
                setCSMVisualizeCascades(checked);
                this._sparent.csmVisualizeCascades = checked;
            };

            const changeCSMStabilizeCascades = (event: React.ChangeEvent, checked: boolean) => {
                setCSMStabilizeCascades(checked);
                this._sparent.csmStabilizeCascades = checked;
            };

            const changeCSMDepthClamp = (event: React.ChangeEvent, checked: boolean) => {
                setCSMDepthClamp(checked);
                this._sparent.csmDepthClamp = checked;
            };

            const changeCSMLambda = (event: React.ChangeEvent<{}>, value: number | number[]) => {
                this._sparent.csmLambda = value as number;
                setCSMLambda(this._sparent.csmLambda);
            };

            const changeCSMSplitBlendPercentage = (event: React.ChangeEvent<{}>, value: number | number[]) => {
                this._sparent.csmSplitBlendPercentage = value as number;
                setCSMSplitBlendPercentage(this._sparent.csmSplitBlendPercentage);
            };

            const changeCSMLightSizeCorrection = (event: React.ChangeEvent, checked: boolean) => {
                setCSMLightSizeCorrection(checked);
                this._sparent.csmLightSizeCorrection = checked;
            };

            const changeCSMDepthCorrection = (event: React.ChangeEvent<{}>, checked: boolean) => {
                setCSMDepthCorrection(checked);
                this._sparent.csmDepthCorrection = checked;
            };

            const changeCSMPenumbraDarkness = (event: React.ChangeEvent<{}>, value: number | number[]) => {
                this._sparent.csmPenumbraDarkness = value as number;
                setCSMPenumbraDarkness(this._sparent.csmPenumbraDarkness);
            };

            const changeCSMShadowMaxZ = (event: React.ChangeEvent<{}>, value: number | number[]) => {
                this._sparent.csmShadowMaxZ = value as number;
                setCSMShadowMaxZ(this._sparent.csmShadowMaxZ);
            };

            const changeCSMAutoCalcDepthBounds = (event: React.ChangeEvent, checked: boolean) => {
                setCSMAutoCalcDepthBounds(checked);
                this._sparent.csmAutoCalcDepthBounds = checked;
            };


            React.useEffect(() => {
                const handler = (event: Event) => {
                    switch ((event as CustomEvent).detail.type) {
                        case 'setShadowZBounds': {
                            setLightNearPlane(Math.floor(this._sparent.lightNearPlane));
                            setLightFarPlane(Math.floor(this._sparent.lightFarPlane));
                            break;
                        }
                    }
                };

                window.addEventListener('gui_set_value', handler);

                return () => {
                    window.removeEventListener('gui_set_value', handler);
                };
            }, []);

            return (
                <>
                    <ExpansionPanel defaultExpanded={true}>
                        <ExpansionPanelSummary expandIcon={<Icon>expand_more</Icon>}>
                            <Typography>Scene</Typography>
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
                                    <Paper className={classes.subPropertyTitle}>Camera Near Plane</Paper>
                                </Grid>
                                <Grid item xs={6} className={classes.propertyValue}>
                                    <Paper className={classes.propertyValue}>
                                        <PrettoSlider valueLabelDisplay="auto" value={cameraNearPlane} min={0} max={10} step={0.01} onChange={changeCameraNearPlane} />
                                    </Paper>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper className={classes.subPropertyTitle}>Camera Far Plane</Paper>
                                </Grid>
                                <Grid item xs={6} className={classes.propertyValue}>
                                    <Paper className={classes.propertyValue}>
                                        <PrettoSlider valueLabelDisplay="auto" value={cameraFarPlane} min={0} max={2000} step={10} onChange={changeCameraFarPlane} />
                                    </Paper>
                                </Grid>
                            </Grid>
                        </ExpansionPanelDetails>
                    </ExpansionPanel>
                    <ExpansionPanel defaultExpanded={true}>
                        <ExpansionPanelSummary expandIcon={<Icon>expand_more</Icon>}>
                            <Typography>Light</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Paper className={classes.subPropertyTitle}>Show Helper</Paper>
                                </Grid>
                                <Grid item xs={6} className={classes.propertyValue}>
                                    <Paper className={classes.propertyValue}>
                                        <Switch checked={showLightHelper} onChange={changeShowLightHelper} />
                                    </Paper>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper className={classes.subPropertyTitle}>Animate</Paper>
                                </Grid>
                                <Grid item xs={6} className={classes.propertyValue}>
                                    <Paper className={classes.propertyValue}>
                                        <Switch checked={animateLight} onChange={changeAnimateLight} />
                                    </Paper>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper className={classes.subPropertyTitle}>Color</Paper>
                                </Grid>
                                <Grid item xs={6} className={classes.propertyValue}>
                                    <Paper className={classes.propertyValue}>
                                        <TextField type="color" value={lightColor} variant="filled" onChange={changeLightColor} />
                                    </Paper>
                                </Grid>
                                { this._showAutoCalcPlanes && <>
                                <Grid item xs={6}>
                                    <Paper className={classes.subPropertyTitle}>Auto Calc Planes</Paper>
                                </Grid>
                                <Grid item xs={6} className={classes.propertyValue}>
                                    <Paper className={classes.propertyValue}>
                                        <Switch checked={autoCalcShadowZBounds} onChange={changeAutoCalcShadowZBounds} />
                                    </Paper>
                                </Grid>
                                { true && <>
                                    <Grid item xs={6}>
                                        <Paper className={classes.subPropertyTitle}>Near Plane</Paper>
                                    </Grid>
                                    <Grid item xs={6} className={classes.propertyValue}>
                                        <Paper className={classes.propertyValue}>
                                            <PrettoSlider disabled={autoCalcShadowZBounds} valueLabelDisplay="auto" value={lightNearPlane} min={-250} max={250} step={1} onChange={changeLightNearPlane} />
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Paper className={classes.subPropertyTitle}>Far Plane</Paper>
                                    </Grid>
                                    <Grid item xs={6} className={classes.propertyValue}>
                                        <Paper className={classes.propertyValue}>
                                            <PrettoSlider disabled={autoCalcShadowZBounds} valueLabelDisplay="auto" value={lightFarPlane} min={0} max={500} step={1} onChange={changeLightFarPlane} />
                                        </Paper>
                                    </Grid>
                                </> }
                                </> }
                            </Grid>
                        </ExpansionPanelDetails>
                    </ExpansionPanel>
                    { this._showCSM && <>
                        <ExpansionPanel defaultExpanded={true}>
                            <ExpansionPanelSummary expandIcon={<Icon>expand_more</Icon>}>
                                <Typography>Cascaded Shadow Maps</Typography>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                <Grid container spacing={1}>
                                    <Grid item xs={6}>
                                        <Paper className={classes.subPropertyTitle}>Num of Cascades</Paper>
                                    </Grid>
                                    <Grid item xs={6} className={classes.propertyValue}>
                                        <Select
                                            className={classes.propertyValue}
                                            value={csmNumCascades}
                                            onChange={changeNumCascades}
                                        >
                                            { [...Array(4).keys()].map((_, i) => <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>) }
                                        </Select>
                                    </Grid>
                                    { false && <>
                                        <Grid item xs={6}>
                                            <Paper className={classes.subPropertyTitle}>Active Cascade</Paper>
                                        </Grid>
                                        <Grid item xs={6} className={classes.propertyValue}>
                                            <Select
                                                className={classes.propertyValue}
                                                value={csmActiveCascade}
                                                onChange={changeActiveCascade}
                                            >
                                                { [...Array(csmNumCascades).keys()].map((_, i) => <MenuItem key={i} value={i}>{i + 1}</MenuItem>) }
                                            </Select>
                                        </Grid>
                                    </> }
                                    <Grid item xs={6}>
                                        <Paper className={classes.subPropertyTitle}>Visualize Cascades</Paper>
                                    </Grid>
                                    <Grid item xs={6} className={classes.propertyValue}>
                                        <Paper className={classes.propertyValue}>
                                            <Switch checked={csmVisualizeCascades} onChange={changeCSMVisualizeCascades} />
                                        </Paper>
                                    </Grid>
                                    { false && <>
                                        <Grid item xs={6}>
                                            <Paper className={classes.subPropertyTitle}>Stabilize Cascades</Paper>
                                        </Grid>
                                        <Grid item xs={6} className={classes.propertyValue}>
                                            <Paper className={classes.propertyValue}>
                                                <Switch checked={csmStabilizeCascades} onChange={changeCSMStabilizeCascades} />
                                            </Paper>
                                        </Grid>
                                    </> }
                                    <Grid item xs={6}>
                                        <Paper className={classes.subPropertyTitle}>Lambda</Paper>
                                    </Grid>
                                    <Grid item xs={6} className={classes.propertyValue}>
                                        <Paper className={classes.propertyValue}>
                                            <PrettoSlider valueLabelDisplay="auto" value={csmLambda} min={0} max={1} step={0.01} onChange={changeCSMLambda} />
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Paper className={classes.subPropertyTitle}>Cascade Blend</Paper>
                                    </Grid>
                                    <Grid item xs={6} className={classes.propertyValue}>
                                        <Paper className={classes.propertyValue}>
                                            <PrettoSlider valueLabelDisplay="auto" value={csmSplitBlendPercentage} min={0} max={1} step={0.01} onChange={changeCSMSplitBlendPercentage} />
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Paper className={classes.subPropertyTitle}>Auto-Calc Depth</Paper>
                                    </Grid>
                                    <Grid item xs={6} className={classes.propertyValue}>
                                        <Paper className={classes.propertyValue}>
                                            <Switch checked={csmAutoCalcDepthBounds} onChange={changeCSMAutoCalcDepthBounds} />
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Paper className={classes.subPropertyTitle}>Shadow MaxZ</Paper>
                                    </Grid>
                                    <Grid item xs={6} className={classes.propertyValue}>
                                        <Paper className={classes.propertyValue}>
                                            <PrettoSlider valueLabelDisplay="auto" value={csmShadowMaxZ} min={0} max={500} step={10} onChange={changeCSMShadowMaxZ} />
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                    </> }
                    <ExpansionPanel defaultExpanded={true}>
                        <ExpansionPanelSummary expandIcon={<Icon>expand_more</Icon>}>
                            <Typography>{ this._showCSM ? "Cascade" : "Shadow Map" }</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <Grid container spacing={1}>
                                { (!this._showCSM || this._showCSM && shadowMapFilter === CascadedShadowGenerator.FILTER_NONE) && <>
                                    <Grid item xs={6}>
                                        <Paper className={classes.subPropertyTitle}>Show Depth Map</Paper>
                                    </Grid>
                                    <Grid item xs={6} className={classes.propertyValue}>
                                        <Paper className={classes.propertyValue}>
                                            <Switch checked={shadowMapShowDepthMap} onChange={changeShadowMapShowDepthMap} />
                                        </Paper>
                                    </Grid>
                                </> }
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
                                { this._showCSM && <>
                                    <Grid item xs={6}>
                                        <Paper className={classes.subPropertyTitle}>Depth Clamp</Paper>
                                    </Grid>
                                    <Grid item xs={6} className={classes.propertyValue}>
                                        <Paper className={classes.propertyValue}>
                                            <Switch checked={csmDepthClamp} onChange={changeCSMDepthClamp} />
                                        </Paper>
                                    </Grid>
                                </> }
                                <Grid item xs={6}>
                                    <Paper className={classes.subPropertyTitle}>Bias</Paper>
                                </Grid>
                                <Grid item xs={6} className={classes.propertyValue}>
                                    <Paper className={classes.propertyValue}>
                                        <TextField type="number" value={shadowMapBias} variant="standard" inputProps={{ step: "0.001" }} onChange={changeShadowMapBias} />
                                    </Paper>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper className={classes.subPropertyTitle}>Normal Bias</Paper>
                                </Grid>
                                <Grid item xs={6} className={classes.propertyValue}>
                                    <Paper className={classes.propertyValue}>
                                        <TextField type="number" value={shadowMapNormalBias} variant="standard" inputProps={{ step: "0.001" }} onChange={changeShadowMapNormalBias} />
                                    </Paper>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper className={classes.subPropertyTitle}>Darkness</Paper>
                                </Grid>
                                <Grid item xs={6} className={classes.propertyValue}>
                                    <Paper className={classes.propertyValue}>
                                        <PrettoSlider valueLabelDisplay="auto" value={shadowMapDarkness} min={0} max={1} step={0.01} onChange={changeShadowMapDarkness} />
                                    </Paper>
                                </Grid>
                                <Grid item xs={6}>
                                    <Paper className={classes.subPropertyTitle}>Filter Type</Paper>
                                </Grid>
                                <Grid item xs={6} className={classes.propertyValue}>
                                    { !this._showCSM && <>
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
                                            <MenuItem value={ShadowGenerator.FILTER_NONE}>None</MenuItem>
                                        </Select>
                                    </> }
                                    { this._showCSM && <>
                                        <Select
                                            className={classes.propertyValue}
                                            value={shadowMapFilter}
                                            onChange={changeShadowMapFilter}
                                            >
                                            <MenuItem value={CascadedShadowGenerator.FILTER_PCSS}>PCSS</MenuItem>
                                            <MenuItem value={CascadedShadowGenerator.FILTER_PCF}>PCF</MenuItem>
                                            <MenuItem value={CascadedShadowGenerator.FILTER_NONE}>None</MenuItem>
                                        </Select>
                                    </> }
                                </Grid>
                                {((shadowMapFilter === ShadowGenerator.FILTER_PCSS || shadowMapFilter === ShadowGenerator.FILTER_PCF) && !this._showCSM || (shadowMapFilter === CascadedShadowGenerator.FILTER_PCSS || shadowMapFilter === CascadedShadowGenerator.FILTER_PCF) && this._showCSM) && <>
                                    <Grid item xs={6}>
                                        <Paper className={classes.subPropertyTitle}>Filtering Quality</Paper>
                                    </Grid>
                                    <Grid item xs={6} className={classes.propertyValue}>
                                        <Select
                                            className={classes.propertyValue}
                                            value={shadowMapQuality}
                                            onChange={changeShadowMapQuality}
                                            >
                                            <MenuItem value={ShadowGenerator.QUALITY_LOW}>Low</MenuItem>
                                            <MenuItem value={ShadowGenerator.QUALITY_MEDIUM}>Medium</MenuItem>
                                            <MenuItem value={ShadowGenerator.QUALITY_HIGH}>High</MenuItem>
                                        </Select>
                                    </Grid>
                                </> }
                                {((shadowMapFilter === ShadowGenerator.FILTER_PCSS) && !this._showCSM || (shadowMapFilter === CascadedShadowGenerator.FILTER_PCSS) && this._showCSM) && <>
                                    <Grid item xs={6}>
                                        <Paper className={classes.subPropertyTitle}>Light Size UV Ratio</Paper>
                                    </Grid>
                                    <Grid item xs={6} className={classes.propertyValue}>
                                        <Paper className={classes.propertyValue}>
                                            <TextField type="number" value={shadowMapLightSizeUVRatio} variant="standard" inputProps={{ step: "0.001" }} onChange={changeShadowMapLightSizeUVRatio} />
                                        </Paper>
                                    </Grid>
                                    { this._showCSM && <>
                                        <Grid item xs={6}>
                                            <Paper className={classes.subPropertyTitle}>Penumbra Darkness</Paper>
                                        </Grid>
                                        <Grid item xs={6} className={classes.propertyValue}>
                                            <Paper className={classes.propertyValue}>
                                                <PrettoSlider valueLabelDisplay="auto" value={csmPenumbraDarkness} min={0} max={1} step={0.01} onChange={changeCSMPenumbraDarkness} />
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Paper className={classes.subPropertyTitle}>Light Size Correction</Paper>
                                        </Grid>
                                        <Grid item xs={6} className={classes.propertyValue}>
                                            <Paper className={classes.propertyValue}>
                                                <Switch checked={csmLightSizeCorrection} onChange={changeCSMLightSizeCorrection} />
                                            </Paper>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Paper className={classes.subPropertyTitle}>Depth Correction</Paper>
                                        </Grid>
                                        <Grid item xs={6} className={classes.propertyValue}>
                                            <Paper className={classes.propertyValue}>
                                                <Switch checked={csmDepthCorrection} onChange={changeCSMDepthCorrection} />
                                            </Paper>
                                        </Grid>
                                    </> }
                                </> }
                                {!this._showCSM && (shadowMapFilter === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP || shadowMapFilter === ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP) && <>
                                    <Grid item xs={6}>
                                        <Paper className={classes.subPropertyTitle}>Depth Scale</Paper>
                                    </Grid>
                                    <Grid item xs={6} className={classes.propertyValue}>
                                        <Paper className={classes.propertyValue}>
                                            <TextField type="number" value={shadowMapDepthScale} variant="standard" inputProps={{ step: "1" }} onChange={changeShadowMapDepthScale} />
                                        </Paper>
                                    </Grid>
                                </> }
                                {!this._showCSM && (shadowMapFilter === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP) && <>
                                    <Grid item xs={6}>
                                        <Paper className={classes.subPropertyTitle}>Blur Scale</Paper>
                                    </Grid>
                                    <Grid item xs={6} className={classes.propertyValue}>
                                        <Paper className={classes.propertyValue}>
                                            <PrettoSlider valueLabelDisplay="auto" defaultValue={shadowMapBlurScale} min={1} max={4} step={1} onChange={changeShadowMapBlurScale} />
                                        </Paper>
                                    </Grid>
                                </> }
                                {!this._showCSM && (shadowMapFilter === ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP || shadowMapFilter === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP) && <>
                                    <Grid item xs={6}>
                                        <Paper className={classes.subPropertyTitle}>Use Kernel Blur</Paper>
                                    </Grid>
                                    <Grid item xs={6} className={classes.propertyValue}>
                                        <Paper className={classes.propertyValue}>
                                            <Switch checked={shadowMapUseKernelBlur} onChange={changeShadowMapUseKernelBlur} />
                                        </Paper>
                                    </Grid>
                                    {shadowMapUseKernelBlur && <>
                                        <Grid item xs={6}>
                                            <Paper className={classes.subPropertyTitle}>Blur Kernel</Paper>
                                        </Grid>
                                        <Grid item xs={6} className={classes.propertyValue}>
                                            <Paper className={classes.propertyValue}>
                                                <PrettoSlider valueLabelDisplay="auto" defaultValue={shadowMapBlurKernel} min={1} max={64} step={1} onChange={changeShadowMapBlurKernel} />
                                            </Paper>
                                        </Grid>
                                    </> }
                                    {!shadowMapUseKernelBlur && <>
                                        <Grid item xs={6}>
                                            <Paper className={classes.subPropertyTitle}>Blur Box Offset</Paper>
                                        </Grid>
                                        <Grid item xs={6} className={classes.propertyValue}>
                                            <Paper className={classes.propertyValue}>
                                                <PrettoSlider valueLabelDisplay="auto" defaultValue={shadowMapBlurBoxOffset} min={1} max={64} step={1} onChange={changeShadowMapBlurBoxOffset} />
                                            </Paper>
                                        </Grid>
                                    </> }
                                </> }
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
