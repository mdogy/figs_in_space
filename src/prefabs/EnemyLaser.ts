import Phaser from 'phaser';
import { angleToVector } from '@core/vectorMath';
import { getVectorColor } from '@theme/vectorPalette';

export interface EnemyLaserConfig {
  angle: number;
  speed?: number;
  lifespan?: number;
}

export class EnemyLaser extends Phaser.GameObjects.Graphics {
  private velocity: Phaser.Math.Vector2;
  private lifespan: number;

  constructor(scene: Phaser.Scene, { angle, speed = 0.45, lifespan = 800 }: EnemyLaserConfig) {
    super(scene);
    this.setName('EnemyLaser');
    this.lifespan = lifespan;
    const direction = angleToVector(angle, speed);
    this.velocity = new Phaser.Math.Vector2(direction.x, direction.y);
    this.drawBolt();
  }

  private drawBolt(): void {
    const color = Phaser.Display.Color.HexStringToColor(getVectorColor('hostile')).color;
    this.clear();
    this.lineStyle(2, color, 1);
    this.beginPath();
    this.moveTo(-2, -8);
    this.lineTo(2, 8);
    this.strokePath();
  }

  updateMotion(delta: number): void {
    this.x += this.velocity.x * delta;
    this.y += this.velocity.y * delta;
    this.lifespan -= delta;
  }

  isExpired(width: number, height: number): boolean {
    const outOfBounds = this.x < -32 || this.x > width + 32 || this.y < -32 || this.y > height + 32;
    return this.lifespan <= 0 || outOfBounds;
  }
}

