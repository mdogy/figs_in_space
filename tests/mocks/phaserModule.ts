export class Scene {
  sys = { settings: { active: false } };
  add = {
    text: () => ({ setOrigin: () => ({ setVisible: () => ({ setAlpha: () => {} }), setDepth: () => {}, setScrollFactor: () => {} }) }),
    graphics: () => ({ lineStyle: () => {}, strokeRect: () => {}, setDepth: () => {}, setScrollFactor: () => {} }),
    existing: () => {}
  };
  scale = { width: 800, height: 600 };
  time = { now: 0, addEvent: () => ({ remove: () => {} }), delayedCall: () => {} };
  tweens = { add: () => ({ pause: () => {}, resume: () => {} }) };
  input = { keyboard: { on: () => {}, off: () => {}, addCapture: () => {}, once: () => {} } };
  events = { on: () => {}, off: () => {}, once: () => {}, emit: () => {} };
  scene = { start: () => {}, stop: () => {}, run: () => {}, bringToTop: () => {}, launch: () => {}, get: () => ({ children: { list: [] }, events: { once: () => {} }, scene: { isActive: () => true } }), isActive: () => false };
  game = { events: { on: () => {}, off: () => {} }, loop: { frame: 0 } };
  constructor() {}
}

export const AUTO = 0;

export const Math = {
  Between: () => 1,
  FloatBetween: () => 0.5,
  Distance: { Between: (x1: number, y1: number, x2: number, y2: number) => global.Math.hypot(x2 - x1, y2 - y1) },
  Angle: { Between: () => 0, Wrap: () => 0 },
  Vector2: class { x=0; y=0; constructor(x=0, y=0) { this.x=x; this.y=y; } }
};

export const Geom = {
  Line: class { setTo() {} },
  Circle: class { setTo() {} },
  Intersects: { LineToCircle: () => false }
};

export const GameObjects = {
  Graphics: class {
    x = 0;
    y = 0;
    rotation = 0;
    clear() {}
    lineStyle() {}
    beginPath() {}
    moveTo() {}
    lineTo() {}
    closePath() {}
    strokePath() {}
    setName() {}
    setPosition() {}
    setVisible() { return this; }
    add() {}
    setDepth() { return this; }
  },
  Container: class {
    x = 0;
    y = 0;
    list: any[] = [];
    add(item: any) { this.list.push(item); }
    setDepth() { return this; }
    setName() { return this; }
    setVisible() { return this; }
  },
  Text: class {
    text = '';
    constructor(_scene: any, _x: number, _y: number, text: string) { this.text = text; }
    setDepth() { return this; }
    setName() { return this; }
    setText() { return this; }
    setVisible() { return this; }
    setOrigin() { return this; }
  }
};

export const Display = {
  Color: { HexStringToColor: () => ({ color: 0 }) }
};

export const Core = {
  Events: { BLUR: 'blur' }
};

export const Input = {
  Keyboard: { KeyCodes: { LEFT: 37, RIGHT: 39, UP: 38, DOWN: 40, SPACE: 32 } }
};

export const Tweens = {
  Tween: class {}
};

export const Scenes = {
  Events: { SHUTDOWN: 'shutdown', CREATE: 'create' }
};

export default {
  Scene,
  Math,
  Geom,
  GameObjects,
  Display,
  Core,
  Input,
  Tweens,
  Scenes,
  AUTO
};
