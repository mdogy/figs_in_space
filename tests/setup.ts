import { mockCanvas } from './mocks/canvas';
import PhaserMock from './mocks/phaserModule';

(global as any).Phaser = PhaserMock;
mockCanvas();