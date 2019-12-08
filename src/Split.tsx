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

import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { Resizable, ResizeDirection, NumberSize } from 're-resizable';

import {
    Scene,
    UniversalCamera,
} from "babylonjs";

import Sample from "Sample";

export interface IGUIDimensions {
    x: number;
    y: number;
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
}

export default class Split {

    public static className: string = "Split";

    public scene:           Scene;
    public camera:          UniversalCamera;
    public name:            string;
    public isLoading:       boolean;
    public group:           number;

    public guiDimensions:   IGUIDimensions;
    protected _guiElemCont: HTMLElement;

    protected _container:   Sample;

    constructor(scene: Scene, camera: UniversalCamera, parent: Sample, name: string = "default") {
        this.scene = scene;
        this.camera = camera;
        this.name = name;
        this.isLoading = false;
        this.group = 0;
        this._guiElemCont = null as any;
        this.guiDimensions = {
            x: 0,
            y: 0,
            width: 300,
            height: 400,
            minWidth: 100,
            minHeight: 50,
        };
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
                        border: '1px solid white',
                        color: 'white',
                        height: '100%',
                        overflowX: 'hidden',
                        overflowY: 'auto',
                    },
                    maxWidthLg: {
                        maxWidth: 'inherit',
                        '@media (min-width: 1280px)': {
                            maxWidth: 'inherit',
                        }
                    }
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
            const [bounds, setBounds] = React.useState({left: 0, top: 0, right: this.scene.getEngine().getRenderWidth() - this.guiDimensions.width, bottom: this.scene.getEngine().getRenderHeight() - 20 });
            const [position, setPosition] = React.useState({ x: 0, y: 0 });
            const [maxSizes, setMaxSizes] = React.useState({ maxWidth: this.scene.getEngine().getRenderWidth(), maxHeight: this.scene.getEngine().getRenderHeight() });
            const [size, setSize] = React.useState({ width: this.guiDimensions.width, height: this.guiDimensions.height });

            const handleClose = () => {
                this._container.removeSplit(this);
            };

            const onStopDrag = (e: DraggableEvent, data: DraggableData): void | false => {
                this.guiDimensions.x = data.x;
                this.guiDimensions.y = data.y;
                setPosition({ x: this.guiDimensions.x, y: this.guiDimensions.y });
                updateMaxSizes();
            };

            const updateBounds = (setGUIPosition: boolean = true) => {
                const sbounds = this._container.getSplitBounds(this);
                setBounds({
                    left: sbounds.x,
                    top: sbounds.y,
                    right: sbounds.x + sbounds.w - this.guiDimensions.width,
                    bottom: sbounds.y + sbounds.h - 20
                });
                if (setGUIPosition) {
                    this.guiDimensions.x = Math.max(sbounds.x + sbounds.w - this.guiDimensions.width - 2, 0);
                    this.guiDimensions.y = 2;
                    setPosition({ x: this.guiDimensions.x, y: this.guiDimensions.y });
                }
            };

            const updateMaxSizes = () => {
                const sbounds = this._container.getSplitBounds(this);
                setMaxSizes({
                    maxWidth:  Math.max(sbounds.x + sbounds.w - this.guiDimensions.x, 0),
                    maxHeight: Math.max(sbounds.y + sbounds.h - this.guiDimensions.y, 0)
                });
            };

            const onStopResize = (event: MouseEvent | TouchEvent, direction: ResizeDirection, refToElement: HTMLDivElement, delta: NumberSize) => {
                this.guiDimensions.width += delta.width;
                this.guiDimensions.height += delta.height;
                setSize({ width: this.guiDimensions.width, height: this.guiDimensions.height });
                updateMaxSizes();
                updateBounds(false);
            };

            const onResizeWindow = () => {
                updateMaxSizes();
                updateBounds();
            };

            React.useEffect(() => {
                const handler = (event: Event) => {
                    setDisableCloseButton(this._container.splitNumber === 1);
                    updateBounds();
                    updateMaxSizes();
                };

                window.addEventListener('split_added', handler);
                window.addEventListener('split_removed', handler);
                window.addEventListener('resize', onResizeWindow);

                return () => {
                    window.removeEventListener('split_added', handler);
                    window.removeEventListener('split_removed', handler);
                    window.removeEventListener('resize', onResizeWindow);
                };
            }, []);

            return (
                <ThemeProvider theme={theme}>
                    <Draggable position={position} handle=".gui_title" bounds={bounds} onStop={onStopDrag}>
                        <Resizable
                            size={size}
                            minWidth={this.guiDimensions.minWidth}
                            minHeight={this.guiDimensions.minHeight}
                            maxWidth={maxSizes.maxWidth}
                            maxHeight={maxSizes.maxHeight}
                            onResizeStop={onStopResize}
                            enable={{ top: false, right: true, bottom: true, left: false, topRight: false, bottomRight: true, bottomLeft: false, topLeft: false }}
                            >

                            <Container fixed>
                                <List className="gui_title" disablePadding={true}>
                                    <ListItem>
                                        <ListItemText primary={this.name} />
                                        <ListItemSecondaryAction>
                                            <IconButton edge="end" style={{ marginTop: '-12px', marginRight: '-20px'}} onClick={handleClose} disabled={disableCloseButton}><Icon>cancel_presentation</Icon></IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                </List>
                                {this.createCustomGUIProperties()}
                            </Container>

                        </Resizable>
                    </Draggable>
                </ThemeProvider>
            );
        };

        this._guiElemCont = document.createElement("div");

        jQuery(this._guiElemCont).css('position', 'absolute').css('user-select', 'none').css('top', '0').css('left', '0');

        document.body.append(this._guiElemCont);

        ReactDOM.render(<GUI />, this._guiElemCont);
    }

    public showGUI(show: boolean): void {
        jQuery(this._guiElemCont).css('display', show ? 'block' : 'none');
    }

    public toggleGUI(): void {
        jQuery(this._guiElemCont).css('display', jQuery(this._guiElemCont).css('display') === 'none' ? 'block' : 'none');
    }

    public removeGUI(): void {
        ReactDOM.unmountComponentAtNode(this._guiElemCont);
        this._guiElemCont = null as any;
    }

    public setGuiPosition(x: number, y: number): void {
        jQuery(this._guiElemCont).css('left', x + 'px').css('top', y + 'px');
    }

    protected createCustomGUIProperties(): React.ReactElement {
        return (
            <React.Fragment>
            </React.Fragment>
        );
    }
}
