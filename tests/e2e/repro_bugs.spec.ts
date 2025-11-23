// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('Bug Reproduction Tests', () => {
  test('Bug 2: Demo Mode should not freeze gameplay', async ({ page }) => {
    // Go to the game page
    await page.goto('/');
    
    // Wait for the game to initialize and TitleScene to be active
    await page.waitForFunction(() => window.game?.scene.isActive('TitleScene'));

    // Wait for Demo mode to start (GameplayScene active + Demo flag)
    // The TitleScene cycles every 10 seconds. We might need to wait up to 10s.
    // However, the initial state is Title (10s) -> Demo.
    // We can fast-forward time or just wait. 
    // Let's force the state to demo via internal API to save time
    await page.evaluate(() => {
      const titleScene = window.game.scene.getScene('TitleScene') as any;
      titleScene.attractIndex = 0; // Next will be 1 (Demo)
      titleScene.attractTimer.callback(); // Force cycle
    });

    // Now GameplayScene should be active in demo mode
    await page.waitForFunction(() => window.game?.scene.isActive('GameplayScene'));
    
    // "INSERT COIN" should be visible (handled by TitleScene)
    // Let's check if the ship is moving in GameplayScene
    
    const getShipPosition = async () => {
      return await page.evaluate(() => {
        const scene = window.game.scene.getScene('GameplayScene') as any;
        if (!scene || !scene.player) return { x: 0, y: 0 };
        return { x: scene.player.x, y: scene.player.y };
      });
    };

    const pos1 = await getShipPosition();
    await page.waitForTimeout(1000); // Wait 1 second
    const pos2 = await getShipPosition();

    // If frozen, positions will be identical
    expect(pos1).not.toEqual(pos2);
    
    // Also verify "INSERT COIN" is blinking (visible/invisible toggling)
    // This is harder to test via snapshot in a short time, but we can check the text object existence
    const insertCoinVisible = await page.evaluate(() => {
      const titleScene = window.game.scene.getScene('TitleScene') as any;
      return titleScene.insertCoinText.visible;
    });
    expect(insertCoinVisible).toBe(true);
  });

  test('Bug 3: Player Lasers should destroy figs', async ({ page }) => {
    // Start with autoTest to skip intro, but we want to control the setup manually
    await page.goto('/?debug=true');
    
    // Start the game
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.game?.scene.isActive('GameplayScene'));

    // Inject a scenario: Stationary Fig and a Laser hitting it
    const result = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameplayScene') as any;
      
      // Clear existing entities
      scene.figs.forEach((f: any) => f.destroy());
      scene.figs = [];
      scene.lasers.forEach((l: any) => l.destroy());
      scene.lasers = [];

      // Spawn a Fig at center
      // scene.spawnFigs uses internal logic. Let's use it.
      
      scene.spawnFigs(1, { 
        position: { x: 400, y: 300 }, 
        radius: 40, 
        speed: 0 // Stationary
      });
      const fig = scene.figs[0];
      fig.velocity = { x: 0, y: 0 }; // Ensure stationary
      
      // Spawn a Laser right on top of it
      // We can use tryShoot but that depends on player position.
      // Let's hack the laser array.
      // We need the LaserBolt constructor. It's not globally available.
      // But we can call tryShoot if we move player to 400, 300.
      
      scene.player.setPosition(400, 300);
      scene.player.rotation = 0;
      scene.lastShotAt = 0; // Reset cooldown
      
      // Mock input to fire
      scene.keyState.space = true;
      scene.tryShoot(scene.time.now);
      scene.keyState.space = false;
      
      // Now we should have 1 fig and 1 laser colliding
      return { figCount: scene.figs.length, laserCount: scene.lasers.length };
    });

    expect(result.figCount).toBe(1);
    expect(result.laserCount).toBe(1);

    // Advance 10 frames (~160ms)
    // We can't easily step the loop from here, but we can wait.
    // The game loop is running.
    await page.waitForTimeout(200);

    // Check results
    const finalState = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameplayScene') as any;
      return { figCount: scene.figs.length, laserCount: scene.lasers.length, score: scene.score };
    });

    // If bug exists, figCount will still be 1 (laser passed through or didn't register)
    expect(finalState.figCount).toBe(0); 
    // Laser might be destroyed or not depending on logic (removeLaser is called)
    expect(finalState.laserCount).toBe(0);
    expect(finalState.score).toBeGreaterThan(0);
  });

  test('Bug 4: Player should have 10 lives and respawn after Demo transition', async ({ page }) => {
    await page.goto('/');
    
    // 1. Wait for Demo Mode
    await page.waitForFunction(() => window.game?.scene.isActive('TitleScene'));
    await page.evaluate(() => {
      const titleScene = window.game.scene.getScene('TitleScene') as any;
      titleScene.attractIndex = 0; 
      titleScene.attractTimer.callback(); // Force Demo
    });
    await page.waitForFunction(() => window.game?.scene.isActive('GameplayScene'));

    // 2. Start Real Game (press space)
    // We need to ensure we interact with the TitleScene listener or whichever scene is listening.
    // TitleScene listens for 'keydown'.
    await page.keyboard.press('Space');

    // 3. Wait for GameplayScene to restart in non-demo mode
    // We can check if 'demo' is false in the scene data or state
    await page.waitForFunction(() => {
      const scene = window.game.scene.getScene('GameplayScene') as any;
      return scene && scene.sys.settings.active && !scene.isDemoMode;
    });

    const initialState = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameplayScene') as any;
      return { lives: scene.lives, isGameOver: scene.isGameOver };
    });

    expect(initialState.lives).toBe(10);
    expect(initialState.isGameOver).toBe(false);

    // Kill the player
    await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameplayScene') as any;
      scene.handlePlayerHit(scene.time.now + 1000); 
    });

    // Check immediate state
    const afterDeathState = await page.evaluate(() => {
      const scene = window.game.scene.getScene('GameplayScene') as any;
      return { lives: scene.lives };
    });

    expect(afterDeathState.lives).toBe(9);
  });
});
