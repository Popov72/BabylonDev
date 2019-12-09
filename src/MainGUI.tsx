import * as React from "react";

import {
    Button,
    Grid,
    MenuItem,
    Paper,
    Select,
} from '@material-ui/core';

import {
    makeStyles,
} from '@material-ui/core/styles';

import {
    Engine,
} from "babylonjs";

import GUI, { enumDefaultPosition } from "./GUI";
import Sample, { enumSplitMode } from "./Sample";

export default class MainGUI extends GUI {

    protected _useStyles:   any;
    protected _parent:      Sample;

    constructor(name: string, engine: Engine, parent: Sample) {
        super(name, engine);

        this._parent = parent;

        this.dimensions.width = 250;
        this.dimensions.height = 184;
        this.showCloseButton = false;
        this.defaultPosition = enumDefaultPosition.TOP_LEFT;

        this._useStyles = makeStyles((theme) => ({
            propertyTitle: {
              padding: '4px 0px 4px 8px',
              textAlign: 'left',
              color: 'white',
              whiteSpace: 'nowrap',
              marginBottom: theme.spacing(0),
              textShadow: '1px 1px black',
            },
            propertyValue: {
                padding: '4px 4px 4px 4px',
                textAlign: 'left',
                color: '#00ff00',
                whiteSpace: 'nowrap',
                marginBottom: theme.spacing(0),
                backgroundColor: '#1565c060',
                textShadow: 'none',
            },
            subPropertyTitle: {
                padding: '2px 0px 2px 20px',
                textAlign: 'left',
                color: 'white',
                whiteSpace: 'nowrap',
                marginBottom: theme.spacing(0),
                textShadow: '1px 1px black',
            },
        }));
    }

    protected handleEvent(event: Event): boolean {
        return false;
    }

    protected createCustomGUI(): React.ReactElement {

        const Properties = () => {
            const classes = this._useStyles();
            const [splitLayout, setSplitLayout] = React.useState(this._parent.splitMode);
            const [splitType, setSplitType] = React.useState(this._parent.splitType);

            const changeSplitLayout = (event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>, child: React.ReactNode) => {
                this._parent.splitMode = event.target.value as number;
                setSplitLayout(this._parent.splitMode);
            };

            const changeSplitType = (event: React.ChangeEvent<{ name?: string | undefined; value: unknown }>, child: React.ReactNode) => {
                this._parent.splitType = event.target.value as string;
                setSplitType(this._parent.splitType);
            };

            return (
                <Grid container spacing={1}>
                    <Grid item xs={6}>
                        <Paper className={classes.propertyTitle}>Split layout</Paper>
                    </Grid>
                    <Grid item xs={6}>
                        <Select
                            className={classes.propertyValue}
                            id="splitlayout"
                            value={splitLayout}
                            onChange={changeSplitLayout}
                            >
                            <MenuItem value={enumSplitMode.SIDE_BY_SIDE}>Side by side</MenuItem>
                            <MenuItem value={enumSplitMode.LINEAR}>Linear</MenuItem>
                        </Select>
                    </Grid>
                    <Grid item xs={6}>
                        <Paper className={classes.propertyTitle}>Split type</Paper>
                    </Grid>
                    <Grid item xs={6}>
                        <Select
                            className={classes.propertyValue}
                            id="splittype"
                            value={splitType}
                            onChange={changeSplitType}
                            >
                            { Array.from(this._parent.splitClasses.keys()).map((name) => {
                                const stype = this._parent.splitClasses.get(name)!;
                                return (
                                    <MenuItem key={name} value={name}>{stype.className}</MenuItem>
                                );
                            }) }
                        </Select>
                    </Grid>
                    {this.createCustomGlobalGUIProperties()}
                    <Grid item xs={12} style={{ textAlign: 'center', marginTop: '8px' }}>
                        <Button variant="contained" color="primary" onClick={this._parent.createNewSplit.bind(this._parent)}>
                            Create Split
                        </Button>
                    </Grid>
                </Grid>
            );
        };

        return Properties();
    }

    protected createCustomGlobalGUIProperties(): React.ReactElement {
        return (
            <React.Fragment>
            </React.Fragment>
        );
    }

}
