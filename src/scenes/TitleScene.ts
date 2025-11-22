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
  private attractStep: Array<'demo' | 'leaderboard'> = ['demo', 'leaderboard'];
  private attractIndex = 0;

  constructor() {
    super('TitleScene');
  }

  create(): void {
    this.launchDemoScene();
    this.drawInsertCoin();
    this.drawTitleCard();
    this.startBlinkingInsertCoin();
    this.scheduleAttractCycle();

    this.input.keyboard.on('keydown', this.startRealGame, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.attractTimer?.remove();
      this.blinkTimer?.remove();
      this.input.keyboard.off('keydown', this.startRealGame, this);
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
      .setOrigin(0.5);
  }

  private drawTitleCard(): void {
    const { width, height } = this.scale;
    this.titleText = this.add
      .text(width / 2, height * 0.8, 'Figs in Space', {
        fontSize: '64px',
        color: '#FFFFFF',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setVisible(false);

    this.titleTween = this.tweens.add({
      targets: this.titleText,
      scale: { from: 0.7, to: 1.1 },
      alpha: { from: 0.4, to: 1 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      paused: true
    });
  }

  private startBlinkingInsertCoin(): void {
    this.blinkTimer?.remove();
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
        if (mode === 'demo') {
          this.showDemo();
        } else {
          this.showLeaderboard();
        }
      }
    });
  }

  private launchDemoScene(): void {
    if (this.scene.isActive('GameplayScene')) {
      this.scene.stop('GameplayScene');
    }
    this.scene.launch('GameplayScene', { demo: true });
    this.insertCoinText?.setVisible(true);
    this.startBlinkingInsertCoin();
    this.titleText?.setVisible(false);
    this.titleTween?.pause();
  }

  private showDemo(): void {
    this.scene.stop('LeaderboardScene');
    this.launchDemoScene();
  }

  private showLeaderboard(): void {
    this.stopBlinkingInsertCoin();
    this.insertCoinText?.setVisible(false);
    this.titleText?.setVisible(true);
    this.titleTween?.resume();
    controlMock.setEnabled(false);
    this.scene.stop('GameplayScene');
    this.scene.stop('LeaderboardScene');
    this.scene.launch('LeaderboardScene', { attractMode: true });
    this.scene.bringToTop('LeaderboardScene');
    this.scene.bringToTop('TitleScene');
  }

  private startRealGame(): void {
    this.input.keyboard.off('keydown', this.startRealGame, this);
    this.attractTimer?.remove();
    this.stopBlinkingInsertCoin();
    controlMock.setEnabled(false);
    this.scene.stop('LeaderboardScene');
    this.scene.stop('GameplayScene');
    this.scene.start('GameplayScene', { demo: false });
    this.scene.launch('HudScene');
    this.scene.stop('TitleScene');
  }
}
