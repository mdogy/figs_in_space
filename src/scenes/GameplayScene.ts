import Phaser from 'phaser';
import { PlayerShip } from '@prefabs/PlayerShip';
import { HudOverlay } from '@ui/HudOverlay';
import { angleToVector, limitMagnitude, Vector2, wrapPosition } from '@core/vectorMath';
import { getVectorColor, VECTOR_LINE_WIDTH } from '@theme/vectorPalette';
import { GAME_DIMENSIONS } from '../game';
import { LaserBolt } from '@prefabs/LaserBolt';
import { Asteroid, AsteroidConfig } from '@prefabs/Asteroid';
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
const BASE_ASTEROID_COUNT = 5;
const DEMO_MAX_DURATION_MS = 10000;
const DEMO_STARTING_SCORE_RANGE = { min: 500, max: 4500 };
const DEMO_MAX_LEVEL = 12;
const DEMO_MIN_LIVES = 3;
const DEMO_MAX_LIVES = 10;

export class GameplayScene extends Phaser.Scene {
  private player!: PlayerShip;
  private hud?: HudOverlay;
  private lasers: LaserBolt[] = [];
  private asteroids: Asteroid[] = [];
  private saucers: EnemySaucer[] = [];
  private saucerLasers: EnemyLaser[] = [];
  private blackHole?: BlackHole;
  private playerVelocity: Vector2 = { x: 0, y: 0 };
  private lastShotAt = 0;
  private score = 0;
  private level = 1;
  private scoreMultiplier = 1;
  private isShooting = false;
  private debugPhase = 0; // 0: No test, 1: Thrust, 2: Rotate, 3: Shoot
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
  private demoStartedAt = 0;

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
    this.asteroids = [];
    this.saucers = [];
    this.saucerLasers = [];
    this.blackHole = undefined;
    this.lastShotAt = 0;
    this.demoStartedAt = this.time.now;
    this.keyState = { left: false, right: false, up: false, down: false, space: false };

    this.score = 0;
    this.level = 1;
    this.lives = INITIAL_LIVES;
    if (this.isDemoMode) {
      this.score = Phaser.Math.Between(DEMO_STARTING_SCORE_RANGE.min, DEMO_STARTING_SCORE_RANGE.max);
      this.level = Phaser.Math.Between(1, DEMO_MAX_LEVEL);
      this.lives = Phaser.Math.Between(DEMO_MIN_LIVES, DEMO_MAX_LIVES);
    }
    this.scoreMultiplier = 1;
    this.debugPhase = 0; // Reset automation phase each run

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

