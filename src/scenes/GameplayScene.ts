import Phaser from 'phaser';
import { PlayerShip } from '@prefabs/PlayerShip';
import { HudOverlay } from '@ui/HudOverlay';
import { HelpOverlay } from '@ui/HelpOverlay';
import { QuitDialog } from '@ui/QuitDialog';
import { angleToVector, limitMagnitude, Vector2, wrapPosition } from '@core/vectorMath';
import { getVectorColor, VECTOR_LINE_WIDTH } from '@theme/vectorPalette';
import { GAME_DIMENSIONS } from '../game';
import { LaserBolt } from '@prefabs/LaserBolt';
import { Fig, FigConfig } from '@prefabs/Fig';
import { gameDebug } from '@core/debugLogger';
import { controlMock, ControlMock } from '@core/controlMock';
import { VectorExplosion } from '@prefabs/VectorExplosion';
import { EnemySaucer } from '@prefabs/EnemySaucer';
import { EnemyLaser } from '@prefabs/EnemyLaser';
import { BlackHole } from '@prefabs/BlackHole';

const SHOT_COOLDOWN_MS = 200;
const MAX_PLAYER_SPEED = 0.35;
const INITIAL_LIVES = 10;
const RESPAWN_DELAY_MS = 750;
const INVULNERABLE_MS = 2000;
const GAME_OVER_DELAY_MS = 1000;
const LASER_BASE_LIFESPAN_MS = 600;
const LASER_LIFESPAN_STEP_MS = 300;
const BASE_FIG_COUNT = 5;
const DEMO_STARTING_SCORE_RANGE = { min: 500, max: 4500 };
const DEMO_MAX_LEVEL = 12;
const DEMO_MIN_LIVES = 3;
const DEMO_MAX_LIVES = 10;

export class GameplayScene extends Phaser.Scene {
  private player!: PlayerShip;
  private hud?: HudOverlay;
  private helpOverlay?: HelpOverlay;
  private quitDialog?: QuitDialog;
  private lasers: LaserBolt[] = [];
  private figs: Fig[] = [];
  private saucers: EnemySaucer[] = [];
  private saucerLasers: EnemyLaser[] = [];
  private blackHoles: BlackHole[] = [];
  private playerVelocity: Vector2 = { x: 0, y: 0 };
  private lastShotAt = 0;
  private score = 0;
  private level = 1;
  private scoreMultiplier = 1;
  private automationEnabled = false;
  private keyState = {
    left: false,
    right: false,
    up: false,
    down: false,
    space: false
  };
  private inputLoggingEnabled = false;
  private lives = INITIAL_LIVES;
  private isGameOver = false;
  private invulnerableUntil = 0;
  private isDemoMode = false;
  private isPlayerAlive = true;
  private isPaused = false;
  private isHelpVisible = false;
  private isQuitDialogVisible = false;
  private helpDismissTimer?: Phaser.Time.TimerEvent;
  private isShooting = false;

  constructor() {
    super('GameplayScene');
  }

