import Phaser from 'phaser';
import { getVectorColor } from '@theme/vectorPalette';

export interface BlackHoleConfig {
  radius?: number;
  pullStrength?: number;
  position?: { x: number; y: number };
}

export class BlackHole extends Phaser.GameObjects.Graphics {
  public radius: number;
  public pullStrength: number;

  constructor(scene: Phaser.Scene, config: BlackHoleConfig = {}) {
    super(scene);
    this.setName('BlackHole');
    this.radius = config.radius ?? 60;
    this.pullStrength = config.pullStrength ?? 0.0002;
    const pos = config.position ?? { x: (scene.game.config.width as number) / 2, y: (scene.game.config.height as number) / 2 };
    this.setPosition(pos.x, pos.y);
    this.drawHole();
  }

  private drawHole(): void {
    const color = Phaser.Display.Color.HexStringToColor(getVectorColor('danger')).color;
    this.clear();
    this.lineStyle(2, color, 1);
    this.strokeCircle(0, 0, this.radius);
    this.strokeCircle(0, 0, this.radius * 0.6);
    this.strokeCircle(0, 0, this.radius * 0.3);
  }

  applyPull(target: { x: number; y: number }, velocity: { x: number; y: number }): void {
    const dx = this.x - target.x;
    const dy = this.y - target.y;
    const distSq = dx * dx + dy * dy;
    const dist = Math.max(Math.sqrt(distSq), 1);
    const force = this.pullStrength / dist;
    velocity.x += (dx / dist) * force;
    velocity.y += (dy / dist) * force;
  }
}
