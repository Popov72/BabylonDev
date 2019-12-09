import * as React from "react";

import {
    Button,
    Checkbox,
    ExpansionPanel,
    ExpansionPanelDetails,
    ExpansionPanelSummary,
    Icon,
    Typography,
} from '@material-ui/core';

import SplitGUI from "../SplitGUI";

export default class SplitBaseGUI extends SplitGUI {

    protected createCustomGUI(): React.ReactElement {
        const Properties = () => {
            return (
                <React.Fragment>
                    <ExpansionPanel defaultExpanded={true}>
                        <ExpansionPanelSummary
                            expandIcon={<Icon>expand_more</Icon>}
                        >
                            <Typography>SceneControls</Typography>
                        </ExpansionPanelSummary>
                        <ExpansionPanelDetails>
                            <Button variant="contained" color="primary">
                            Hello World
                            </Button>
                        </ExpansionPanelDetails>
                    </ExpansionPanel>
                    {this.createCustomGUIProperties()}
                </React.Fragment>
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
