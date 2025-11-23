import Phaser from 'phaser';
import { getVectorColor } from '@theme/vectorPalette';

export class HelpOverlay extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, width: number, height: number) {
    super(scene, width / 2, height / 2);
    this.setName('HelpOverlay');
    this.setDepth(100);

    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.fillRect(-width / 2, -height / 2, width, height);
    this.add(bg);

    const title = scene.add.text(0, -200, 'CONTROLS', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '48px',
      color: getVectorColor('primary'),
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);
    this.add(title);

    const controls = [
      { key: 'UP ARROW', action: 'Thrust' },
      { key: 'DOWN ARROW', action: 'Reverse' },
      { key: 'LEFT ARROW', action: 'Rotate Left' },
      { key: 'RIGHT ARROW', action: 'Rotate Right' },
      { key: 'SPACE', action: 'Fire' },
      { key: 'Q', action: 'Quit Game' }
    ];

    controls.forEach((c, i) => {
      const y = -100 + i * 50;
      const keyText = scene.add.text(-50, y, c.key, {
        fontFamily: 'Orbitron, monospace',
        fontSize: '24px',
        color: getVectorColor('accent'),
        align: 'right'
      }).setOrigin(1, 0.5);
      
      const actionText = scene.add.text(50, y, c.action, {
        fontFamily: 'Orbitron, monospace',
        fontSize: '24px',
        color: '#FFFFFF',
        align: 'left'
      }).setOrigin(0, 0.5);

      this.add(keyText);
      this.add(actionText);
    });

    const footer = scene.add.text(0, 200, 'PRESS ANY KEY TO RESUME', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '20px',
      color: '#AAAAAA'
    }).setOrigin(0.5);
    this.add(footer);
  }
}
