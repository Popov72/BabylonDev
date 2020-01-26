export interface IRackViewRoom {
    name: string;
    racks: any[];
  }
  export interface IRackViewRawRack {
    id: number;
    humanKey: string;
    room: string;
    height: number;
    width: number;
    depth: number;
    angle: number;
    inverted: boolean;
    xCoordinate: number;
    yCoordinate: number;
    positions: IRackViewRawRackPosition[];
  }

  export interface IRackViewRawDevice {
    id: number;
    humanKey: string;
    childType: string;
    indexInsideContainer: number;
    members: any[];
    parentSlot?: number;
    powerStatus?: string;
    layout?: string;
  }

  export interface IRackViewRawRackPosition {
    height: number;
    position: number;
    device: IRackViewRawDevice;
  }

  export type RackViewDirection = "left" | "right" | "up" | "down";
  export type RackViewPosition = "left" | "right" | "top" | "bottom" | "center";

  export interface IRackView3dDeviceMembersData {
    name: string;
    indexInsideContainer: number;
  }
  export type RackViewDeviceMembers =
    | IRackView3dDeviceMembersData
    | IRackViewRackPositionData;
  export interface IRackViewCoordinates {
    x: number;
    y: number;
    z: number;
    row: number;
    col: number;
  }
  export interface IRackViewObjectData {
    id?: number;
    name?: string;
    width?: number;
    height?: number;
    depth?: number;
    borderSize?: number;
    parentPosition?: IRackViewCoordinates;
  }
  export interface IRackViewDeviceData extends IRackViewObjectData {
    type: string;
    indexInsideContainer: number;
    members: RackViewDeviceMembers[];
    parentSlot: number;
    powerStatus?: string;
  }
  export interface IRackViewRackPositionData extends IRackViewObjectData {
    parentSlot: number;
    slotSize?: number;
    devices: IRackViewDeviceData[];
    isChassis?: boolean;
  }

  export interface IRackViewRackData extends IRackViewObjectData {
    slots: number;
    room: string;
    angle: number;
    inverted: boolean;
    xCoordinate: number;
    yCoordinate: number;
    positions: IRackViewRackPositionData[];
  }

  export interface IRackViewPlanData extends IRackViewObjectData {
    rooms: IRackViewRoomData[];
  }

  export interface IRackViewRoomData extends IRackViewObjectData {
    racks: IRackViewRackData[];
    info: { maxRackWidth: number; maxRackDepth: number; maxRackHeight: number };
    cols: number;
    rows: number;
  }

  export interface IRackViewChassisData extends IRackViewDeviceData {
    layout: IRackViewChassisLayoutData;
    positions: IRackViewRackPositionData[];
  }
  export interface IRackViewChassisLayoutData {
    slots: number;
    cols: number;
    rows: number;
    layout: "V" | "H";
  }