  create(data: { demo?: boolean } = {}): void {
    this.isDemoMode = data.demo ?? false;
    this.isGameOver = false;
    this.isPlayerAlive = true;
    this.isShooting = false;
    this.invulnerableUntil = 0;
    this.playerVelocity = { x: 0, y: 0 };
    this.lasers = [];
    this.figs = [];
    this.saucers = [];
    this.saucerLasers = [];
    this.blackHoles = [];
    this.lastShotAt = 0;
    this.keyState = { left: false, right: false, up: false, down: false, space: false };
    this.isPaused = false;
    this.isHelpVisible = false;
    this.isQuitDialogVisible = false;

    this.score = 0;
    this.level = 1;
    this.lives = INITIAL_LIVES;
    if (this.isDemoMode) {
      this.score = Phaser.Math.Between(DEMO_STARTING_SCORE_RANGE.min, DEMO_STARTING_SCORE_RANGE.max);
      this.level = Phaser.Math.Between(1, DEMO_MAX_LEVEL);
      this.lives = Phaser.Math.Between(DEMO_MIN_LIVES, DEMO_MAX_LIVES);
    }
    this.scoreMultiplier = 1;

    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
    this.automationEnabled = ['1', 'true', 'yes'].includes((params.get('autoTest') ?? '').toLowerCase());
    const debugRequested = ['1', 'true', 'yes'].includes((params.get('debug') ?? '').toLowerCase());
    this.inputLoggingEnabled = debugRequested || ['1', 'true', 'yes'].includes((params.get('inputLog') ?? '').toLowerCase());

    this.registerKeyboardListeners();
    this.player = new PlayerShip(this, { size: 48 });
    this.player.setPosition(GAME_DIMENSIONS.width / 2, GAME_DIMENSIONS.height / 2);
    this.add.existing(this.player);

    this.ensureHud();

    this.drawReticle();
    this.startLevel(this.level);
    this.updateHudStats();

    // Initialize UI overlays (hidden by default)
    this.helpOverlay = new HelpOverlay(this, GAME_DIMENSIONS.width, GAME_DIMENSIONS.height);
    this.add.existing(this.helpOverlay);
    this.helpOverlay.setVisible(false);

    this.quitDialog = new QuitDialog(this, GAME_DIMENSIONS.width, GAME_DIMENSIONS.height);
    this.add.existing(this.quitDialog);
    this.quitDialog.setVisible(false);

    // Show Help at start if not demo
    if (!this.isDemoMode && !this.automationEnabled) {
      this.showHelp();
    }

    // Automated testing setup (opt-in via ?autoTest=true)
    if (this.automationEnabled) {
      gameDebug.setEnabled(true);
      controlMock.setEnabled(true);
      controlMock.setSequence(ControlMock.getTestSequence('user-thrust-test'));
      console.log('[DEBUG] Starting user-thrust-test');
    } else if (this.isDemoMode) {
      controlMock.setEnabled(true); // AI will populate this
      this.hud?.setVisible(false); // Hide HUD for demo
      console.log('[DEBUG] Starting demo mode');
    } else {
      gameDebug.setEnabled(debugRequested);
      controlMock.setEnabled(false);
    }
  }

  update(time: number, delta: number): void {
    if (this.isPaused) {
      return;
    }

    if (this.isDemoMode) {
      this.updateDemoAI();
    }

    if (controlMock.isEnabled()) {
      controlMock.update(time); // Update control mock's internal timer
    }
    if (this.isGameOver) {
      this.updateLasers(delta);
      this.updateEnemyLasers(delta, time);
      this.updateSaucers(time, delta);
      this.updateFigs(delta);
      return;
    }

    this.handleInput(delta);
    this.tryShoot(time);
    this.updateLasers(delta);
    this.updateEnemyLasers(delta, time);
    this.updateSaucers(time, delta);
    this.updateFigs(delta);
    this.checkCollisions(time);
    
    // Force HUD update periodically (every 60 frames approx) to catch desyncs
    if (this.game.loop.frame % 60 === 0) {
        this.updateHudStats();
    }

    this.logDebugState(time);
  }

  private showHelp(duration?: number): void {
    this.isPaused = true;
    this.isHelpVisible = true;
    this.helpOverlay?.setVisible(true);
    this.quitDialog?.setVisible(false); // Ensure quit is hidden
    
    if (duration) {
      this.helpDismissTimer?.remove();
      this.helpDismissTimer = this.time.delayedCall(duration, () => {
        this.hideHelp();
      });
    }
  }

  private hideHelp(): void {
    this.isPaused = false;
    this.isHelpVisible = false;
    this.helpOverlay?.setVisible(false);
    this.helpDismissTimer?.remove();
    // Reset key state to avoid stuck keys
    this.resetKeyState('resume');
  }

  private showQuitDialog(): void {
    this.isPaused = true;
    this.isQuitDialogVisible = true;
    this.quitDialog?.setVisible(true);
    this.helpOverlay?.setVisible(false);
  }

  private hideQuitDialog(): void {
    this.isPaused = false;
    this.isQuitDialogVisible = false;
    this.quitDialog?.setVisible(false);
    this.resetKeyState('resume');
  }

