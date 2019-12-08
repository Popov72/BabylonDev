import * as React from "react";
import * as ReactDOM from "react-dom";
import {
    Container,
    Icon,
    IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Typography,
} from '@material-ui/core';

import {
    createMuiTheme,
    ThemeProvider,
} from '@material-ui/core/styles';

import { yellow } from '@material-ui/core/colors';

import {
    Scene,
    UniversalCamera,
} from "babylonjs";

import Sample from "Sample";

export default class Split {

    protected static counter: number = 0;

    public static className: string = "Split";

    public scene:           Scene;
    public camera:          UniversalCamera;
    public name:            string;
    public isLoading:       boolean;
    public group:           number;
    public guiID:           string;
    public guiWidth:        number;

    protected _container:   Sample;

    constructor(scene: Scene, camera: UniversalCamera, parent: Sample, name: string = "default") {
        this.scene = scene;
        this.camera = camera;
        this.name = name;
        this.isLoading = false;
        this.group = 0;
        this.guiID = "splitgui_" + (Split.counter++);
        this.guiWidth = 300;
        this._container = parent;
    }

    protected createGUITheme() {
        const theme = createMuiTheme({
            spacing: 1,
            overrides: {
                MuiIcon: {
                    root: {
                        'color': 'white',
                    }
                },
                MuiContainer: {
                    fixed: {
                        padding: '0',
                        backgroundColor: '#e0e0e040',
                        position: 'absolute',
                        border: '1px solid white',
                        color: 'white',
                    },
                },
                MuiPaper: {
                    root: {
                        backgroundColor: 'transparent',
                    },
                },
                MuiExpansionPanel: {
                    root: {
                        '&$expanded': {
                            margin: '0',
                        }
                    },
                },
                MuiExpansionPanelSummary: {
                    root: {
                        padding: '0 6px 0 4px',
                        color: yellow[300],
                        backgroundColor: '#40C0FF60',
                        minHeight: 'inherit',
                        textShadow: '1px 1px black',
                        '&$expanded': {
                            minHeight: 'inherit',
                        }
                    },
                    expandIcon: {
                        padding: '2px 8px 2px 0px',
                        '&$expanded': {
                            padding: '2px 0 2px 8px',
                        }
                    },
                    content: {
                        margin: 'inherit',
                        '&$expanded': {
                            margin: 'inherit',
                        }
                    },
                },
                MuiButton: {
                },
                MuiListItem: {
                    root: {
                        textAlign: 'center',
                        paddingTop: '0',
                    }
                },
            },

            props: {
            }
        });

        return theme;
    }

    public render(): void {
        this.scene.render();
    }

    public createGUI(): void {
        const theme = this.createGUITheme();

        const GUI = () => {
            const [disableCloseButton, setDisableCloseButton] = React.useState(this._container.splitNumber === 1);
            const handleClose = () => {
                this._container.removeSplit(this);
            };
            return (
                <ThemeProvider theme={theme}>
                    <Container id={this.guiID} fixed>
                        <List className="gui_title" disablePadding={true}>
                            <ListItem>
                            <ListItemText
                                primary={this.name}
                            />
                            <ListItemSecondaryAction>
                                <IconButton edge="end" style={{ marginTop: '-12px', marginRight: '-20px'}} onClick={handleClose} disabled={disableCloseButton}>
                                    <Icon>cancel_presentation</Icon>
                                </IconButton>
                            </ListItemSecondaryAction>
                            </ListItem>
                        </List>
                        {this.createCustomGUIProperties()}
                    </Container>
                </ThemeProvider>
            );
        };

        let e = document.createElement("div");

        document.body.append(e);

        ReactDOM.render(<GUI />, e);
    }

    public showGUI(show: boolean): void {
        jQuery('#' + this.guiID).css('display', show ? 'block' : 'none');
    }

    public removeGUI(): void {
        jQuery('#' + this.guiID).remove();
    }

    protected createCustomGUIProperties(): React.ReactElement {
        return (
            <React.Fragment>
            </React.Fragment>
        );
    }
}
