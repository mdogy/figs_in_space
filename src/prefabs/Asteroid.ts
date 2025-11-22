import Phaser from 'phaser';
import { angleToVector, Vector2 } from '@core/vectorMath';
import { getVectorColor, VECTOR_LINE_WIDTH } from '@theme/vectorPalette';

export interface AsteroidConfig {
  radius?: number;
  speed?: number;
  position?: Vector2;
  direction?: number;
  jaggedness?: number;
}

export class Asteroid extends Phaser.GameObjects.Graphics {
  public velocity: Phaser.Math.Vector2;
  public radius: number;
  private life: number;

  constructor(scene: Phaser.Scene, config: AsteroidConfig = {}) {
    super(scene);
    this.setName('Asteroid');
    this.radius = config.radius ?? Phaser.Math.Between(30, 60);
    const speed = config.speed ?? Phaser.Math.FloatBetween(0.02, 0.08);
    const direction = config.direction ?? Phaser.Math.FloatBetween(0, Math.PI * 2);
    const { x, y } = config.position ?? { x: this.radius, y: this.radius };
    this.setPosition(x, y);
    const velocityVector = angleToVector(direction, speed);
    this.velocity = new Phaser.Math.Vector2(velocityVector.x, velocityVector.y);
    this.life = Number.MAX_SAFE_INTEGER;
    this.drawFig();
  }

  private drawFig(): void {
    this.clear();
    const hexColor = Phaser.Display.Color.HexStringToColor(getVectorColor('accent')).color;
    this.lineStyle(VECTOR_LINE_WIDTH, hexColor, 1);

    const r = this.radius;
    const points = [
      { x: 0, y: -r * 0.85 },
      { x: r * 0.5, y: -r * 0.65 },
      { x: r * 0.8, y: -r * 0.2 },
      { x: r * 0.9, y: r * 0.25 },
      { x: r * 0.7, y: r * 0.7 },
      { x: r * 0.35, y: r * 0.95 },
      { x: 0, y: r },
      { x: -r * 0.35, y: r * 0.95 },
      { x: -r * 0.7, y: r * 0.7 },
      { x: -r * 0.9, y: r * 0.25 },
      { x: -r * 0.8, y: -r * 0.2 },
      { x: -r * 0.5, y: -r * 0.65 }
    ];

    this.beginPath();
    this.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      this.lineTo(points[i].x, points[i].y);
    }
    this.closePath();
    this.strokePath();

    // small stem at the top
    this.beginPath();
    this.moveTo(0, -r * 0.85);
    this.lineTo(0, -r * 1.05);
    this.strokePath();
  }

  updateMotion(delta: number): void {
    this.x += this.velocity.x * delta;
    this.y += this.velocity.y * delta;
    this.rotation += 0.0005 * delta;
    this.life -= delta;
  }

  isDestroyed(): boolean {
    return this.life <= 0;
  }
}