  private handleGlobalInput(event: KeyboardEvent): void {
    const code = event.code || event.key;
    
    if (this.isHelpVisible) {
        // Any key dismisses help (unless timer is active? Req says "After 2 seconds game should resume" for unbound. 
        // But "Before game starts... listed". User might want to dismiss start screen manually.
        // Let's allow manual dismiss if NO timer is active, or just allow it always?
        // "After 2 seconds game should resume" implies automatic.
        // Let's allow manual dismiss for the Start Screen case (no timer).
        if (!this.helpDismissTimer || this.helpDismissTimer.hasDispatched) {
             this.hideHelp();
        }
        return;
    }

    if (this.isQuitDialogVisible) {
        if (code === 'KeyQ' || code === 'q' || code === 'Q') {
            // Confirm Quit
            this.scene.start('TitleScene');
            this.scene.stop('GameplayScene');
            this.scene.stop('HudScene');
        } else {
            // Cancel
            this.hideQuitDialog();
        }
        return;
    }

    if (this.isPaused) return; // Don't process other inputs if paused (and not in a dialog handled above)

    // Game Playing Input Checks
    if (code === 'KeyQ' || code === 'q' || code === 'Q') {
        this.showQuitDialog();
        return;
    }

    // Unbound Key Check
    // Bound keys: Arrows, Space
    const boundCodes = [
        'ArrowUp', 'Up', 
        'ArrowDown', 'Down', 
        'ArrowLeft', 'Left', 
        'ArrowRight', 'Right', 
        'Space', 'Spacebar', ' '
    ];

    if (!boundCodes.includes(code) && !this.isDemoMode && !this.isGameOver && this.isPlayerAlive) {
        // Unbound key pressed
        this.showHelp(2000);
    }
  }

  private handlePlayerHit(time: number): void {
    if (this.isGameOver) return;
    if (time < this.invulnerableUntil) return;
    if (!this.isPlayerAlive) return;

    console.log(`[GAMEPLAY] handlePlayerHit triggered at ${time}. Current Lives: ${this.lives}`);

    new VectorExplosion(this, { radius: 36 }).setPosition(this.player.x, this.player.y);

    this.lives = Math.max(0, this.lives - 1);
    console.log(`[GAMEPLAY] Lives decremented to: ${this.lives}`);
    
    // Immediate HUD update attempt
    if (this.hud) {
        this.hud.setLives(this.lives);
    } else {
        console.warn('[GAMEPLAY] HUD not connected during player hit!');
    }
    
    this.resetKeyState('death');
    this.playerVelocity = { x: 0, y: 0 };
    this.player.setVisible(false);
    this.isPlayerAlive = false;
    const respawnTime = time + RESPAWN_DELAY_MS;
    // Invulnerable for 2s after respawn delay (Total = RESPAWN + 2000ms)
    this.invulnerableUntil = respawnTime + INVULNERABLE_MS;

    if (this.lives <= 0) {
      console.log('[GAMEPLAY] Game Over triggered (Lives <= 0)');
      this.isGameOver = true;
      this.time.delayedCall(GAME_OVER_DELAY_MS, () => this.endGame());
      return;
    }

    console.log('[GAMEPLAY] Respawn scheduled');
    this.time.delayedCall(RESPAWN_DELAY_MS, () => {
      this.respawnPlayer(respawnTime);
    });
  }

  private handleInput(delta: number): void {
    if (!this.isPlayerAlive) return;

    // Get input state (favoring real keyboard; mock only supplements when enabled)
    const mockInput = controlMock.isEnabled() ? controlMock.getCurrentInput() : null;

    const leftPressed = (mockInput?.left ?? false) || this.keyState.left;
    const rightPressed = (mockInput?.right ?? false) || this.keyState.right;
    const upPressed = (mockInput?.up ?? false) || this.keyState.up;
    const downPressed = (mockInput?.down ?? false) || this.keyState.down;

    // Rotation: calculate net rotation from both keys
    const rotationSpeed = 0.003 * delta;
    let rotationDelta = 0;

    if (leftPressed) {
      rotationDelta -= rotationSpeed;
    }
    if (rightPressed) {
      rotationDelta += rotationSpeed;
    }

    this.player.rotation += rotationDelta;

    // Thrusting - forward thrust adds velocity in direction ship is facing
    if (upPressed) {
      const thrustVector = angleToVector(this.player.rotation, 0.0005 * delta);
      this.playerVelocity.x += thrustVector.x;
      this.playerVelocity.y += thrustVector.y;
      this.playerVelocity = limitMagnitude(this.playerVelocity, MAX_PLAYER_SPEED);
    }

    // Reverse thrust - subtracts velocity in direction ship is facing
    if (downPressed) {
      const thrustVector = angleToVector(this.player.rotation, 0.0005 * delta);
      this.playerVelocity.x -= thrustVector.x;
      this.playerVelocity.y -= thrustVector.y;
      this.playerVelocity = limitMagnitude(this.playerVelocity, MAX_PLAYER_SPEED);
    }

    this.blackHoles.forEach((hole) => hole.applyPull(this.player, this.playerVelocity));

    // Apply slight drag
    this.playerVelocity.x *= 0.995;
    this.playerVelocity.y *= 0.995;

    // Update position based on velocity
    this.player.x += this.playerVelocity.x * delta;
    this.player.y += this.playerVelocity.y * delta;

    // Wrap around screen edges
    this.player.x = wrapPosition(this.player.x, GAME_DIMENSIONS.width);
    this.player.y = wrapPosition(this.player.y, GAME_DIMENSIONS.height);
  }

