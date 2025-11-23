import Phaser from 'phaser';
import { getVectorColor } from '@theme/vectorPalette';

export class QuitDialog extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, width: number, height: number) {
    super(scene, width / 2, height / 2);
    this.setName('QuitDialog');
    this.setDepth(100);

    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.9);
    bg.lineStyle(2, Phaser.Display.Color.HexStringToColor(getVectorColor('accent')).color);
    bg.fillRect(-300, -150, 600, 300);
    bg.strokeRect(-300, -150, 600, 300);
    this.add(bg);

    const text = scene.add.text(0, -40, 'ARE YOU SURE\nYOU WANT TO QUIT?', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '32px',
      color: '#FFFFFF',
      align: 'center'
    }).setOrigin(0.5);
    this.add(text);

    const subtext = scene.add.text(0, 60, '[Q] CONFIRM    [ANY OTHER] CANCEL', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '20px',
      color: getVectorColor('accent')
    }).setOrigin(0.5);
    this.add(subtext);
  }
}
