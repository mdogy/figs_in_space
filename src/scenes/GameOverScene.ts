import Phaser from 'phaser';
import { getVectorColor } from '@theme/vectorPalette';
import { leaderboardManager } from '@core/LeaderboardManager';

export class GameOverScene extends Phaser.Scene {
  private score = 0;
  private isHighScore = false;
  private nameInput?: Phaser.GameObjects.Text;
  private nameText = '';
  private cursorGraphic?: Phaser.GameObjects.Graphics;
  private keyboardInput?: Phaser.Input.Keyboard.KeyboardPlugin;
  // private saveScorePrompt?: Phaser.GameObjects.Text; // Unused
  private canInteract = false;
  // private interactionTimer?: Phaser.Time.TimerEvent; // Unused reference
  // private instructionText?: Phaser.GameObjects.Text; // Unused reference
  private static readonly MAX_NAME_LENGTH = 20;

  constructor() {
    super('GameOverScene');
  }

  init(data: { score: number }): void {
    this.score = data.score;
    this.isHighScore = leaderboardManager.isHighScore(this.score);
    this.canInteract = false;
    this.nameText = '';
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

    // Wait 10 seconds before proceeding
    this.time.delayedCall(10000, this.enableInteraction, [], this);
  }

  update(): void {
    if (this.canInteract && this.isHighScore && this.nameInput && this.cursorGraphic) {
      this.updateNameDisplay();
    }
  }

  private enableInteraction(): void {
    this.canInteract = true;
    const { width, height } = this.scale;

    if (this.isHighScore) {
      this.add
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
      
      if (this.input.keyboard) {
          this.keyboardInput = this.input.keyboard;
          this.keyboardInput.on('keydown', this.handleNameInput, this);
      }
      this.updateNameDisplay();
    } else {
       // No high score, just show return prompt
       this.add
        .text(width / 2, height / 2 + 100, 'PRESS ENTER TO CONTINUE', {
          fontFamily: 'Orbitron, monospace',
          fontSize: '24px',
          color: '#FFFFFF',
          stroke: '#000',
          strokeThickness: 3
        })
        .setOrigin(0.5);
        
      if (this.input.keyboard) {
          this.input.keyboard.once('keydown-ENTER', () => {
            this.scene.start('TitleScene');
            this.scene.stop('GameOverScene');
          });
      }
      
      this.time.delayedCall(5000, () => {
          this.scene.start('TitleScene');
          this.scene.stop('GameOverScene');
      });
    }
  }

  private handleNameInput(event: KeyboardEvent): void {
    if (!this.canInteract) return;

    if (event.key === 'Backspace' && this.nameText.length > 0) {
      this.nameText = this.nameText.slice(0, -1);
    } else if (event.key === 'Enter') {
      this.finalizeScore();
    } else if (this.nameText.length < GameOverScene.MAX_NAME_LENGTH && event.key.match(/^[a-zA-Z0-9 ]$/)) {
      this.nameText += event.key.toUpperCase();
    }
    this.updateNameDisplay();
  }

  private finalizeScore(): void {
    this.keyboardInput?.off('keydown', this.handleNameInput, this);
    
    // If name is empty, use a random name
    let finalName = this.nameText.trim();
    if (finalName === '') {
        const randomNames = ['PILOT', 'ACE', 'ROOKIE', 'CADET', 'STAR', 'FIG'];
        finalName = Phaser.Utils.Array.GetRandom(randomNames) + Phaser.Math.Between(100, 999).toString();
    }

    leaderboardManager.addScore(this.score, finalName);

    // Transition to show the leaderboard (TitleScene will handle the cycle)
    this.scene.stop('GameOverScene');
    this.scene.start('TitleScene');
  }

  private updateNameDisplay(): void {
    if (!this.nameInput || typeof (this.nameInput as any).setText !== 'function') return;
    const suffix = (Math.floor(this.time.now / 300) % 2) ? '_' : '';
    this.nameInput.setText((this.nameText || '_') + suffix);
  }
}