  private tryShoot(time: number): void {
    if (!this.isPlayerAlive) return;

    // Get shoot state (from mock or real keyboard)
    const mockInput = controlMock.isEnabled() ? controlMock.getCurrentInput() : null;
    const shootPressed = (mockInput?.space ?? false) || this.keyState.space;

    // Require key release between shots
    if (!shootPressed) {
      this.isShooting = false;
      return;
    }

    if (this.isShooting) {
      return;
    }

    // Check cooldown
    if (time - this.lastShotAt < SHOT_COOLDOWN_MS) {
      return;
    }

    // Fire!
    this.lastShotAt = time;
    this.isShooting = true;

    // Calculate muzzle position at the nose of the ship
    // Ship is drawn pointing RIGHT (positive X) at rotation = 0
    // The nose is at (half, 0) in local coordinates = 24 pixels to the right
    const muzzleAngle = this.player.rotation;
    const shipNoseOffset = 24; // Half the ship size (48/2)
    const muzzleX = this.player.x + Math.cos(muzzleAngle) * shipNoseOffset;
    const muzzleY = this.player.y + Math.sin(muzzleAngle) * shipNoseOffset;

    const rangeTier = Math.max(0, Math.floor((this.level - 1) / 3));
    const maxLifespan = Math.ceil(Math.hypot(GAME_DIMENSIONS.width, GAME_DIMENSIONS.height) / 0.4);
    const lifespan = Math.min(
      LASER_BASE_LIFESPAN_MS + rangeTier * LASER_LIFESPAN_STEP_MS,
      maxLifespan
    );

    const bolt = new LaserBolt(this, { angle: muzzleAngle, lifespan });
    bolt.setPosition(muzzleX, muzzleY);
    bolt.setRotation(muzzleAngle + Math.PI / 2); // Rotate the bolt to face the direction of travel
    this.add.existing(bolt);
    this.lasers.push(bolt);
  }

  private updateLasers(delta: number): void {
    this.lasers.forEach((laser) => laser.updateMotion(delta));
    this.lasers = this.lasers.filter((laser) => {
      if (laser.isExpired(GAME_DIMENSIONS.width, GAME_DIMENSIONS.height)) {
        laser.destroy();
        return false;
      }
      return true;
    });
  }

  private updateFigs(delta: number): void {
    this.figs.forEach((fig) => {
      fig.updateMotion(delta);
      this.blackHoles.forEach((hole) => hole.applyPull(fig, fig.velocity));
      fig.x = wrapPosition(fig.x, GAME_DIMENSIONS.width);
      fig.y = wrapPosition(fig.y, GAME_DIMENSIONS.height);
    });
    this.figs = this.figs.filter((fig) => {
      if (fig.isDestroyed()) {
        fig.destroy();
        return false;
      }
      return true;
    });

    this.handleFigCollisions();

    if (this.figs.length === 0) {
      // Clear remaining saucers before next level
      this.saucers.forEach(s => s.destroy());
      this.saucers = [];
      this.saucerLasers.forEach(l => l.destroy());
      this.saucerLasers = [];
      this.startLevel(this.level + 1);
    }
  }

