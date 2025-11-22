import Phaser from 'phaser';
import { HudOverlay } from '@ui/HudOverlay';

export class HudScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HudScene', active: false });
  }

  create(): void {
    const overlay = new HudOverlay(this);
    this.add.existing(overlay);
  }
}
