import Phaser from 'phaser';
import { createVectorGameConfig } from './game';

const startGame = () => {
  const config = createVectorGameConfig();
  return new Phaser.Game(config);
};

const game = startGame();

const hot = (import.meta as unknown as { hot?: { accept: (cb: () => void) => void } }).hot;
if (hot) {
  hot.accept(() => {
    game.destroy(true);
    startGame();
  });
}
