import Phaser from 'phaser';
import { getVectorColor } from '@theme/vectorPalette';

export class HudOverlay extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene) {
    super(scene, 16, 16, 'SCORE 00000  LIVES 10  LEVEL 01', {
      fontFamily: 'Orbitron, monospace',
      fontSize: '16px',
      color: getVectorColor('primary'),
      stroke: '#000',
      strokeThickness: 2
    });
    this.setDepth(10).setName('HudOverlay');
  }

  public setScore(score: number): void {
    const safeScore = Math.max(0, Math.floor(score));
    const currentLives = this.extractLives();
    const currentLevel = this.extractLevel();
    this.setText(`SCORE ${safeScore.toString().padStart(5, '0')}  LIVES ${currentLives}  LEVEL ${currentLevel}`);
  }

  public setLives(lives: number): void {
    const safeLives = Math.max(0, Math.floor(lives));
    const currentScore = this.extractScore();
    const currentLevel = this.extractLevel();
    this.setText(`SCORE ${currentScore}  LIVES ${safeLives.toString().padStart(2, '0')}  LEVEL ${currentLevel}`);
  }

  public setLevel(level: number): void {
    const safeLevel = Math.max(1, Math.floor(level));
    const currentScore = this.extractScore();
    const currentLives = this.extractLives();
    this.setText(`SCORE ${currentScore}  LIVES ${currentLives}  LEVEL ${safeLevel.toString().padStart(2, '0')}`);
  }

  private extractScore(): string {
    const parts = this.text.split(/\s+/);
    const scorePart = parts[1] ?? '00000';
    return scorePart.padStart(5, '0');
  }

  private extractLives(): string {
    const parts = this.text.split(/\s+/);
    const livesPart = parts[3] ?? '00';
    return livesPart.padStart(2, '0');
  }

  private extractLevel(): string {
    const parts = this.text.split(/\s+/);
    const levelPart = parts[5] ?? '01';
    return levelPart.padStart(2, '0');
  }
}