  private handleFigCollisions(): void {
    const splits = new Set<number>();

    for (let i = 0; i < this.figs.length; i += 1) {
      for (let j = i + 1; j < this.figs.length; j += 1) {
        const a = this.figs[i];
        const b = this.figs[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        const minDist = a.radius + b.radius;
        if (distSq <= minDist * minDist) {
          this.resolveFigBounce(a, b);
          if (a.radius > 32) splits.add(i);
          if (b.radius > 32) splits.add(j);
        }
      }
    }

    // Split after processing collisions to avoid index churn mid-loop
    const indices = Array.from(splits).sort((a, b) => b - a);
    indices.forEach(index => this.splitFigNoScore(index));
  }

  private resolveFigBounce(a: Fig, b: Fig): void {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.max(Math.hypot(dx, dy), 0.0001);
    const nx = dx / distance;
    const ny = dy / distance;

    const p = 2 * (a.velocity.x * nx + a.velocity.y * ny - b.velocity.x * nx - b.velocity.y * ny) /
      (a.radius + b.radius);

    a.velocity.x = a.velocity.x - p * b.radius * nx;
    a.velocity.y = a.velocity.y - p * b.radius * ny;
    b.velocity.x = b.velocity.x + p * a.radius * nx;
    b.velocity.y = b.velocity.y + p * a.radius * ny;

    // Push them apart slightly to avoid sticking
    const overlap = (a.radius + b.radius) - distance + 0.1;
    a.x -= nx * overlap * 0.5;
    a.y -= ny * overlap * 0.5;
    b.x += nx * overlap * 0.5;
    b.y += ny * overlap * 0.5;
  }

  private splitFigNoScore(index: number): void {
    const fig = this.figs[index];
    if (!fig) return;
    const radius = fig.radius;
    fig.destroy();
    this.figs.splice(index, 1);

    if (radius > 28) {
      const fragments = Phaser.Math.Between(2, 3);
      for (let i = 0; i < fragments; i += 1) {
        this.spawnFigs(1, {
          radius: radius * 0.6,
          position: { x: fig.x, y: fig.y }
        });
      }
    }
  }

  private checkCollisions(time: number): void {
    for (let laserIndex = this.lasers.length - 1; laserIndex >= 0; laserIndex -= 1) {
      const laser = this.lasers[laserIndex];
      for (let figIndex = this.figs.length - 1; figIndex >= 0; figIndex -= 1) {
        const fig = this.figs[figIndex];
        
        // Simple distance check with generous buffer for laser length
        const distance = Phaser.Math.Distance.Between(laser.x, laser.y, fig.x, fig.y);
        const collisionThreshold = fig.radius + 16; // Radius + approx laser length/2 + slop

        if (distance <= collisionThreshold) {
          console.log(`[GAMEPLAY] Hit! Laser at ${Math.round(laser.x)},${Math.round(laser.y)} vs Fig at ${Math.round(fig.x)},${Math.round(fig.y)} Dist:${Math.round(distance)}`);
          this.splitFig(fig, figIndex);
          this.removeLaser(laserIndex);
          break;
        }
      }
    }

    this.figs.forEach((fig) => {
      const distanceToPlayer = Phaser.Math.Distance.Between(this.player.x, this.player.y, fig.x, fig.y);
      const playerRadius = 24; // Ship size is 48; use half as collision radius
      if (this.isPlayerAlive && distanceToPlayer <= fig.radius + playerRadius) {
        this.handlePlayerHit(time);
      }
    });

    if (this.isPlayerAlive) {
      this.blackHoles.forEach((hole) => {
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, hole.x, hole.y);
        if (distance <= hole.radius) {
          this.handlePlayerHit(time);
        }
      });
    }
  }



  private respawnPlayer(respawnAt: number): void {
    this.player.setPosition(GAME_DIMENSIONS.width / 2, GAME_DIMENSIONS.height / 2);
    this.player.rotation = 0;
    this.playerVelocity = { x: 0, y: 0 };
    this.player.setVisible(true).setAlpha(0.35);
    this.invulnerableUntil = respawnAt + INVULNERABLE_MS;
    this.isPlayerAlive = true;

    this.tweens.add({
      targets: this.player,
      alpha: { from: 0.35, to: 1 },
      duration: INVULNERABLE_MS,
      ease: 'Sine.easeInOut',
      yoyo: false,
      onComplete: () => {
        this.player.setAlpha(1);
        this.invulnerableUntil = 0;
      }
    });
  }

  private endGame(): void {
    this.isGameOver = true;
    controlMock.setEnabled(false);
    this.player.setVisible(false);
    this.scene.stop('HudScene');
    if (!this.isDemoMode) {
      // If not in demo mode, proceed to game over screen with score
      this.scene.start('GameOverScene', { score: this.score });
    } else {
      // In demo mode, just stop the scene and let TitleScene restart it
      this.scene.stop('GameplayScene');
    }
  }

