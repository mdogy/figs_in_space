import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@prefabs/LaserBolt', () => {
  const shots: Array<{ lifespan: number }> = [];
  class LaserBolt {
    lifespan: number;
    constructor(_scene: unknown, { lifespan = 600 }: { angle: number; lifespan?: number }) {
      this.lifespan = lifespan;
      shots.push({ lifespan });
    }
    setPosition = vi.fn(() => this);
    setRotation = vi.fn(() => this);
    destroy = vi.fn();
  }
  return { LaserBolt, getLaserShots: () => shots };
});

vi.mock('@prefabs/BlackHole', () => {
  class BlackHole {
    radius: number;
    x: number;
    y: number;
    constructor(_scene: unknown, { position }: { position: { x: number; y: number } }) {
      this.radius = 60;
      this.x = position.x;
      this.y = position.y;
    }
    applyPull = vi.fn();
    destroy = vi.fn();
  }
  return { BlackHole };
});

vi.mock('@prefabs/Fig', () => {
  class Fig {
    radius: number;
    velocity = { x: 0, y: 0 };
    x = 0;
    y = 0;
    constructor(_scene: unknown, { radius = 40, position = { x: 0, y: 0 } } = {}) {
      this.radius = radius;
      this.x = position.x;
      this.y = position.y;
    }
    updateMotion = vi.fn();
    isDestroyed = vi.fn(() => false);
    destroy = vi.fn();
    setName = vi.fn();
    setPosition = vi.fn();
  }
  return { Fig };
});

import { GameplayScene } from '../../src/scenes/GameplayScene';
import { getLaserShots } from '@prefabs/LaserBolt';

describe('Gameplay progression rules', () => {
  let scene: GameplayScene;

  beforeEach(() => {
    getLaserShots().length = 0;
    scene = new GameplayScene();
    (scene as any).scene = {
      isActive: vi.fn(() => false),
      launch: vi.fn(),
      stop: vi.fn(),
      get: vi.fn(() => ({ children: { list: [] }, events: { once: vi.fn() } }))
    };
    (scene as any).add = {
      existing: vi.fn(),
      graphics: vi.fn(() => ({
        lineStyle: vi.fn(),
        strokeRect: vi.fn(),
        setDepth: vi.fn().mockReturnThis(),
        setScrollFactor: vi.fn().mockReturnThis()
      }))
    };
    (scene as any).tweens = { add: vi.fn() };
    (scene as any).time = {
      now: 0,
      delayedCall: vi.fn(() => ({ remove: vi.fn() }))
    };
    (scene as any).game = {
      events: { on: vi.fn(), off: vi.fn() },
      config: { width: 960, height: 720 }
    };
    (scene as any).scale = { width: 960, height: 720 };
    (scene as any).input = {
      keyboard: { addCapture: vi.fn(), on: vi.fn(), off: vi.fn() }
    };
    (scene as any).events = { once: vi.fn(), on: vi.fn() };
  });

  it('caps fig count and speed after level 9', () => {
    const spawnFigs = vi.fn();
    (scene as any).spawnFigs = spawnFigs;
    (scene as any).spawnBlackHoleIfNeeded = vi.fn();
    (scene as any).scheduleSaucersForLevel = vi.fn();
    (scene as any).hud = { setLevel: vi.fn() };

    (scene as any).startLevel(9);
    (scene as any).startLevel(12);

    expect(spawnFigs).toHaveBeenNthCalledWith(1, 13, {}, 1.4);
    expect(spawnFigs).toHaveBeenNthCalledWith(2, 13, {}, 1.4);
  });

  it('adds cumulative black holes every 4 levels after 9', () => {
    (scene as any).startLevel(9);
    expect((scene as any).blackHoles.length).toBe(1);

    (scene as any).startLevel(13);
    expect((scene as any).blackHoles.length).toBe(2);

    (scene as any).startLevel(17);
    expect((scene as any).blackHoles.length).toBe(3);

    (scene as any).startLevel(8);
    expect((scene as any).blackHoles.length).toBe(0);
  });

  it('increases laser lifespan every 3 levels until capped', () => {
    (scene as any).player = { x: 0, y: 0, rotation: 0 };
    (scene as any).isPlayerAlive = true;

    // Level 1 baseline
    (scene as any).keyState = { space: true };
    (scene as any).isShooting = false;
    (scene as any).level = 1;
    (scene as any).tryShoot(1000);
    expect(getLaserShots().at(-1)?.lifespan).toBe(600);

    // Higher level scaling
    (scene as any).keyState.space = true;
    (scene as any).isShooting = false;
    (scene as any).lastShotAt = 0;
    (scene as any).level = 10;
    (scene as any).tryShoot(2000);
    expect(getLaserShots().at(-1)?.lifespan).toBe(1500);

    // Cap when range already covers screen
    (scene as any).keyState.space = true;
    (scene as any).isShooting = false;
    (scene as any).lastShotAt = 0;
    (scene as any).level = 99;
    (scene as any).tryShoot(5000);
    const maxLifespan = Math.ceil(Math.hypot(960, 720) / 0.4);
    expect(getLaserShots().at(-1)?.lifespan).toBe(maxLifespan);
  });
});
