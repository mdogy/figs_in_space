import Phaser from 'phaser';
import { controlMock } from '@core/controlMock';

const ATTRACT_CYCLE_MS = 10000;
const INSERT_COIN_BLINK_MS = 500;

export class TitleScene extends Phaser.Scene {
  private insertCoinText?: Phaser.GameObjects.Text;
  private titleText?: Phaser.GameObjects.Text;
  private titleTween?: Phaser.Tweens.Tween;
  private blinkTimer?: Phaser.Time.TimerEvent;
  private attractTimer?: Phaser.Time.TimerEvent;
  private attractStep: Array<'title' | 'demo' | 'leaderboard'> = ['title', 'demo', 'leaderboard'];
  private attractIndex = 0;

  constructor() {
    super('TitleScene');
  }

  create(): void {
    this.drawInsertCoin();
    this.drawTitleCard();
    
    // Start in the first state (Title)
    this.showTitle();
    this.scheduleAttractCycle();

    if (this.input.keyboard) {
        this.input.keyboard.on('keydown', this.startRealGame, this);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.attractTimer?.remove();
      this.blinkTimer?.remove();
      if (this.input.keyboard) {
          this.input.keyboard.off('keydown', this.startRealGame, this);
      }
    });
  }

  private drawInsertCoin(): void {
    const { width, height } = this.scale;

    this.insertCoinText = this.add
      .text(width / 2, height / 2, 'INSERT COIN', {
        fontSize: '96px',
        color: '#FFFFFF',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  private drawTitleCard(): void {
    const { width, height } = this.scale;
    this.titleText = this.add
      .text(width / 2, height * 0.5, 'Figs in Space', {
        fontSize: '80px',
        color: '#FFFFFF',
        fontStyle: 'bold',
        stroke: '#000',
        strokeThickness: 6
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setVisible(false);

    this.titleTween = this.tweens.add({
      targets: this.titleText,
      scale: { from: 0.9, to: 1.1 },
      angle: { from: -2, to: 2 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      paused: true
    });
  }

  private startBlinkingInsertCoin(): void {
    this.blinkTimer?.remove();
    this.insertCoinText?.setVisible(true);
    this.insertCoinText?.setAlpha(1);
    this.blinkTimer = this.time.addEvent({
      delay: INSERT_COIN_BLINK_MS,
      loop: true,
      callback: () => {
        if (!this.insertCoinText) return;
        this.insertCoinText.setAlpha(this.insertCoinText.alpha > 0 ? 0 : 1);
      }
    });
  }

  private stopBlinkingInsertCoin(): void {
    this.blinkTimer?.remove();
    this.blinkTimer = undefined;
    this.insertCoinText?.setVisible(false);
    this.insertCoinText?.setAlpha(1);
  }

  private scheduleAttractCycle(): void {
    this.attractTimer?.remove();
    this.attractTimer = this.time.addEvent({
      delay: ATTRACT_CYCLE_MS,
      loop: true,
      callback: () => {
        this.attractIndex = (this.attractIndex + 1) % this.attractStep.length;
        const mode = this.attractStep[this.attractIndex];
        
        switch (mode) {
          case 'title':
            this.showTitle();
            break;
          case 'demo':
            this.showDemo();
            break;
          case 'leaderboard':
            this.showLeaderboard();
            break;
        }
      }
    });
  }

  private showTitle(): void {
    // Hide other scenes
    this.scene.stop('GameplayScene');
    this.scene.stop('LeaderboardScene');
    
    // Hide Demo UI
    this.stopBlinkingInsertCoin();
    controlMock.setEnabled(false);

    // Show Title UI
    this.titleText?.setVisible(true);
    this.titleTween?.resume();
    
    this.scene.bringToTop('TitleScene');
  }

  private showDemo(): void {
    // Hide Title UI
    this.titleText?.setVisible(false);
    this.titleTween?.pause();
    
    // Hide Leaderboard
    this.scene.stop('LeaderboardScene');

    // Launch Game in Demo Mode
    this.scene.run('GameplayScene', { demo: true });
    this.scene.bringToTop('GameplayScene');
    
    // Show Demo UI
    controlMock.setEnabled(true);
    this.startBlinkingInsertCoin();
    
    // Ensure TitleScene is on top to show "INSERT COIN"
    this.scene.bringToTop('TitleScene');
  }

  private showLeaderboard(): void {
    // Hide Demo UI
    this.stopBlinkingInsertCoin();
    controlMock.setEnabled(false);
    this.scene.stop('GameplayScene');
    
    // Hide Title UI
    this.titleText?.setVisible(false);
    this.titleTween?.pause();

    // Show Leaderboard
    this.scene.launch('LeaderboardScene', { attractMode: true });
    this.scene.bringToTop('LeaderboardScene');
    // TitleScene stays active but hidden behind or just managing logic
  }

  private startRealGame(): void {
    if (this.input.keyboard) {
        this.input.keyboard.off('keydown', this.startRealGame, this);
    }
    this.attractTimer?.remove();
    this.stopBlinkingInsertCoin();
    controlMock.setEnabled(false);
    this.scene.stop('LeaderboardScene');
    this.scene.stop('GameplayScene');
    this.scene.stop('HudScene');
    this.scene.start('GameplayScene', { demo: false });
    this.scene.launch('HudScene');
    this.scene.stop('TitleScene');
  }
}
