import Phaser from 'phaser';
import { getVectorColor } from '@theme/vectorPalette';
import { EnemyLaser } from './EnemyLaser';

export interface EnemySaucerConfig {
  speed?: number;
  fireIntervalMs?: number;
  direction?: 1 | -1;
  y?: number;
}

export class EnemySaucer extends Phaser.GameObjects.Graphics {
  private speed: number;
  private fireInterval: number;
  private lastShotAt = 0;
  private direction: 1 | -1;
  private wobblePhase = Math.random() * Math.PI * 2;

  constructor(scene: Phaser.Scene, config: EnemySaucerConfig = {}) {
    super(scene);
    this.setName('EnemySaucer');
    this.direction = config.direction ?? (Math.random() > 0.5 ? 1 : -1);
    this.speed = config.speed ?? 0.12;
    this.fireInterval = config.fireIntervalMs ?? 1600;

    const startY = config.y ?? Phaser.Math.Between(80, scene.game.config.height as number - 80);
    const startX = this.direction === 1 ? -40 : (scene.game.config.width as number) + 40;
    this.setPosition(startX, startY);

    this.drawSaucer();
  }

  private drawSaucer(): void {
    const color = Phaser.Display.Color.HexStringToColor(getVectorColor('hostile')).color;
    this.clear();
    this.lineStyle(2, color, 1);
    this.beginPath();
    this.moveTo(-16, 0);
    this.lineTo(16, 0);
    this.strokePath();
    this.beginPath();
    this.moveTo(-12, -6);
    this.lineTo(12, -6);
    this.lineTo(6, -12);
    this.lineTo(-6, -12);
    this.closePath();
    this.strokePath();
  }

  updateMovement(time: number, delta: number, target: { x: number; y: number }): EnemyLaser | null {
    const wobble = Math.sin(this.wobblePhase + time * 0.002) * 0.08 * delta;
    this.x += this.speed * this.direction * delta;
    this.y += wobble;

    if (time - this.lastShotAt >= this.fireInterval) {
      this.lastShotAt = time;
      const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
      const laser = new EnemyLaser(this.scene, { angle });
      laser.setPosition(this.x, this.y);
      this.scene.add.existing(laser);
      return laser;
    }

    return null;
  }

  isOffscreen(width: number, height: number): boolean {
    return this.x < -60 || this.x > width + 60 || this.y < -60 || this.y > height + 60;
  }
}
