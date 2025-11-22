import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameplayScene } from '../../src/scenes/GameplayScene';
import { ControlMock } from '../../src/core/controlMock';
import { gameDebug } from '../../src/core/debugLogger';

// Mock Phaser
const mockScene = {
    start: vi.fn(),
    stop: vi.fn(),
    launch: vi.fn(),
    get: vi.fn(() => ({
        children: { list: [] },
        events: { once: vi.fn() }
    })),
    isActive: vi.fn(() => false),
};

const mockInput = {
    keyboard: {
        addCapture: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
    }
};

// Mock the entire class
vi.mock('../../src/scenes/GameplayScene', async () => {
    const actual = await vi.importActual('../../src/scenes/GameplayScene');
    return {
        ...actual,
        // We don't mock the class itself, we want to test it.
        // But we might need to mock internal Phaser calls if they crash.
    };
});

describe('GameplayScene Lifecycle', () => {
    let scene: GameplayScene;

    beforeEach(() => {
        scene = new GameplayScene();
        
        // Inject mocks
        (scene as any).scene = mockScene;
        (scene as any).input = mockInput;
        (scene as any).add = {
            existing: vi.fn(),
            graphics: vi.fn(() => ({
                lineStyle: vi.fn(),
                strokeRect: vi.fn(),
                setDepth: vi.fn().mockReturnThis(),
                setScrollFactor: vi.fn().mockReturnThis(),
            })),
        };
        (scene as any).tweens = { add: vi.fn() };
        (scene as any).time = {
            now: 0,
            delayedCall: vi.fn((delay, callback) => {
                // Store callback to trigger later if needed, or just ignore for now
                return { remove: vi.fn() };
            })
        };
        (scene as any).game = {
            events: { on: vi.fn(), off: vi.fn() },
            config: { width: 800, height: 600 }
        };
        (scene as any).scale = { width: 800, height: 600 };
        (scene as any).events = { once: vi.fn(), on: vi.fn() };
        
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
            time += 5000; // Advance time past invulnerability
        }
        
        expect((scene as any).lives).toBe(0);
        expect((scene as any).isGameOver).toBe(true);
        expect(mockScene.start).toHaveBeenCalledWith('GameOverScene', expect.anything());
    });
});