    // Automated testing setup (opt-in via ?autoTest=true)
    if (this.automationEnabled) {
      gameDebug.setEnabled(true);
      controlMock.setEnabled(true);
      this.debugPhase = 1; // Start with thrust test
      controlMock.setSequence(ControlMock.getTestSequence('user-thrust-test'));
      console.log('[DEBUG] Starting user-thrust-test');
    } else if (this.isDemoMode) {
      controlMock.setEnabled(true); // AI will populate this
      this.hud?.setVisible(false); // Hide HUD for demo
      console.log('[DEBUG] Starting demo mode');
    } else {
      gameDebug.setEnabled(debugRequested);
      controlMock.setEnabled(false);
      this.debugPhase = 0;
    }
  }

  update(time: number, delta: number): void {
    if (this.isDemoMode) {
      if (time - this.demoStartedAt > DEMO_MAX_DURATION_MS) {
        this.endGame();
        return;
      }
      this.updateDemoAI();
    }

    if (controlMock.isEnabled()) {
      controlMock.update(time); // Update control mock's internal timer
    }
    if (this.isGameOver) {
      this.updateLasers(delta);
      this.updateEnemyLasers(delta, time);
      this.updateSaucers(time, delta);
      this.updateAsteroids(delta);
      return;
    }

    this.handleInput(delta);
    this.tryShoot(time);
    this.updateLasers(delta);
    this.updateEnemyLasers(delta, time);
    this.updateSaucers(time, delta);
    this.updateAsteroids(delta);
    this.checkCollisions(time);
    this.logDebugState(time);

    // Automated testing phase management
    if (this.automationEnabled && this.debugPhase > 0) {
      if (time >= 15000 && this.debugPhase === 1) { // 15 seconds for thrust test
        this.debugPhase = 2; // Switch to rotate test
        controlMock.reset();
        controlMock.setSequence(ControlMock.getTestSequence('user-rotate-test'));
        console.log('[DEBUG] Starting user-rotate-test');
      } else if (time >= 30000 && this.debugPhase === 2) { // 15 seconds for rotate test (15s + 15s)
        this.debugPhase = 3; // Switch to shoot test
        controlMock.reset();
        controlMock.setSequence(ControlMock.getTestSequence('user-shoot-test'));
        console.log('[DEBUG] Starting user-shoot-test');
      } else if (time >= 45000 && this.debugPhase === 3) { // 15 seconds for shoot test (30s + 15s)
        this.debugPhase = 0; // End tests
        controlMock.setEnabled(false);
        gameDebug.setEnabled(false);
        console.log('[DEBUG] All automated tests finished.');
        gameDebug.downloadHistory(); // Download the log history
      }
    }
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

    if (this.blackHole) {
      this.blackHole.applyPull(this.player, this.playerVelocity);
    }

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

    // Track shooting state to require key release before next shot
    if (!shootPressed) {
      this.isShooting = false;
      return;
    }

    // If already shooting (key held down), don't shoot again
    if (this.isShooting) {
      return;
    }

    // Check cooldown
    if (time - this.lastShotAt < SHOT_COOLDOWN_MS) {
      return;
    }

    // Fire!
    this.isShooting = true;
    this.lastShotAt = time;

    // Calculate muzzle position at the nose of the ship
    // Ship is drawn pointing RIGHT (positive X) at rotation = 0
    // The nose is at (half, 0) in local coordinates = 24 pixels to the right
    const muzzleAngle = this.player.rotation;
    const shipNoseOffset = 24; // Half the ship size (48/2)
    const muzzleX = this.player.x + Math.cos(muzzleAngle) * shipNoseOffset;
    const muzzleY = this.player.y + Math.sin(muzzleAngle) * shipNoseOffset;

    const bolt = new LaserBolt(this, { angle: muzzleAngle });
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

  private updateAsteroids(delta: number): void {
    this.asteroids.forEach((asteroid) => {
      asteroid.updateMotion(delta);
      if (this.blackHole) {
        this.blackHole.applyPull(asteroid, asteroid.velocity);
      }
      asteroid.x = wrapPosition(asteroid.x, GAME_DIMENSIONS.width);
      asteroid.y = wrapPosition(asteroid.y, GAME_DIMENSIONS.height);
    });
    this.asteroids = this.asteroids.filter((asteroid) => {
      if (asteroid.isDestroyed()) {
        asteroid.destroy();
        return false;
      }
      return true;
    });

    this.handleAsteroidCollisions();

    if (this.asteroids.length === 0) {
      // Clear remaining saucers before next level
      this.saucers.forEach(s => s.destroy());
      this.saucers = [];
      this.saucerLasers.forEach(l => l.destroy());
      this.saucerLasers = [];
      this.startLevel(this.level + 1);
    }
  }

  private handleAsteroidCollisions(): void {
    const splits = new Set<number>();

    for (let i = 0; i < this.asteroids.length; i += 1) {
      for (let j = i + 1; j < this.asteroids.length; j += 1) {
        const a = this.asteroids[i];
        const b = this.asteroids[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        const minDist = a.radius + b.radius;
        if (distSq <= minDist * minDist) {
          this.resolveAsteroidBounce(a, b);
          if (a.radius > 32) splits.add(i);
          if (b.radius > 32) splits.add(j);
        }
      }
    }

    // Split after processing collisions to avoid index churn mid-loop
    const indices = Array.from(splits).sort((a, b) => b - a);
    indices.forEach(index => this.splitAsteroidNoScore(index));
  }

  private resolveAsteroidBounce(a: Asteroid, b: Asteroid): void {
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

  private splitAsteroidNoScore(index: number): void {
    const asteroid = this.asteroids[index];
    if (!asteroid) return;
    const radius = asteroid.radius;
    asteroid.destroy();
    this.asteroids.splice(index, 1);

    if (radius > 28) {
      const fragments = Phaser.Math.Between(2, 3);
      for (let i = 0; i < fragments; i += 1) {
        this.spawnAsteroids(1, {
          radius: radius * 0.6,
          position: { x: asteroid.x, y: asteroid.y }
        });
      }
    }
  }

  private checkCollisions(time: number): void {
    this.lasers.forEach((laser, laserIndex) => {
      this.asteroids.forEach((asteroid, asteroidIndex) => {
        const distance = Phaser.Math.Distance.Between(laser.x, laser.y, asteroid.x, asteroid.y);
        if (distance <= asteroid.radius) {
          this.splitAsteroid(asteroid, asteroidIndex);
          this.removeLaser(laserIndex);
        }
      });
    });

    this.asteroids.forEach((asteroid) => {
      const distanceToPlayer = Phaser.Math.Distance.Between(this.player.x, this.player.y, asteroid.x, asteroid.y);
      const playerRadius = 24; // Ship size is 48; use half as collision radius
      if (this.isPlayerAlive && distanceToPlayer <= asteroid.radius + playerRadius) {
        this.handlePlayerHit(time);
      }
    });

    if (this.blackHole && this.isPlayerAlive) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.blackHole.x, this.blackHole.y);
      if (distance <= this.blackHole.radius) {
        this.handlePlayerHit(time);
      }
    }
  }

  private handlePlayerHit(time: number): void {
    if (this.isGameOver) return;
    if (time < this.invulnerableUntil) return;
    if (!this.isPlayerAlive) return;

    new VectorExplosion(this, { radius: 36 }).setPosition(this.player.x, this.player.y);

    this.lives -= 1;
    this.hud?.setLives(this.lives);
    this.resetKeyState('death');
    this.playerVelocity = { x: 0, y: 0 };
    this.player.setVisible(false);
    this.isPlayerAlive = false;
    this.invulnerableUntil = time + RESPAWN_DELAY_MS + INVULNERABLE_MS;

    if (this.lives <= 0) {
      this.endGame();
      return;
    }

    this.time.delayedCall(RESPAWN_DELAY_MS, () => {
      this.respawnPlayer(this.invulnerableUntil);
    });
  }

  private respawnPlayer(time: number): void {
    this.player.setPosition(GAME_DIMENSIONS.width / 2, GAME_DIMENSIONS.height / 2);
    this.player.rotation = 0;
    this.playerVelocity = { x: 0, y: 0 };
    this.player.setVisible(true).setAlpha(0.35);
    this.invulnerableUntil = time + INVULNERABLE_MS;

    this.tweens.add({
      targets: this.player,
      alpha: { from: 0.35, to: 1 },
      duration: INVULNERABLE_MS,
      ease: 'Sine.easeInOut',
      yoyo: false,
      onComplete: () => {
        this.player.setAlpha(1);
        this.invulnerableUntil = 0;
        this.isPlayerAlive = true;
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

    // Find the closest asteroid
    let closestAsteroid: Asteroid | null = null;
    let minDistance = Number.MAX_VALUE;
    for (const asteroid of this.asteroids) {
        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, asteroid.x, asteroid.y);
        if (d < minDistance) {
            minDistance = d;
            closestAsteroid = asteroid;
        }
    }

    const timerPulse = (Math.floor(this.time.now / SHOT_COOLDOWN_MS) % 2) === 0;
    const input = { left: false, right: false, up: false, space: timerPulse };

    if (closestAsteroid) {
        const angleToAsteroid = Phaser.Math.Angle.Between(this.player.x, this.player.y, closestAsteroid.x, closestAsteroid.y);
        const angleDifference = Phaser.Math.Angle.Wrap(angleToAsteroid - this.player.rotation);

        // Dangerously close: prioritize evasion
        if (minDistance < 150) {
            input.up = true; // Keep moving
            // Turn away from the asteroid
            if (angleDifference > 0) {
                input.left = true;
            } else {
                input.right = true;
            }
        } else {
            // Far enough: align and shoot
            input.up = minDistance > 200; // Move forward if far
            if (Math.abs(angleDifference) < 0.1) {
                input.space = true; // Shoot if aligned
            } else {
                // Turn towards the asteroid
                if (angleDifference > 0) {
                    input.right = true;
                } else {
                    input.left = true;
                }
            }
        }
    } else {
        // No asteroids, just explore
        input.up = true;
        if (Math.random() < 0.02) {
            input.right = true;
        }
    }

    controlMock.setInput(input);
  }

  private splitAsteroid(hitAsteroid: Asteroid, asteroidIndex: number): void {
    const baseScore = Math.max(10, Math.round(hitAsteroid.radius));
    this.score += Math.round(baseScore * this.scoreMultiplier);
    this.hud?.setScore(this.score);
    const radius = hitAsteroid.radius;
    hitAsteroid.destroy();
    this.asteroids.splice(asteroidIndex, 1);

    if (radius > 28) {
      const fragments = Phaser.Math.Between(2, 3);
      for (let i = 0; i < fragments; i += 1) {
        this.spawnAsteroids(1, {
          radius: radius * 0.6,
          position: { x: hitAsteroid.x, y: hitAsteroid.y }
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

  private spawnAsteroids(count: number, overrides: Partial<AsteroidConfig> = {}, speedMultiplier = 1): void {
    for (let i = 0; i < count; i += 1) {
      const edge = Phaser.Math.Between(0, 3);
      const position = overrides.position ?? this.randomEdgePosition(edge);
      const baseSpeed = overrides.speed ?? Phaser.Math.FloatBetween(0.02, 0.08);
      const asteroid = new Asteroid(this, {
        radius: overrides.radius ?? Phaser.Math.Between(35, 60),
        position,
        direction: Phaser.Math.FloatBetween(0, Math.PI * 2),
        speed: baseSpeed * speedMultiplier
      });
      this.asteroids.push(asteroid);
      this.add.existing(asteroid);
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
    const asteroidCount = BASE_ASTEROID_COUNT + (level - 1);
    const speedMultiplier = 1 + (level - 1) * 0.15;
    this.spawnAsteroids(asteroidCount, {}, speedMultiplier);
    this.hud?.setLevel(this.level);
    this.spawnBlackHoleIfNeeded();
    this.scheduleSaucersForLevel();
  }

  private scheduleSaucersForLevel(): void {
    if (this.level < 3) return;
    const count = 1 + Math.floor((this.level - 3) / 2);
    for (let i = 0; i < count; i += 1) {
      const delay = Phaser.Math.Between(2000, 6000) + i * 1500;
      this.time.delayedCall(delay, () => {
        if (!this.isGameOver) {
          this.spawnSaucer();
        }
      });
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
      if (saucer.isOffscreen(GAME_DIMENSIONS.width, GAME_DIMENSIONS.height)) {
        saucer.destroy();
        this.saucers.splice(i, 1);
      }
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
    if (this.level >= 9 && !this.blackHole) {
      const pos = { x: GAME_DIMENSIONS.width * 0.5, y: GAME_DIMENSIONS.height * 0.5 };
      this.blackHole = new BlackHole(this, { position: pos });
      this.add.existing(this.blackHole);
    } else if (this.level < 9 && this.blackHole) {
      this.blackHole.destroy();
      this.blackHole = undefined;
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
      asteroidCount: this.asteroids.length,
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

    const onKeyDown = (event: KeyboardEvent) => setState(event, true);
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
    if (!this.hud) return;
    this.hud.setScore(this.score);
    this.hud.setLives(this.lives);
    this.hud.setLevel(this.level);
    this.hud.setVisible(!this.isDemoMode);
  }
}
