import Phaser from 'phaser';
import { getVectorColor } from '@theme/vectorPalette';
import { GAME_DIMENSIONS } from '../game';
import { leaderboardManager, Score } from '@core/LeaderboardManager'; // Import the manager

export class GameOverScene extends Phaser.Scene {
  private score = 0;
  private isHighScore = false;
  private nameInput?: Phaser.GameObjects.Text;
  private nameText = '';
  private cursorGraphic?: Phaser.GameObjects.Graphics;
  private keyboardInput?: Phaser.Input.Keyboard.KeyboardPlugin;
  private saveScorePrompt?: Phaser.GameObjects.Text;

  constructor() {
    super('GameOverScene');
  }

  init(data: { score: number }): void {
    this.score = data.score;
    this.isHighScore = leaderboardManager.isHighScore(this.score);
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 100, 'GAME OVER', {
        fontFamily: 'Orbitron, monospace',
        fontSize: '48px',
        color: getVectorColor('danger'),
        stroke: '#000',
        strokeThickness: 6
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2, `SCORE: ${this.score}`, {
        fontFamily: 'Orbitron, monospace',
        fontSize: '32px',
        color: getVectorColor('accent'),
        stroke: '#000',
        strokeThickness: 4
      })
      .setOrigin(0.5);

    if (this.isHighScore) {
      this.saveScorePrompt = this.add
        .text(width / 2, height / 2 + 50, 'ENTER YOUR NAME:', {
          fontFamily: 'Orbitron, monospace',
          fontSize: '24px',
          color: '#FFFFFF',
          stroke: '#000',
          strokeThickness: 3
        })
        .setOrigin(0.5);

      this.nameInput = this.add
        .text(width / 2, height / 2 + 85, '_', {
          fontFamily: 'Orbitron, monospace',
          fontSize: '28px',
          color: getVectorColor('accent'),
          stroke: '#000',
          strokeThickness: 4
        })
        .setOrigin(0.5);

      this.cursorGraphic = this.add.graphics();
      this.keyboardInput = this.input.keyboard;

      this.keyboardInput?.on('keydown', this.handleNameInput, this);
      this.time.delayedCall(5000, this.finalizeScore, [], this); // Auto-save after 5 seconds
    } else {
      this.add
        .text(width / 2, height / 2 + 100, 'PRESS ENTER TO RETURN TO TITLE', {
          fontFamily: 'Orbitron, monospace',
          fontSize: '24px',
          color: '#FFFFFF',
          stroke: '#000',
          strokeThickness: 3
        })
        .setOrigin(0.5);

      this.input.keyboard.once('keydown-ENTER', () => {
        this.scene.start('TitleScene');
        this.scene.stop('GameOverScene');
      });
    }
  }

  update(): void {
    if (this.isHighScore && this.nameInput && this.cursorGraphic) {
      this.nameInput.setText(this.nameText + ((Math.floor(this.time.now / 300) % 2) ? '_' : ''));
    }
  }

  private handleNameInput(event: KeyboardEvent): void {
    if (event.key === 'Backspace' && this.nameText.length > 0) {
      this.nameText = this.nameText.slice(0, -1);
    } else if (event.key === 'Enter') {
      this.finalizeScore();
    } else if (this.nameText.length < 12 && event.key.match(/^[a-zA-Z0-9 ]$/)) {
      this.nameText += event.key.toUpperCase();
    }
  }

  private finalizeScore(): void {
    this.keyboardInput?.off('keydown', this.handleNameInput, this);
    this.time.removeAllEvents(); // Stop delayed call for auto-save

    leaderboardManager.addScore(this.score, this.nameText.trim() === '' ? undefined : this.nameText.trim());

    // Transition to show the leaderboard (will create LeaderboardScene next)
    this.scene.stop('GameOverScene');
    this.scene.start('LeaderboardScene'); // Placeholder for next scene
  }
}
