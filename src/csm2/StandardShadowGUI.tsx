import * as React from "react";

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
