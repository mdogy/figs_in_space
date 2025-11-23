import Phaser from 'phaser';
import { getVectorColor } from '@theme/vectorPalette';
import { leaderboardManager } from '@core/LeaderboardManager';

export class LeaderboardScene extends Phaser.Scene {
  private attractMode = false;

  constructor() {
    super('LeaderboardScene');
  }

  init(data: { attractMode?: boolean } = {}): void {
    this.attractMode = data.attractMode ?? false;
  }

  create(): void {
    const { width, height } = this.scale;

    const scores = leaderboardManager.getScores().filter(score => score.score > 0);
    this.add.text(width / 2, height * 0.15, 'HIGH SCORES', {
      fontSize: '64px',
      color: getVectorColor('primary'),
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const startY = height * 0.3;
    const yPos = startY;

    scores.forEach((scoreEntry, index) => {
      this.add
        .text(width / 2, yPos + index * 40, `${index + 1}. ${scoreEntry.name} - ${scoreEntry.score}`, {
          fontFamily: 'Orbitron, monospace',
          fontSize: '28px',
          color: '#FFFFFF',
          stroke: '#000',
          strokeThickness: 3
        })
        .setOrigin(0.5);
    });

    if (!this.attractMode) {
      this.add
        .text(width / 2, height / 2 + 250, 'PRESS ENTER TO RETURN TO TITLE', {
          fontFamily: 'Orbitron, monospace',
          fontSize: '24px',
          color: getVectorColor('accent'),
          stroke: '#000',
          strokeThickness: 3
        })
        .setOrigin(0.5);

      if (this.input.keyboard) {
          this.input.keyboard.once('keydown-ENTER', () => {
            this.scene.start('TitleScene');
            this.scene.stop('LeaderboardScene');
          });
      }
    }
  }
}
