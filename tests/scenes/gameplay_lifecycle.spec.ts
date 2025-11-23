// @ts-nocheck
import { GameplayScene } from '../../src/scenes/GameplayScene';

jest.mock('../../src/prefabs/PlayerShip', () => {
    class PlayerShipStub {
        x = 0;
        y = 0;
        rotation = 0;
        active = true;
        size: number;
        constructor(_scene?: unknown, { size = 48 } = {}) {
            this.size = size;
        }
        setPosition = jest.fn((x: number, y: number) => {
            this.x = x;
            this.y = y;
            return this;
        });
        setVisible = jest.fn(() => this);
        setAlpha = jest.fn(() => this);
        setName = jest.fn(() => this);
    }
    return { PlayerShip: PlayerShipStub };
});

jest.mock('../../src/prefabs/VectorExplosion', () => {
    class VectorExplosionStub {
        setPosition = jest.fn(() => this);
        destroy = jest.fn();
    }
    return { VectorExplosion: VectorExplosionStub };
});

// Mock Phaser
const mockScene = {
    start: jest.fn(),
    stop: jest.fn(),
    launch: jest.fn(),
    get: jest.fn(() => ({
        children: { list: [] },
        events: { once: jest.fn() }
    })),
    isActive: jest.fn(() => false),
};

const mockInput = {
    keyboard: {
        addCapture: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
    }
};

// Mock the entire class
jest.mock('../../src/scenes/GameplayScene', () => {
    const actual = jest.requireActual('../../src/scenes/GameplayScene') as any;
    return {
        ...actual,
    };
});

describe('GameplayScene Lifecycle', () => {
    let scene: GameplayScene;
    let delayedCallbacks: Function[];

    beforeEach(() => {
        scene = new GameplayScene();
        delayedCallbacks = [];
        
        // Inject mocks
        (scene as any).scene = mockScene;
        (scene as any).input = mockInput;
        (scene as any).sys = { queueDepthSort: jest.fn() };
        (scene as any).add = {
            existing: jest.fn(),
            graphics: jest.fn(() => ({
                lineStyle: jest.fn(),
                strokeRect: jest.fn(),
                setDepth: jest.fn().mockReturnThis(),
                setScrollFactor: jest.fn().mockReturnThis(),
            })),
        };
        (scene as any).tweens = { add: jest.fn() };
        (scene as any).time = {
            now: 0,
            delayedCall: jest.fn((delay, callback) => {
                delayedCallbacks.push(callback);
                return { remove: jest.fn() };
            })
        };
        (scene as any).game = {
            events: { on: jest.fn(), off: jest.fn() },
            config: { width: 800, height: 600 }
        };
        (scene as any).scale = { width: 800, height: 600 };
        (scene as any).events = { once: jest.fn(), on: jest.fn() };
        (scene as any).drawReticle = jest.fn();
        (scene as any).ensureHud = jest.fn();
        (scene as any).updateHudStats = jest.fn();
        (scene as any).startLevel = jest.fn();
        
        // Mock Physics/Game Objects if necessary
        // For now, we test logic, not rendering.
    });

    it('starts with 10 lives', () => {
        scene.create();
        // Access private property for testing (using 'any' cast)
        expect((scene as any).lives).toBe(10);
    });

    it('decrements life on hit', () => {
        scene.create();
        const initialLives = (scene as any).lives;
        
        // Simulate hit
        (scene as any).handlePlayerHit(1000); // time = 1000
        
        expect((scene as any).lives).toBe(initialLives - 1);
    });

    it('does not end game after 1 hit', () => {
        scene.create();
        
        // Hit 1
        (scene as any).handlePlayerHit(1000);
        expect((scene as any).isGameOver).toBe(false);
        expect((scene as any).lives).toBe(9);
    });
    
    it('handles invulnerability correctly (ignores rapid hits)', () => {
        scene.create();
        
        // Hit 1 at t=1000
        (scene as any).handlePlayerHit(1000);
        expect((scene as any).lives).toBe(9);
        // Respawn
        delayedCallbacks.shift()?.();
        
        // Hit 2 at t=1000 (same frame/time)
        (scene as any).handlePlayerHit(1000);
        expect((scene as any).lives).toBe(9); // Should not change
        
        // Hit 3 at t=2000 (within 2s invulnerability)
        // Invulnerability is 2s (2000ms) + Respawn (750ms) = 2750ms
        // So until 1000 + 2750 = 3750
        (scene as any).handlePlayerHit(2000);
        expect((scene as any).lives).toBe(9); // Should not change
        
        // Hit 4 at t=4000 (after invulnerability)
        (scene as any).handlePlayerHit(4000);
        expect((scene as any).lives).toBe(8);
    });

    it('ends game after 10 hits', () => {
        scene.create();
        let time = 1000;
        
        for (let i = 0; i < 10; i++) {
            expect((scene as any).isGameOver).toBe(false);
            (scene as any).handlePlayerHit(time);
            // Simulate respawn between hits while lives remain
            if (delayedCallbacks.length) {
                delayedCallbacks.shift()?.();
            }
            time += 5000; // Advance time past invulnerability
        }

        // Trigger delayed GAME OVER callback
        delayedCallbacks.forEach((cb) => cb());

        expect((scene as any).lives).toBe(0);
        expect((scene as any).isGameOver).toBe(true);
        expect(mockScene.start).toHaveBeenCalledWith('GameOverScene', expect.anything());
    });
});