  private updateDemoAI(): void {
    if (!this.player || !this.player.active) {
        controlMock.setInput({ left: false, right: false, up: false, space: false });
        return;
    }

    // Find the closest target (fig or saucer)
    let closestTarget: { x: number, y: number, dist: number } | null = null;
    let minDistance = Number.MAX_VALUE;

    // Check figs
    for (const fig of this.figs) {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, fig.x, fig.y);
        if (d < minDistance) {
            minDistance = d;
            closestTarget = { x: fig.x, y: fig.y, dist: d };
        }
    }

    // Check saucers (prioritize saucers if close)
    for (const saucer of this.saucers) {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, saucer.x, saucer.y);
        if (d < minDistance * 0.8) { // 20% bias towards saucers
            minDistance = d;
            closestTarget = { x: saucer.x, y: saucer.y, dist: d };
        }
    }

    const input = { left: false, right: false, up: true, space: false };

    if (closestTarget) {
        const angleToTarget = Phaser.Math.Angle.Between(this.player.x, this.player.y, closestTarget.x, closestTarget.y);
        const angleDifference = Phaser.Math.Angle.Wrap(angleToTarget - this.player.rotation);
        const absAngleDiff = Math.abs(angleDifference);

        // Aggressive behavior:
        // Always thrusting (up = true default above).
        // Shoot frequently if roughly aligned.
        if (absAngleDiff < 0.5 && Math.random() < 0.3) {
            input.space = true;
        }

        // Evasion if too close
        if (minDistance < 120) {
            input.up = true; 
            // Turn sharply away
            if (angleDifference > 0) input.left = true;
            else input.right = true;
            
            // Panic fire
            input.space = true;
        } else {
            // Pursue
            if (absAngleDiff > 0.1) {
                if (angleDifference > 0) input.right = true;
                else input.left = true;
            }
            
            // Don't thrust into things, but keep moving
            if (minDistance < 250 && absAngleDiff < 0.5) {
                input.up = false; // Coast if aiming at target
            }
        }
    } else {
        // Roam freely
        if (Math.random() < 0.05) {
             if (Math.random() > 0.5) input.right = true;
             else input.left = true;
        }
    }
    
    controlMock.setInput(input);
  }

  private splitFig(hitFig: Fig, figIndex: number): void {
    const baseScore = Math.max(10, Math.round(hitFig.radius));
    this.score += Math.round(baseScore * this.scoreMultiplier);
    this.hud?.setScore(this.score);
    const radius = hitFig.radius;
    hitFig.destroy();
    this.figs.splice(figIndex, 1);

    if (radius > 28) {
      const fragments = Phaser.Math.Between(2, 3);
      for (let i = 0; i < fragments; i += 1) {
        this.spawnFigs(1, {
          radius: radius * 0.6,
          position: { x: hitFig.x, y: hitFig.y }
        });
      }
    }
  }

  private removeLaser(index: number): void {
    const [laser] = this.lasers.splice(index, 1);
    laser?.destroy();
  }

  private drawReticle(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(VECTOR_LINE_WIDTH, Phaser.Display.Color.HexStringToColor(getVectorColor('accent')).color, 0.3);
    const padding = 32;
    graphics.strokeRect(padding, padding, GAME_DIMENSIONS.width - padding * 2, GAME_DIMENSIONS.height - padding * 2);
    graphics.setDepth(-1).setScrollFactor(0);
  }

  private spawnFigs(count: number, overrides: Partial<FigConfig> = {}, speedMultiplier = 1): void {
    for (let i = 0; i < count; i += 1) {
      const edge = Phaser.Math.Between(0, 3);
      const position = overrides.position ?? this.randomEdgePosition(edge);
      const baseSpeed = overrides.speed ?? Phaser.Math.FloatBetween(0.02, 0.08);
      const fig = new Fig(this, {
        radius: overrides.radius ?? Phaser.Math.Between(35, 60),
        position,
        direction: Phaser.Math.FloatBetween(0, Math.PI * 2),
        speed: baseSpeed * speedMultiplier
      });
      this.figs.push(fig);
      this.add.existing(fig);
    }
  }

  private randomEdgePosition(edgeIndex: number): Vector2 {
    switch (edgeIndex) {
      case 0:
        return { x: Phaser.Math.Between(0, GAME_DIMENSIONS.width), y: 0 };
      case 1:
        return { x: GAME_DIMENSIONS.width, y: Phaser.Math.Between(0, GAME_DIMENSIONS.height) };
      case 2:
        return { x: Phaser.Math.Between(0, GAME_DIMENSIONS.width), y: GAME_DIMENSIONS.height };
      default:
        return { x: 0, y: Phaser.Math.Between(0, GAME_DIMENSIONS.height) };
    }
  }

  private startLevel(level: number): void {
    this.level = level;
    this.scoreMultiplier = 1 + (level - 1) * 0.25;
    const cappedLevel = Math.min(level, 9);
    const figCount = BASE_FIG_COUNT + (cappedLevel - 1);
    const speedMultiplier = 1 + (cappedLevel - 1) * 0.05;
    this.spawnFigs(figCount, {}, speedMultiplier);
    this.hud?.setLevel(this.level);
    this.spawnBlackHoleIfNeeded();
    this.spawnSaucersForLevel();
  }

  private spawnSaucersForLevel(): void {
    if (this.level < 3) return;
    const count = 1 + Math.floor((this.level - 3) / 2);
    for (let i = 0; i < count; i += 1) {
       this.spawnSaucer();
    }
  }

  private spawnSaucer(): void {
    const speed = 0.12 + 0.01 * this.level;
    const fireInterval = Math.max(600, 1600 - this.level * 80);
    const saucer = new EnemySaucer(this, { speed, fireIntervalMs: fireInterval });
    this.saucers.push(saucer);
    this.add.existing(saucer);
  }

  private updateSaucers(time: number, delta: number): void {
    const playerPos = { x: this.player.x, y: this.player.y };
    for (let i = this.saucers.length - 1; i >= 0; i -= 1) {
      const saucer = this.saucers[i];
      const laser = saucer.updateMovement(time, delta, playerPos);
      if (laser) {
        this.saucerLasers.push(laser);
      }
      
      // Wrap saucers so they persist until killed
      saucer.x = wrapPosition(saucer.x, GAME_DIMENSIONS.width);
      saucer.y = wrapPosition(saucer.y, GAME_DIMENSIONS.height);
    }

    // Player lasers vs saucers
    for (let laserIndex = this.lasers.length - 1; laserIndex >= 0; laserIndex -= 1) {
      const laser = this.lasers[laserIndex];
      for (let saucerIndex = this.saucers.length - 1; saucerIndex >= 0; saucerIndex -= 1) {
        const saucer = this.saucers[saucerIndex];
        const distance = Phaser.Math.Distance.Between(laser.x, laser.y, saucer.x, saucer.y);
        if (distance <= 22) {
          new VectorExplosion(this, { radius: 50 }).setPosition(saucer.x, saucer.y);
          this.score += Math.round(250 * this.scoreMultiplier);
          this.hud?.setScore(this.score);
          saucer.destroy();
          this.saucers.splice(saucerIndex, 1);
          this.removeLaser(laserIndex);
          break;
        }
      }
    }

    // Player vs saucer collision
    this.saucers.forEach((saucer) => {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, saucer.x, saucer.y);
      if (this.isPlayerAlive && distance <= 26) {
        this.handlePlayerHit(time);
      }
    });
  }

  private updateEnemyLasers(delta: number, time: number): void {
    this.saucerLasers.forEach((laser) => laser.updateMotion(delta));
    this.saucerLasers = this.saucerLasers.filter((laser) => {
      if (laser.isExpired(GAME_DIMENSIONS.width, GAME_DIMENSIONS.height)) {
        laser.destroy();
        return false;
      }
      return true;
    });

    // Enemy lasers hitting player
    this.saucerLasers.forEach((laser) => {
      const distance = Phaser.Math.Distance.Between(laser.x, laser.y, this.player.x, this.player.y);
      if (this.isPlayerAlive && distance <= 18) {
        this.handlePlayerHit(time);
        laser.destroy();
      }
    });
  }

  private spawnBlackHoleIfNeeded(): void {
    if (this.level < 9) {
      this.blackHoles.forEach((hole) => hole.destroy());
      this.blackHoles = [];
      return;
    }

    const requiredHoles = 1 + Math.floor((this.level - 9) / 4);

    if (this.blackHoles.length > requiredHoles) {
      const extras = this.blackHoles.splice(requiredHoles);
      extras.forEach((hole) => hole.destroy());
      return;
    }

    const holesToAdd = requiredHoles - this.blackHoles.length;
    for (let i = 0; i < holesToAdd; i += 1) {
      const pos = {
        x: Phaser.Math.Between(120, GAME_DIMENSIONS.width - 120),
        y: Phaser.Math.Between(120, GAME_DIMENSIONS.height - 120)
      };
      const hole = new BlackHole(this, { position: pos });
      this.blackHoles.push(hole);
      this.add.existing(hole);
    }
  }

  private logDebugState(time: number): void {
    if (!gameDebug.isEnabled()) return;

    const mockInput = controlMock.isEnabled() ? controlMock.getCurrentInput() : null;

    gameDebug.logState({
      timestamp: time,
      playerPosition: { x: this.player.x, y: this.player.y },
      playerRotation: this.player.rotation,
      playerVelocity: { ...this.playerVelocity },
      inputState: {
        left: (mockInput?.left ?? false) || this.keyState.left,
        right: (mockInput?.right ?? false) || this.keyState.right,
        up: (mockInput?.up ?? false) || this.keyState.up,
        down: (mockInput?.down ?? false) || this.keyState.down,
        shoot: (mockInput?.space ?? false) || this.keyState.space
      },
      laserCount: this.lasers.length,
      laserPositions: this.lasers.map(laser => ({ x: laser.x, y: laser.y })),
      figCount: this.figs.length,
      score: this.score
    });
  }

  private registerKeyboardListeners(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;

    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.SPACE
    ]);

    const setState = (event: KeyboardEvent, isDown: boolean) => {
      const code = event.code || event.key;
      switch (code) {
        case 'ArrowLeft':
        case 'Left':
          if (this.keyState.left === isDown) break;
          this.keyState.left = isDown;
          break;
        case 'ArrowRight':
        case 'Right':
          if (this.keyState.right === isDown) break;
          this.keyState.right = isDown;
          break;
        case 'ArrowUp':
        case 'Up':
          if (this.keyState.up === isDown) break;
          this.keyState.up = isDown;
          break;
        case 'ArrowDown':
        case 'Down':
          if (this.keyState.down === isDown) break;
          this.keyState.down = isDown;
          break;
        case 'Space':
        case 'Spacebar':
        case ' ':
          if (this.keyState.space === isDown) break;
          this.keyState.space = isDown;
          break;
        default:
          break;
      }

      if (this.inputLoggingEnabled) {
        gameDebug.logInputEvent({
          timestamp: this.time.now,
          type: isDown ? 'down' : 'up',
          code: event.code,
          key: event.key,
          state: { ...this.keyState }
        });
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
        this.handleGlobalInput(event);
        setState(event, true);
    };
    const onKeyUp = (event: KeyboardEvent) => setState(event, false);

    keyboard.on('keydown', onKeyDown);
    keyboard.on('keyup', onKeyUp);
    window.addEventListener('keydown', onKeyDown, { passive: true });
    window.addEventListener('keyup', onKeyUp, { passive: true });

    this.game.events.on(Phaser.Core.Events.BLUR, () => {
      this.resetKeyState('blur');
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off('keydown', onKeyDown);
      keyboard.off('keyup', onKeyUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      this.game.events.off(Phaser.Core.Events.BLUR);
    });
  }

  private resetKeyState(reason: string): void {
    this.keyState = { left: false, right: false, up: false, down: false, space: false };
    if (this.inputLoggingEnabled) {
      gameDebug.logInputEvent({
        timestamp: this.time.now,
        type: 'reset',
        code: reason,
        key: reason,
        state: { ...this.keyState }
      });
    }
  }

  private ensureHud(): void {
    if (!this.scene.isActive('HudScene')) {
      this.scene.launch('HudScene');
    }

    const hudScene = this.scene.get('HudScene');
    const assignOverlay = () => {
      this.hud = hudScene.children.list.find((child) => child.name === 'HudOverlay') as HudOverlay | undefined;
      this.updateHudStats();
    };

    if (hudScene.children?.list?.length) {
      assignOverlay();
    } else {
      hudScene.events.once(Phaser.Scenes.Events.CREATE, assignOverlay);
    }
  }

  private updateHudStats(): void {
    // If hud is missing or inactive, try to find it again
    if (!this.hud || !this.hud.active) {
       const hudScene = this.scene.get('HudScene');
       if (hudScene && hudScene.scene.isActive()) {
           this.hud = hudScene.children.list.find((child) => child.name === 'HudOverlay') as HudOverlay | undefined;
       }
    }
    
    if (!this.hud) return;
    this.hud.setScore(this.score);
    this.hud.setLives(this.lives);
    this.hud.setLevel(this.level);
    this.hud.setVisible(!this.isDemoMode);
  }
}
