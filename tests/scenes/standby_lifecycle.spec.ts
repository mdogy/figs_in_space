import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TitleScene } from '../../src/scenes/TitleScene';
import { GameOverScene } from '../../src/scenes/GameOverScene';

// Mock Phaser
const mockScene = {
    start: vi.fn(),
    stop: vi.fn(),
    launch: vi.fn(),
    bringToTop: vi.fn(),
    isActive: vi.fn(() => false),
    wake: vi.fn(),
    get: vi.fn(() => ({
        children: { list: [] },
        events: { once: vi.fn() }
    })),
};

vi.mock('../../src/scenes/TitleScene', async () => {
    const actual = await vi.importActual('../../src/scenes/TitleScene');
    return { ...actual };
});

vi.mock('../../src/scenes/GameOverScene', async () => {
    const actual = await vi.importActual('../../src/scenes/GameOverScene');
    return { ...actual };
});

describe('Standby Lifecycle (TitleScene)', () => {
    let scene: TitleScene;
    let timerCallback: Function = () => {};

    beforeEach(() => {
        scene = new TitleScene();
        (scene as any).scene = mockScene;
        (scene as any).add = {
            text: vi.fn(() => ({
                setOrigin: vi.fn().mockReturnThis(),
                setDepth: vi.fn().mockReturnThis(),
                setVisible: vi.fn().mockReturnThis(),
                setAlpha: vi.fn().mockReturnThis(),
                setText: vi.fn().mockReturnThis(),
            })),
        };
        (scene as any).tweens = { add: vi.fn() };
        (scene as any).input = {
            keyboard: { on: vi.fn(), off: vi.fn() }
        };
        (scene as any).scale = { width: 800, height: 600 };
        (scene as any).events = { once: vi.fn() };
        
        // Mock time event to capture callback
        (scene as any).time = {
            addEvent: vi.fn((config) => {
                // Only capture the 10s attract-cycle timer, not the blink timer
                if (config.loop && config.delay === 10000) {
                    timerCallback = config.callback;
                }
                return { remove: vi.fn() };
            }),
            delayedCall: vi.fn()
        };
    });

    it('cycles through Title -> Demo -> Leaderboard', () => {
        scene.create();
        
        // Initial state should be Title (index 0)
        expect(mockScene.stop).toHaveBeenCalledWith('GameplayScene');
        expect(mockScene.stop).toHaveBeenCalledWith('LeaderboardScene');
        // We expect 'showTitle' to have run.
        
        // Trigger timer (Title -> Demo)
        timerCallback(); 
        expect(mockScene.launch).toHaveBeenCalledWith('GameplayScene', { demo: true });
        
        // Trigger timer (Demo -> Leaderboard)
        timerCallback();
        expect(mockScene.launch).toHaveBeenCalledWith('LeaderboardScene', { attractMode: true });
        
        // Trigger timer (Leaderboard -> Title)
        timerCallback();
        // Cycle continues...
    });
});

describe('Game Over Lifecycle', () => {
    let scene: GameOverScene;
    let delayedCallback: Function;

    beforeEach(() => {
        scene = new GameOverScene();
        (scene as any).scene = mockScene;
        (scene as any).add = {
            text: vi.fn(() => ({
                setOrigin: vi.fn().mockReturnThis(),
                setDepth: vi.fn().mockReturnThis(),
                setVisible: vi.fn().mockReturnThis(),
                setText: vi.fn().mockReturnThis(),
            })),
            graphics: vi.fn(),
        };
        (scene as any).scale = { width: 800, height: 600 };
        (scene as any).input = {
            keyboard: { on: vi.fn(), once: vi.fn(), off: vi.fn() }
        };
        
        (scene as any).time = {
            delayedCall: vi.fn((delay, callback) => {
                delayedCallback = callback;
                return { remove: vi.fn() };
            }),
            removeAllEvents: vi.fn(),
            now: 1000
        };
    });

    it('waits 10 seconds before interaction', () => {
        scene.init({ score: 100 });
        scene.create();
        
        expect((scene as any).time.delayedCall).toHaveBeenCalledWith(10000, expect.any(Function), expect.anything(), expect.anything());
        expect((scene as any).canInteract).toBe(false);
        
        // Trigger timeout
        delayedCallback.call(scene);
        expect((scene as any).canInteract).toBe(true);
    });

    it('allows up to 20 character leaderboard names', () => {
        scene.init({ score: 100 });
        // Simulate high score path
        (scene as any).isHighScore = true;
        (scene as any).time.now = 0;
        (scene as any).nameInput = { setText: vi.fn() };
        (scene as any).canInteract = true;

        const letters = 'ABCDEFGHIJKLMNOPQRSTU'; // 21 chars
        letters.split('').forEach((key) => {
            (scene as any).handleNameInput({ key } as KeyboardEvent);
        });

        expect((scene as any).nameText.length).toBe(20);
        expect((scene as any).nameText).toBe('ABCDEFGHIJKLMNOPQRST');
        expect((scene as any).nameInput.setText).toHaveBeenCalled();
    });
});
