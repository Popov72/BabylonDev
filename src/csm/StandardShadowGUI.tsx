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

import SplitBaseGUI from "./SplitBaseGUI";

export default class StandardShadowGUI extends SplitBaseGUI {

    protected createCustomGUIProperties(): React.ReactElement {
        const Properties = () => {
            return (
                <>
                </>
            );
        };

        return Properties();
    }

}
