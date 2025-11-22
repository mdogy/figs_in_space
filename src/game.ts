import { BootScene } from '@scenes/BootScene';
import { GameplayScene } from '@scenes/GameplayScene';
import { HudScene } from '@scenes/HudScene';
import { TitleScene } from '@scenes/TitleScene';
import { GameOverScene } from '@scenes/GameOverScene';
import { LeaderboardScene } from '@scenes/LeaderboardScene';

export const GAME_DIMENSIONS = {
  width: 960,
  height: 720
} as const;

export const createVectorGameConfig = (): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_DIMENSIONS.width,
  height: GAME_DIMENSIONS.height,
  backgroundColor: '#000000',
  antialias: false,
  fps: {
    target: 60,
    forceSetTimeOut: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  scene: [BootScene, TitleScene, GameplayScene, HudScene, GameOverScene, LeaderboardScene]
});
