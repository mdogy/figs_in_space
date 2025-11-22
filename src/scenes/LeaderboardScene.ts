import Phaser from 'phaser';
import { getVectorColor } from '@theme/vectorPalette';
import { GAME_DIMENSIONS } from '../game';
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

    this.add
      .text(width / 2, height / 2 - 250, 'HIGH SCORES', {
        fontFamily: 'Orbitron, monospace',
        fontSize: '48px',
        color: getVectorColor('primary'),
        stroke: '#000',
        strokeThickness: 6
      })
      .setOrigin(0.5);

    const scores = leaderboardManager.getScores().filter(score => score.score > 0);
    let yPos = height / 2 - 150;

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

      this.input.keyboard.once('keydown-ENTER', () => {
        this.scene.start('TitleScene');
        this.scene.stop('LeaderboardScene');
      });
    }
  }
}
