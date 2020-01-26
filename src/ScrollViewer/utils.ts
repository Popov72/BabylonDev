import {
    Button,
    Control,
    Image,
    Rectangle,
    ScrollViewer,
    StackPanel,
    TextBlock
} from "babylonjs-gui";

  import {
    chunk,
    flatMap,
    flatten,
    forEach,
    keyBy,
    map,
    random,
    reduce
  } from "lodash";
  import { DEFAULT_SCALE, RU, RU2D } from "./constants";
  import {
    IRackView3dDeviceMembersData,
    IRackViewChassisData,
    IRackViewChassisLayoutData,
    IRackViewDeviceData,
    IRackViewPlanData,
    IRackViewRackData,
    IRackViewRackPositionData,
    IRackViewRawDevice,
    IRackViewRawRack,
    IRackViewRawRackPosition,
    IRackViewRoomData
  } from "./types";

  export function randomId(label: string) {
    return `${label}-${Math.floor(Math.random() * 10000).toString(32)}`;
  }
  export const createDevice = (
    index = random(100),
    data: Partial<IRackViewRawDevice> = {}
  ): IRackViewRawDevice => {
    return {
      humanKey: randomId("node"),
      childType: "PhysicalNode",
      indexInsideContainer: 0,
      id: index,
      members: [],
      ...data
    };
  };

  export const createRack = (
    index = random(1000),
    data: Partial<IRackViewRawRack> = {}
  ): IRackViewRawRack => {
    const room = data.room || "room1";
    return {
      room,
      id: index,
      humanKey: randomId("rack"),
      height: 42,
      width: 19,
      depth: 34,
      angle: 0,
      inverted: false,
      xCoordinate: 0,
      yCoordinate: 0,
      positions: [],
      ...data
    };
  };

  export const createMany = (
    factory: (index: number) => any = createDevice,
    count: number = 10
  ) => {
    return Array.from({ length: count }, (_, index) => factory(index));
  };

  export const createChassis = (
    index = random(1000),
    data: Partial<IRackViewRawDevice> = {}
  ): IRackViewRawDevice => {
    let layout = "-2,5";
    if (data.layout) {
      layout = data.layout;
    }
    const { rows, cols } = parseChassisLayout(layout);
    const humanKey = randomId("chassis");
    const members = createMany(
      (deviceIndex) =>
        createDevice(deviceIndex, {
          humanKey: randomId("node"),
          indexInsideContainer: deviceIndex % 3
        }),
      cols * rows
    );

    return {
      ...createDevice(),
      ...data,
      members,
      layout,
      humanKey,
      childType: "Chassis"
    };
  };
  export const attachDevicesToRack = (
    rack: IRackViewRawRack,
    devices: IRackViewRawDevice[],
    { devicesPerPosition = 1, height = 1 } = {}
  ): IRackViewRawRack => {
    rack.positions = map(devices, (device, index) => {
      const p =
        typeof devicesPerPosition === "number"
          ? index % Math.round(devices.length / devicesPerPosition)
          : index;
      return {
        device,
        height,
        position: p > 0 ? p * height : p
      };
    });
    return rack;
  };

  export const createRacks = (
    index = random(100),
    {
      racks = 2,
      racksPerRow = 2,
      devicesPerRack = 20,
      devicesPerPosition = 2,
      rackHeight = 50,
      deviceHeight = 1,
      deviceFactory = createDevice,
      rackFactory = createRack
    } = {}
  ): IRackViewRawRack[] => {
    return createMany(
      (rackIndex) =>
        attachDevicesToRack(
          rackFactory(rackIndex, {
            height: rackHeight,
            room: `room-${index}`,
            xCoordinate: rackIndex % racksPerRow,
            yCoordinate: Math.floor(rackIndex / racksPerRow)
          }),
          createMany(deviceFactory, devicesPerRack),
          { devicesPerPosition, height: deviceHeight }
        ),
      racks
    );
  };

  export function createRooms({
    rooms = 1,
    racksPerRoom = 10,
    racksPerRow = 2,
    devicesPerRack = 20,
    devicesPerPosition = 2,
    rackHeight = 50,
    deviceHeight = 1,
    deviceFactory = createDevice,
    rackFactory = createRack
  } = {}): IRackViewRawRack[] {
    return flatten(
      createMany(
        (index) =>
          createRacks(index, {
            racksPerRow,
            deviceFactory,
            devicesPerPosition,
            devicesPerRack,
            rackHeight,
            deviceHeight,
            rackFactory,
            racks: racksPerRoom
          }),
        rooms
      )
    );
  }

  export function parseChassisLayout(
    chassisLayout: string,
    members?: number
  ): IRackViewChassisLayoutData {
    let cols = 3;
    let rows = Math.ceil(members! / 3) || 3;
    let layout: "H" | "V" = "H";
    if (layout) {
      layout = chassisLayout[0] === "|" ? "V" : "H";
      const dimensions = chassisLayout.substring(1).split(",");
      cols = dimensions[0] ? +dimensions[0] : cols;
      rows = dimensions[1] ? +dimensions[1] : rows;
    }
    return {
      cols,
      rows,
      layout,
      slots: cols * rows
    };
  }
  export function createSimpleButton(name: string, text: string): Button {
    const button = Button.CreateSimpleButton(name, text);
    button.pointerEnterAnimation = () => {};
    button.pointerOutAnimation = () => {};
    button.pointerUpAnimation = () => {};
    button.pointerDownAnimation = () => {};
    return button;
  }
  export function getScaledValue(value: number) {
    return value * DEFAULT_SCALE;
  }

  export function createChassisLayoutGrid(
    chassis: IRackViewRawDevice
  ): IRackViewRackPositionData[] {
    /* TODO: implement vertical layout*/
    const { cols, rows } = parseChassisLayout(
      chassis.layout as string,
      chassis.members.length
    );

    const grid: any = [];
    for (let x = 0; x < rows; x += 1) {
      grid[x] = [];
      for (let y = 0; y < cols; y += 1) {
        grid[x][y] = {
          humanKey: "EmptySlot",
          childType: "EmptySlot",
          indexInsideContainer: 0,
          entity: {},
          $members: [],
          parentSlot: 0
        };
      }
    }

    const notPositioned: any = [];
    forEach(chassis.members, (dev) => {
      const x = Math.floor(dev.indexInsideContainer / cols);
      const y = dev.indexInsideContainer % cols;
      const pos = grid[x] ? grid[x][y] : null;
      if (pos && pos.childType === "EmptySlot") {
        grid[x][y] = dev;
      } else {
        notPositioned.push(dev);
      }
    });

    const emptyPositions = flatMap(grid, (row, rowIndex) =>
      reduce(
        row,
        (all: any, dev: IRackViewRawDevice, index: number) => {
          if (dev.childType === "EmptySlot") {
            all.push({ x: rowIndex, y: index });
          }
          return all;
        },
        []
      )
    );

    forEach(
      notPositioned.sort(
        (a: any, b: any) => a.indexInsideContainer - b.indexInsideContainer
      ),
      (dev) => {
        const pos = emptyPositions.shift();
        if (pos) {
          grid[pos.x][pos.y] = dev;
        }
      }
    );

    return map(grid, (row: any, index: any) => {
      const devices = map(row, (dev: IRackViewRawDevice, i: number) => {
        dev.parentSlot = i;
        return deviceTo3d(dev);
      });
      const position = {
        devices,
        id: Date.now(),
        name: chassis.humanKey,
        height: 1,
        parentSlot: index,
        slotSize: RU
      };
      return position;
    });
  }
  export function getContainerMembers(
    device: IRackViewRawDevice
  ): IRackView3dDeviceMembersData[] {
    if (!device.members) {
      return [];
    }
    return device.members.sort((a, b) => {
      a.name = a.humanKey || a.$fkRight.humanKey;
      return a.indexInsideContainer - b.indexInsideContainer;
    });
  }

  export function deviceTo3d(device: IRackViewRawDevice): IRackViewDeviceData {
    return {
      name: device.humanKey,
      type: device.childType,
      indexInsideContainer: device.indexInsideContainer,
      id: device.id,
      powerStatus: device.powerStatus,
      members: getContainerMembers(device),
      parentSlot: (device as any).parentSlot || 0
    };
  }
  export function chassisTo3d(chassis: IRackViewRawDevice): IRackViewChassisData {
    const device = deviceTo3d(chassis) as IRackViewChassisData;
    device.layout = parseChassisLayout(chassis.layout as string, chassis.members.length);
    device.depth = 30;
    device.positions = createChassisLayoutGrid(chassis);
    return device;
  }
  export function rackTo3d(rack: IRackViewRawRack): IRackViewRackData {
    return {
      id: rack.id,
      name: rack.humanKey,
      slots: rack.height,
      width: rack.width,
      height: rack.height * RU,
      room: rack.room,
      depth: rack.depth,
      angle: rack.angle,
      inverted: rack.inverted,
      xCoordinate: rack.xCoordinate,
      yCoordinate: rack.yCoordinate,
      parentPosition: { x: 0, y: 0, z: 0, col: 0, row: 0 },
      positions: populateRackPositions(rack)
    };
  }
  export const createRackPosition = (
    rackPosition: IRackViewRawRackPosition,
    spreadedPositions: IRackViewRackPositionData[]
  ): IRackViewRackPositionData => {
    const { height, position } = rackPosition;
    let target = spreadedPositions[position];
    if (!target) {
      target = {
        height,
        parentSlot: position,
        devices: [],
        isChassis:
          rackPosition.device.childType === "Chassis" &&
          rackPosition.device.members.length > 0,
        slotSize: RU
      };

      for (let h = 0; h < rackPosition.height; h += 1) {
        if (spreadedPositions[position + h]) {
          // invalid overlap
          return null as any;
        }
      }
      for (let h = 0; h < height; h += 1) {
        spreadedPositions[position + h] = target;
      }
    }
    if (target.height !== height) {
      return null as any;
    }

    return target;
  };
  export function populateRackPositions(
    rack: IRackViewRawRack
  ): IRackViewRackPositionData[] {
    const spreadedPositions: any = [];
    const positionsHash = reduce(
      rack.positions,
      (all, rackPosition) => {
        const position = createRackPosition(rackPosition, spreadedPositions);
        if (position) {
          if (position.isChassis) {
            position.devices.push(chassisTo3d(rackPosition.device));
            (all as any)[position.parentSlot] = position;
          } else {
            const device = deviceTo3d(rackPosition.device);
            position.devices.push(device);
            (all as any)[position.parentSlot] = position;
          }
        }
        return all;
      },
      {}
    );
    const positions: IRackViewRackPositionData[] = Object.values(positionsHash);
    forEach(positions, (position) => {
      if (!position.isChassis) {
        forEach(position.devices, (device, index) => {
          device.parentSlot = index;
        });
        position.devices.sort((a, b) => {
          return a.indexInsideContainer - b.indexInsideContainer;
        });
      }
    });
    return positions;
  }

  export function racksToRooms(
    racks: IRackViewRawRack[],
    config: any
  ): IRackViewRoomData[] {
    const rooms: IRackViewRoomData[] = Object.values(
      reduce(
        racks,
        (roomsHash: Record<string, IRackViewRoomData>, rack, index) => {
          const rack3d = rackTo3d(rack);
          if (!roomsHash[rack.room]) {
            roomsHash[rack.room] = {
              id: index,
              cols: Math.max(0, rack3d.xCoordinate),
              rows: Math.max(0, rack3d.yCoordinate),
              name: rack.room,
              width: 2 * config.roomPadding,
              depth: 2 * config.roomPadding,
              height: config.roomHeight,
              racks: [rack3d],
              info: {
                maxRackWidth: 3,
                maxRackDepth: 34,
                maxRackHeight: 49
              }
            };
          } else {
            roomsHash[rack.room].racks.push(rack3d);
            roomsHash[rack.room].cols = Math.max(
              roomsHash[rack.room].cols,
              rack3d.xCoordinate
            );
            roomsHash[rack.room].rows = Math.max(
              roomsHash[rack.room].rows,
              rack3d.yCoordinate
            );
            roomsHash[rack.room].info.maxRackWidth = Math.max(
              roomsHash[rack.room].info.maxRackWidth,
              rack3d.width as number
            );
            roomsHash[rack.room].info.maxRackDepth = Math.max(
              roomsHash[rack.room].info.maxRackDepth,
              rack3d.depth as number
            );
            roomsHash[rack.room].info.maxRackHeight = Math.max(
              roomsHash[rack.room].info.maxRackHeight,
              rack3d.height as number
            );
          }
          return roomsHash;
        },
        {}
      )
    );

    forEach(rooms, (room: IRackViewRoomData) => {
      room.rows += 1;
      room.cols += 1;
      const roomGrid = Array.from({ length: room.rows }, (_, row) => {
        let rowWidth = 0;
        let lastXCoords = config.roomPadding;
        const racksRow = Array.from({ length: room.cols }, (__, col) => {
          const rack = room.racks.find(
            (r) => r.xCoordinate === col && r.yCoordinate === row
          );
          if (rack) {
            rack.parentPosition!.x = lastXCoords;
            rack.parentPosition!.col = rack.xCoordinate;
            rack.parentPosition!.row = rack.yCoordinate;
            lastXCoords +=
              ([90, 270].includes(rack.angle) ? rack.depth : rack.width) +
              config.racksSpacingX;
            rack.parentPosition!.z =
              config.roomPadding + row * (rack.depth + config.racksSpacingY);
            rowWidth +=
              ([90, 270].includes(rack.angle) ? rack.depth : rack.width) +
              config.racksSpacingX;
          }
          return rack;
        }).filter(Boolean);
        room.depth += room.info.maxRackDepth + config.racksSpacingY;
        room.height += room.info.maxRackHeight + config.racksSpacingY;
        room.width = Math.max(rowWidth, room.width as number);
        return racksRow;
      });
      (room.racks as any) = roomGrid.flat();
      if (<number>room.width < config.minRoomWidth) {
        room.width = config.minRoomWidth;
      }
      if (<number>room.depth < config.minRoomDepth) {
        room.depth = config.minRoomDepth;
      }
    });
    return rooms;
  }
  export function createPlan(
    name: string,
    rooms: IRackViewRoomData[],
    config: any
  ): IRackViewPlanData {
    const plan: IRackViewPlanData = {
      name,
      rooms
    };
    let maxRoomWidth = 10;
    let roomWidthSum = 0;
    let maxRoomDepth = 10;
    let roomWidthCumulative = 0;

    forEach(plan.rooms, (room, index) => {
      maxRoomWidth = Math.max(maxRoomWidth, room.width as number);
      roomWidthSum += room.width as number;
      maxRoomDepth = Math.max(maxRoomDepth, room.depth as number);
      room.parentPosition = {
        col: index,
        row: 0,
        x: config.planPadding + index * config.planPadding + roomWidthCumulative,
        y: 0,
        z: config.planPadding
      };
      roomWidthCumulative += room.width as number;
    });
    plan.width =
      2 * config.planPadding +
      roomWidthSum +
      config.planPadding * (plan.rooms.length - 1);
    plan.depth = 2 * config.planPadding + maxRoomDepth;
    plan.height = config.planHeight;
    return plan;
  }

  export function devicesToRacks(
    roomName: string,
    devices: IRackViewRawDevice[]
  ) {
    const devicesChunks = chunk(devices, 43);
    const racksPerRow = 2;
    return createMany(
      (index) =>
        attachDevicesToRack(
          createRack(index, {
            height: 42,
            room: roomName,
            xCoordinate: index % racksPerRow,
            yCoordinate: Math.floor(index / racksPerRow)
          }),
          devicesChunks[index],
          { devicesPerPosition: 1, height: 1 }
        ),
      devicesChunks.length
    );
  }

  const rackMargin = 10;
  const headerColor = "#424242";
  const containerColor = "#757575";
  const slotsColor = "#e0e0e0";
  const borderColor = "#bdbdbd";

  export function create2dPlan({
    id,
    depth,
    width,
    rooms
  }: IRackViewPlanData): ScrollViewer {
    const scroll = new ScrollViewer(`plan-${id}-scroll`);
    scroll.width = 1;
    scroll.height = 0.9;
    scroll.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    const plan = new Rectangle(`plan-${id}`);
    scroll.addControl(plan);
    plan.background = "";
    plan.thickness = 0;
    plan.widthInPixels = getScaledValue(width as number);
    plan.heightInPixels = getScaledValue(depth as number);
    plan.horizontalAlignment = 0;
    plan.verticalAlignment = 0;
    forEach(rooms, (roomData, index) => {
      const room = create2dRoom(roomData);
      const position = roomData.parentPosition;
      room.topInPixels = getScaledValue(position!.y) + 50;
      room.leftInPixels = getScaledValue(position!.x);
      plan.addControl(room);
    });
    return scroll;
  }

  export function create2dRoom({
    id,
    info,
    cols,
    racks
  }: IRackViewRoomData): StackPanel {
    const room = new StackPanel(`room-${id}`);
    room.isVertical = false;
    room.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    room.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    room.background = "";
    room.widthInPixels = (getScaledValue(info.maxRackWidth) + rackMargin) * cols;
    room.height = 1;
    for (let col = 0; col < cols; col += 1) {
      const colStack = new StackPanel(`room-${id}-col-${col}`);
      colStack.background = "";
      colStack.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      colStack.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
      colStack.isVertical = true;
      colStack.height = 1;
      colStack.widthInPixels = getScaledValue(info.maxRackWidth) + rackMargin;
      room.addControl(colStack);
    }
    info.maxRackWidth += RU2D;
    forEach(racks, (rackData) => {
      const [rack] = create2dRack(rackData);
      const position = rackData.parentPosition;
      const col = room.getChildByName(
        `room-${id}-col-${position!.col}`
      ) as StackPanel;
      col.addControl(rack);
    });
    return room;
  }

  export function create2dRack({
    id,
    slots,
    height,
    positions,
    width,
    name
  }: IRackViewRackData): [Rectangle, StackPanel, Rectangle] {
    const slotSize = RU2D;
    const widthInPixels = getScaledValue(width! + slotSize);
    const rack = new Rectangle(`rack-${id}`);
    rack.horizontalAlignment = Rectangle.HORIZONTAL_ALIGNMENT_LEFT;
    rack.verticalAlignment = Rectangle.VERTICAL_ALIGNMENT_TOP;
    rack.heightInPixels = getScaledValue(height! + slotSize) + rackMargin; // includes one extra slot for name
    rack.widthInPixels = widthInPixels;
    rack.color = headerColor;
    rack.thickness = 2;
    rack.paddingBottomInPixels = rackMargin;

    const rackContainer = new StackPanel(`rack-${id}-container`);
    rackContainer.isVertical = true;
    rackContainer.height = 1;
    rackContainer.widthInPixels = widthInPixels;
    rack.addControl(rackContainer);

    const rackHeader = createSimpleButton(`rack-${id}-header`, name!);
    rackHeader.background = headerColor;
    rackHeader.color = "white";
    rackHeader.thickness = 0;
    rackHeader.textBlock!.fontSize = getScaledValue(0.9);
    rackHeader.heightInPixels = getScaledValue(slotSize);
    rackHeader.width = 1;
    rackHeader.textBlock!.zIndex = 2;

    const rackStatus = new Rectangle(`rack-${id}-status`);
    rackStatus.height = 1;
    rackStatus.width = 1;
    rackStatus.thickness = 0;
    rackStatus.zIndex = 1;
    rackStatus.alpha = 0.6;
    rackHeader.addControl(rackStatus);
    rackContainer.addControl(rackHeader);

    const rackSlots = new StackPanel(`rack-${id}-slots`);
    rackSlots.width = 1;
    rackSlots.heightInPixels = getScaledValue(slotSize) * slots;
    rackSlots.isVertical = false;
    rackContainer.addControl(rackSlots);

    const rackSlotNumbers = new StackPanel(`rack-${id}-slot-numbers`);
    rackSlotNumbers.background = slotsColor;
    rackSlotNumbers.widthInPixels = getScaledValue(slotSize);
    rackSlotNumbers.height = 1;
    rackSlotNumbers.isVertical = true;
    rackSlots.addControl(rackSlotNumbers);
    for (let index = 1; index <= slots; index += 1) {
      const position = createSimpleButton(`rack-${id}-pos-${index}`, `${index}`);
      position.heightInPixels = getScaledValue(slotSize);
      position.width = 1;
      position.background = slotsColor;
      position.thickness = 0.5;
      position.color = borderColor;
      position.textBlock!.fontSize = getScaledValue(0.7);
      position.textBlock!.color = "black";
      rackSlotNumbers.addControl(position);
    }
    rackSlotNumbers.useBitmapCache = true;

    const rackPositions = new StackPanel(`rack-${id}-positions`);
    rackPositions.background = containerColor;
    rackPositions.widthInPixels = widthInPixels - rackSlotNumbers.widthInPixels;
    rackPositions.height = 1;
    rackPositions.isVertical = true;
    rackSlots.addControl(rackPositions);
    rackPositions.useBitmapCache = true;

    const rackHeight = slots * slotSize;
    const positionsHash = keyBy(positions, "parentSlot");
    let slot = 0;
    while (slot <= slots) {
      if (positionsHash[slot]) {
        const positionData = positionsHash[slot];
        positionData.width = width;
        const rackPosition = create2dRackPosition(positionData);
        rackPosition.heightInPixels =
          getScaledValue(positionData.height!) * slotSize;
        rackPositions.addControl(rackPosition);
        slot += positionData.height!;
        continue;
      } else {
        const emptyPosition = create2dRackPosition();
        emptyPosition.heightInPixels = getScaledValue(1) * slotSize;
        emptyPosition.background = "#757575";
        rackPositions.addControl(emptyPosition);
      }
      slot += 1;
    }
    return [rack, rackPositions, rackStatus];
  }

  export function create2dRackPosition(data?: IRackViewRackPositionData) {
    const position = new StackPanel(
      `rack-position-${data ? data.id : Date.now()}`
    );
    position.isVertical = false;
    position.background = slotsColor;
    position.shadowOffsetY = -2;
    position.shadowColor = borderColor;
    position.width = 1;
    if (data) {
      const { devices, width, height, depth } = data;
      const slots = devices.length;
      const slotSize = width! / slots;
      forEach(devices, (deviceData) => {
        deviceData.width = slots > 0 ? width! / slots : width;
        deviceData.height = height;
        deviceData.depth = depth;
        const [device] = create2dDevice(deviceData);
        device.widthInPixels = getScaledValue(width!) / slots;
        position.addControl(device);
      });
    }

    return position;
  }

  export function create2dDevice(
    device: IRackViewDeviceData
  ): [Rectangle, Rectangle] {
    const { id, type } = device;
    const deviceContainer = new Rectangle(`device-${id}`);
    deviceContainer.heightInPixels = getScaledValue(RU2D);
    deviceContainer.useBitmapCache = true;
    deviceContainer.shadowOffsetY = 2;
    deviceContainer.shadowOffsetX = 2;
    deviceContainer.paddingBottomInPixels = 2;
    deviceContainer.thickness = 0;
    deviceContainer.shadowColor = borderColor;
    deviceContainer.background = slotsColor;
    deviceContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    deviceContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    deviceContainer.useBitmapCache = true;

    if (type === "EmptySlot") {
      return [deviceContainer, null as any];
    }
    const deviceIcon = new Image(
      `device-${type}-icon`,
      `/textures/devices/${type}.png`
    );
    deviceIcon.width = 0.1;
    deviceIcon.height = 1;
    deviceIcon.paddingBottomInPixels = 2;
    deviceIcon.paddingLeftInPixels = 2;
    deviceIcon.paddingRightInPixels = 2;
    deviceIcon.paddingTopInPixels = 2;
    deviceIcon.zIndex = 2;
    deviceIcon.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;

    deviceContainer.addControl(deviceIcon);

    const deviceName = new TextBlock(`device-${id}-name`, device.name);
    deviceName.width = 0.9;
    deviceName.height = 1;
    deviceName.fontSize = getScaledValue(0.9);
    deviceName.zIndex = 2;
    deviceName.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    deviceName.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    deviceContainer.addControl(deviceName);

    const deviceStatus = new Rectangle(`device-${id}-status`);
    deviceStatus.width = 1;
    deviceStatus.height = 1;
    deviceStatus.zIndex = 1;
    deviceStatus.thickness = 0;
    deviceStatus.background = slotsColor;
    deviceStatus.alpha = 0.6;
    deviceContainer.addControl(deviceStatus);
    return [deviceContainer, deviceStatus];
  }
