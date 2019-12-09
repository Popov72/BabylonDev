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
    Engine
} from "babylonjs";

export interface IDimensions {
    x: number;
    y: number;
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
}

export enum enumDefaultPosition {
    TOP_LEFT,
    TOP_RIGHT,
}

export default class GUI {

    public dimensions: IDimensions;

    protected _name: string;
    protected _engine: Engine;
    protected _showCloseButton: boolean;
    protected _guiElemCont: HTMLElement;
    protected _defaultPos: enumDefaultPosition;

    constructor(name: string, engine: Engine) {
        this._name = name;
        this._engine = engine;
        this._showCloseButton = true;

        this.dimensions = {
            x: 0,
            y: 0,
            width: 300,
            height: 400,
            minWidth: 100,
            minHeight: 50,
        };

        this._guiElemCont = null as any;
        this._defaultPos = enumDefaultPosition.TOP_RIGHT;
    }

    public get showCloseButton(): boolean {
        return this._showCloseButton;
    }

    public set showCloseButton(s: boolean) {
        this._showCloseButton = s;
    }

    public get defaultPosition(): enumDefaultPosition {
        return this._defaultPos;
    }

    public set defaultPosition(d: enumDefaultPosition) {
        this._defaultPos = d;
    }

    protected createGUITheme() {
        let theme = createMuiTheme({});
        theme = {
            ...theme,
            overrides: {
                MuiButton: {
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
                        [theme.breakpoints.up("lg")]: {
                            maxWidth: 'inherit'
                        },
                    }
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
                MuiGrid: {
                    "spacing-xs-1": {
                        "& > .MuiGrid-item": {
                            padding: "1px",
                        },
                    },
                },
                MuiIcon: {
                    root: {
                        'color': 'white',
                    }
                },
                MuiInputBase: {
                    input: {
                        padding: '0',
                    },
                },
                MuiListItem: {
                    root: {
                        textAlign: 'center',
                        paddingTop: '0',
                    },
                },
                MuiMenu: {
                    paper: {
                        backgroundColor: "white",
                    },
                },
                MuiPaper: {
                    root: {
                        backgroundColor: 'transparent',
                    },
                },
                MuiSelect: {
                    icon: {
                        color: "white",
                    },
                },
            },

            props: {
            }
        };

        return theme;
    }

    protected canClose(): boolean {
        return true;
    }

    protected closed(): void {
    }

    public getBounds(): { x: number, y: number, w: number, h: number } {
        return {
            x: 0,
            y: 0,
            w: this._engine.getRenderWidth(),
            h: this._engine.getRenderHeight() - 20
        };
    }

    protected handleEvent(event: Event): boolean {
        return true;
    }

    public createGUI(): void {
        const theme = this.createGUITheme();

        const GUI = () => {
            const [disableCloseButton, setDisableCloseButton] = React.useState(!this.canClose());
            const [bounds, setBounds] = React.useState({left: 0, top: 0, right: this._engine.getRenderWidth() - this.dimensions.width, bottom: this._engine.getRenderHeight() - 20 });
            const [position, setPosition] = React.useState(() => {
                let pos = { x: 2, y: 2 };

                if (this.defaultPosition == enumDefaultPosition.TOP_RIGHT) {
                    pos.x = Math.max(bounds.right - 2, bounds.left);
                }

                return  pos;
            });
            const [maxSizes, setMaxSizes] = React.useState({ maxWidth: this._engine.getRenderWidth(), maxHeight: this._engine.getRenderHeight() });
            const [size, setSize] = React.useState({ width: this.dimensions.width, height: this.dimensions.height });

            const onStopDrag = (e: DraggableEvent, data: DraggableData): void | false => {
                this.dimensions.x = data.x;
                this.dimensions.y = data.y;
                setPosition({ x: this.dimensions.x, y: this.dimensions.y });
                updateMaxSizes();
            };

            const updateBounds = (setGUIPosition: boolean = true) => {
                const sbounds = this.getBounds();
                setBounds({
                    left: sbounds.x,
                    top: sbounds.y,
                    right: sbounds.x + sbounds.w - this.dimensions.width,
                    bottom: sbounds.y + sbounds.h - 20
                });
                if (setGUIPosition) {
                    this.dimensions.x = this.defaultPosition == enumDefaultPosition.TOP_RIGHT ? Math.max(sbounds.x + sbounds.w - this.dimensions.width - 2, 0) : 2;
                    this.dimensions.y = 2;
                    setPosition({ x: this.dimensions.x, y: this.dimensions.y });
                }
            };

            const updateMaxSizes = () => {
                const sbounds = this.getBounds();
                setMaxSizes({
                    maxWidth:  Math.max(sbounds.x + sbounds.w - this.dimensions.x, 0),
                    maxHeight: Math.max(sbounds.y + sbounds.h - this.dimensions.y, 0)
                });
            };

            const onStopResize = (event: MouseEvent | TouchEvent, direction: ResizeDirection, refToElement: HTMLDivElement, delta: NumberSize) => {
                this.dimensions.width += delta.width;
                this.dimensions.height += delta.height;
                setSize({ width: this.dimensions.width, height: this.dimensions.height });
                updateMaxSizes();
                updateBounds(false);
            };

            const onResizeWindow = (event: Event) => {
                const updatePosition = this.handleEvent(event);
                updateMaxSizes();
                updateBounds(updatePosition);
            };

            React.useEffect(() => {
                const handler = (event: Event) => {
                    const updatePosition = this.handleEvent(event);
                    setDisableCloseButton(!this.canClose());
                    updateBounds(updatePosition);
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
                            minWidth={this.dimensions.minWidth}
                            minHeight={this.dimensions.minHeight}
                            maxWidth={maxSizes.maxWidth}
                            maxHeight={maxSizes.maxHeight}
                            onResizeStop={onStopResize}
                            enable={{ top: false, right: true, bottom: true, left: false, topRight: false, bottomRight: true, bottomLeft: false, topLeft: false }}
                            >

                            <Container fixed>
                                <List className="gui_title" disablePadding={true}>
                                    <ListItem>
                                        <ListItemText primary={this._name} />
                                        { this._showCloseButton &&
                                            <ListItemSecondaryAction>
                                                <IconButton edge="end" style={{ marginTop: '-12px', marginRight: '-20px'}} onClick={this.closed.bind(this)} disabled={disableCloseButton}><Icon>cancel_presentation</Icon></IconButton>
                                            </ListItemSecondaryAction>
                                        }
                                    </ListItem>
                                </List>
                                {this.createCustomGUI()}
                            </Container>

                        </Resizable>
                    </Draggable>
                </ThemeProvider>
            );
        };

        this._guiElemCont = document.createElement("div");

        jQuery(this._guiElemCont).css('position', 'absolute').css('user-select', 'none').css('top', '0').css('left', '0').css('z-index', '0');

        document.body.append(this._guiElemCont);

        ReactDOM.render(<GUI />, this._guiElemCont);
    }

    protected createCustomGUI(): React.ReactElement {
        return (
            <React.Fragment>
            </React.Fragment>
        );
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

}
