import { createVectorGameConfig, GAME_DIMENSIONS } from '../../src/game';

describe('game config', () => {
  it('creates a config with expected dimensions', () => {
    const config = createVectorGameConfig();
    expect(config.width).toBe(GAME_DIMENSIONS.width);
    expect(config.height).toBe(GAME_DIMENSIONS.height);
  });

  it('registers required scenes', () => {
    const config = createVectorGameConfig();
    expect(Array.isArray(config.scene)).toBe(true);
    const names = (config.scene as Array<new () => Phaser.Scene>).map((scene) => scene.name);
    expect(names).toEqual(expect.arrayContaining(['BootScene', 'GameplayScene', 'HudScene']));
  });
});
