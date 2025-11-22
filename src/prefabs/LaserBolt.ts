import Phaser from 'phaser';
import { angleToVector } from '@core/vectorMath';
import { getVectorColor } from '@theme/vectorPalette';

export interface LaserBoltConfig {
  angle: number;
  speed?: number;
  lifespan?: number;
}

export class LaserBolt extends Phaser.GameObjects.Graphics {
  private velocity: Phaser.Math.Vector2;
  private lifespan: number;

  constructor(scene: Phaser.Scene, { angle, speed = 0.4, lifespan = 600 }: LaserBoltConfig) {
    super(scene);
    this.setName('LaserBolt');
    this.lifespan = lifespan;
    const direction = angleToVector(angle, speed);
    this.velocity = new Phaser.Math.Vector2(direction.x, direction.y);
    this.drawBolt();
  }

  private drawBolt(): void {
    const color = Phaser.Display.Color.HexStringToColor(getVectorColor('accent')).color;
    this.clear();
    this.lineStyle(2, color, 1);
    this.beginPath();
    this.moveTo(0, -6);
    this.lineTo(0, 6);
    this.strokePath();
  }

  updateMotion(delta: number): void {
    this.x += this.velocity.x * delta;
    this.y += this.velocity.y * delta;
    this.lifespan -= delta;
  }

  isExpired(width: number, height: number): boolean {
    const outOfBounds = this.x < 0 || this.x > width || this.y < 0 || this.y > height;
    return this.lifespan <= 0 || outOfBounds;
  }
}
