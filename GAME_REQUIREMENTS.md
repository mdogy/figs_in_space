# Game Requirements & Design Document

## 1. Game States
The game operates in two main states: **Gameplay** and **Standby**.

### A. Gameplay State
- The active state where the user plays the game.
- **Start:** Triggered by any key press during the Standby state.
- **End:** The game ends when the player's lives drop to 0.
  - Initial lives: 10.
  - **Game Over Sequence:**
    1. Lives reach 0.
    2. "GAME OVER" displays for at least 10 seconds.
    3. **High Score Check:**
       - If score is in top 10: Prompt user for name.
       - Wait for name input or Enter key.
       - If Enter pressed with no name, a random name is assigned.
    4. Transition back to **Standby State**.

### B. Standby State
Automated attract mode that cycles through three sub-states every 10 seconds. No user intervention required.
1.  **Standby.Demo:**
    - AI controls the ship.
    - "INSERT COIN" text blinks over the gameplay.
    - Aggressive AI behavior.
    - Starts at a random level and score (score not recorded).
2.  **Standby.HighScore:**
    - Displays the top 10 high scores.
3.  **Standby.Title:**
    - Retro splash screen.
    - "Figs in Space" in huge text.
    - Various graphical elements.

---

## 2. Gameplay Rules

### Lives & Damage
- **Initial Lives:** 10.
- **Life Lost:** Collision with a Fig, Alien Ship, Black Hole, or Alien Laser.
- **Invulnerability:**
  - After losing a life, the ship is invincible for 2 seconds.
  - Minimum gameplay duration is ~20 seconds (10 lives * 2s invulnerability).

### Level Progression
- **Level 1:** Start with large figs.
- **Progression:**
  - Each level increases the number of starting large figs until Level 9; after Level 9 fig count stays flat.
  - Fig speed increases by 5% per level (up to Level 9); after Level 9 speed stays flat.
  - Level ends when all figs are destroyed.
- **Enemies:**
  - **Level 3:** First Alien Ship appears (flies by and fires).
  - **Frequency:** Another Alien Ship added every 2 levels thereafter.
- **Hazards:**
  - **Level 9:** Black Hole appears.
    - Sucks in anything (Player, Aliens, Figs).
    - Speed/Number of figs stop increasing.
  - **Frequency:** New Black Hole added every 4 levels after Level 9 (cumulative).

---

## 3. Controls

| Action | Key | Description |
| :--- | :--- | :--- |
| **Thrust** | Up Arrow | Accelerate forward. |
| **Reverse** | Down Arrow | Decelerate/Reverse. |
| **Rotate Left** | Left Arrow | Rotate ship counter-clockwise. |
| **Rotate Right** | Right Arrow | Rotate ship clockwise. |
| **Stop Rotation** | Opposite Arrow | Short press opposite to spin stops rotation. |
| **Fire** | Spacebar | Fire laser bolts (continuous while held). |

---

## 4. Physics & Mechanics
- **Lasers:** 
  - Emanate from the ship's nose.
  - Impact of a laser bolt breaks up a larger fig into smaller figs
  - Impact of a laser bolts destroys a smallest fig
  - Impact of a laser bolt causes the enemy ship to explode
  - Impact of a laser bolt has no effect on black holes
  - Range of laser bolts increases every three levels by boosting lifespan until the bolt can cross the screen; no further increases past that point.
- **Collisions:**
  - Ship vs. Hazard -> Lose 1 Life.
  - Figs vs. Figs -> Break into smaller figs.
  - Black Hole -> Consumes everything.

---

## 5. Scoring
- **Base Score:** Increases by 2.5% per level.
- **Multipliers:** Triple points for destroying Alien Ships.
- **Leaderboard:** 
  - Tracks top 10 scores.
  - Users enter up to 20 characters for leader board name.
  - If they just hit enter without a name, random name generated.
