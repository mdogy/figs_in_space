import Phaser from 'phaser';
import { getVectorColor } from '@theme/vectorPalette';

export interface VectorExplosionConfig {
  radius?: number;
  durationMs?: number;
}

// Radial line burst with drifting fragments
export class VectorExplosion extends Phaser.GameObjects.Graphics {
  constructor(scene: Phaser.Scene, { radius = 60, durationMs = 3000 }: VectorExplosionConfig = {}) {
    super(scene);
    this.setName('VectorExplosion');
    this.drawBurst(radius);

    this.setScale(0.4);
    this.setAlpha(1);

    scene.add.existing(this);

    scene.tweens.add({
      targets: this,
      scale: { from: 0.4, to: 1.4 },
      alpha: { from: 1, to: 0 },
      duration: durationMs,
      ease: 'Cubic.easeOut',
      onComplete: () => this.destroy()
    });

    this.spawnFragments(radius, durationMs);
  }

  private drawBurst(radius: number): void {
    const color = Phaser.Display.Color.HexStringToColor(getVectorColor('accent')).color;
    this.clear();
    this.lineStyle(2, color, 1);
    const rays = 18;
    for (let i = 0; i < rays; i += 1) {
      const angle = (Math.PI * 2 * i) / rays;
      const length = radius * (0.8 + 0.4 * Math.random());
      const x = Math.cos(angle) * length;
      const y = Math.sin(angle) * length;
      this.beginPath();
      this.moveTo(0, 0);
      this.lineTo(x, y);
      this.strokePath();
    }
  }

  private spawnFragments(radius: number, durationMs: number): void {
    const fragmentCount = 10;
    for (let i = 0; i < fragmentCount; i += 1) {
      const frag = this.scene.add.graphics();
      frag.setName('ExplosionFragment');
      const color = Phaser.Display.Color.HexStringToColor(getVectorColor('primary')).color;
      frag.lineStyle(2, color, 1);
      frag.beginPath();
      frag.moveTo(-4, -2);
      frag.lineTo(4, 2);
      frag.strokePath();
      frag.setPosition(this.x, this.y);

      const angle = Math.PI * 2 * Math.random();
      const dist = radius * (0.4 + Math.random() * 0.6);
      const targetX = Math.cos(angle) * dist;
      const targetY = Math.sin(angle) * dist;

      this.scene.tweens.add({
        targets: frag,
        x: `+=${targetX}`,
        y: `+=${targetY}`,
        alpha: { from: 1, to: 0 },
        duration: durationMs,
        ease: 'Cubic.easeOut',
        onComplete: () => frag.destroy()
      });
    }
  }
}
