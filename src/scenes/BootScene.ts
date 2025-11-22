import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.cameras.main.setBackgroundColor('#000000');
  }

  create(): void {
    this.scene.start('TitleScene');
  }
}
