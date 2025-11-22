import Phaser from 'phaser';
import { getVectorColor, VECTOR_LINE_WIDTH } from '@theme/vectorPalette';

export interface PlayerShipConfig {
  size?: number;
}

export class PlayerShip extends Phaser.GameObjects.Graphics {
  private size: number;

  constructor(scene: Phaser.Scene, { size = 24 }: PlayerShipConfig = {}) {
    super(scene);
    this.size = size;
    this.setName('PlayerShip');
    this.drawShip();
  }

  private drawShip(): void {
    this.clear();
    this.lineStyle(VECTOR_LINE_WIDTH, Phaser.Display.Color.HexStringToColor(getVectorColor('primary')).color, 1);

    const half = this.size / 2;
    this.beginPath();
    this.moveTo(half, 0);
    this.lineTo(-half, half);
    this.lineTo(-half * 0.6, 0);
    this.lineTo(-half, -half);
    this.closePath();
    this.strokePath();
  }

  public setShipSize(size: number): void {
    this.size = size;
    this.drawShip();
  }
}
