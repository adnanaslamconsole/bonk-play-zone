import { GameState, Player, PowerUp, Particle, Hazard } from "./types";
import { CharacterDef, CHARACTERS } from "./characters";
import { getThemeForRound } from "./arenaThemes";
import { networkManager } from "./NetworkManager";
import { LEVELS } from "./levels";

const BOT_COLORS = [
  "#ff6b9d",
  "#00e5ff",
  "#ff9100",
  "#76ff03",
  "#7c4dff",
  "#ff1744",
  "#ffea00",
  "#e040fb",
];

export function createInitialState(
  canvasW: number,
  canvasH: number,
  playerChar?: CharacterDef,
  isMultiplayer = false,
  round = 1,
  level = 0,
  maxTime = 0,
): GameState {
  const isMobile = canvasW < 768;
  const arenaR = isMobile
    ? Math.min(canvasW, canvasH) * 0.48
    : Math.min(canvasW, canvasH) * 0.42;
  const playerRadius = isMobile ? 12 : 22;

  // Center shifted up for mobile ergonomics (portrait mode)
  const cx = canvasW / 2;
  const cy = isMobile ? canvasH * 0.42 : canvasH / 2;

  const players: Player[] = [];
  const char = playerChar || CHARACTERS[0];
  const levelDef = level > 0 ? LEVELS.find(l => l.number === level) : null;

  // Dynamic Bot Scaling: Level 1 (4 players), Level 2 (7), etc. Max 20.
  const totalSlots = levelDef ? levelDef.totalEnemies + 1 : Math.min(20, 1 + (round * 3));

  // Multi-Ring Radial Distribution Algorithm
  const getSpawnPoint = (idx: number, total: number, r: number) => {
    let ringIdx = 0;
    let idxInRing = idx;
    let ringCap = 6;
    let ringDist = r * 0.35;

    // Ring 1 (Inner): 6 slots
    if (idx >= 6) {
      ringIdx = 1;
      idxInRing = idx - 6;
      ringCap = 12; // Ring 2 (Mid): 12 slots (Total 18)
      ringDist = r * 0.7;

      if (idx >= 18) {
        ringIdx = 2;
        idxInRing = idx - 18;
        ringCap = 12; // Ring 3 (Outer): Remaining
        ringDist = r * 0.9;
      }
    }

    // Adjust ringCap if it's the last ring to even distribution
    const actualRingCap = idx >= 18 ? (total - 18) : (total < (ringIdx === 0 ? 6 : 18) ? (ringIdx === 0 ? total : total - 6) : ringCap);

    const angle = (idxInRing / actualRingCap) * Math.PI * 2;
    return {
      x: cx + Math.cos(angle) * ringDist,
      y: cy + Math.sin(angle) * ringDist,
    };
  };

  if (isMultiplayer && networkManager.role !== "offline") {
    const networkPlayers = networkManager.playersInRoom;
    const slots = networkPlayers.length; // strictly the number of actual network players

    // Spawn Humans
    networkPlayers.forEach((lobbyPlayer, i) => {
      const pos = getSpawnPoint(i, slots, arenaR);
      const isLocal = lobbyPlayer.id === networkManager.playerId;
      players.push(
        createPlayer(
          lobbyPlayer.id,
          lobbyPlayer.name,
          pos.x,
          pos.y,
          lobbyPlayer.character.color,
          lobbyPlayer.character.eyeColor,
          isLocal,
          playerRadius,
        ),
      );
    });
  } else {
    // Single-player mode scaling
    const playerPos = getSpawnPoint(0, totalSlots, arenaR);

    players.push(
      createPlayer(
        "player",
        char.name,
        playerPos.x,
        playerPos.y,
        char.color,
        char.eyeColor,
        true,
        playerRadius,
      ),
    );

    const botChars = CHARACTERS.filter((c) => c.id !== char.id);
    for (let i = 1; i < totalSlots; i++) {
      const pos = getSpawnPoint(i, totalSlots, arenaR);
      const bc = botChars[i % botChars.length];
      players.push(
        createPlayer(
          `robot-${i}`,
          `Robot ${i}`,
          pos.x,
          pos.y,
          bc.color,
          bc.eyeColor,
          false,
          playerRadius,
        ),
      );
    }
  }

  const hazards: Hazard[] = [];
  if (levelDef) {
    // Generate hazards based on level config
    const spawnHazard = (type: Hazard["type"], ringRadius: number) => {
      const angle = Math.random() * Math.PI * 2;
      hazards.push({
        x: cx + Math.cos(angle) * ringRadius,
        y: cy + Math.sin(angle) * ringRadius,
        type,
        radius: type === 'moving' || type === 'trap' ? 25 : 20,
        alive: true,
        cooldown: 0,
        vx: type === 'moving' ? (Math.random() > 0.5 ? 2 : -2) : 0,
        vy: type === 'moving' ? (Math.random() > 0.5 ? 2 : -2) : 0,
        anchorX: cx + Math.cos(angle) * ringRadius,
        anchorY: cy + Math.sin(angle) * ringRadius,
      });
    };

    if (levelDef.hazardType === 'traps') {
      for (let i = 0; i < levelDef.hazardCount; i++) spawnHazard('trap', arenaR * 0.5);
    } else if (levelDef.hazardType === 'moving') {
      for (let i = 0; i < levelDef.hazardCount; i++) spawnHazard('moving', arenaR * 0.7);
    } else if (levelDef.hazardType === 'mixed') {
      for (let i = 0; i < Math.ceil(levelDef.hazardCount / 2); i++) spawnHazard('moving', arenaR * 0.7);
      for (let i = 0; i < Math.floor(levelDef.hazardCount / 2); i++) spawnHazard('trap', arenaR * 0.4);
    }
  }

  return {
    phase: "menu",
    level,
    players,
    powerUps: [],
    particles: [],
    hazards: [],
    arenaRadius: arenaR,
    arenaMaxRadius: arenaR,
    arenaCenter: { x: cx, y: cy },
    time: 0,
    maxTime,
    round,
    playerScore: 0,
    shrinkTimer: 0,
    message: "",
    messageTimer: 0,
    soundEvents: [],
    theme: getThemeForRound(round),
  };
}

function createPlayer(
  id: string,
  name: string,
  x: number,
  y: number,
  color: string,
  eyeColor: string,
  isPlayer: boolean,
  radius = 22,
): Player {
  return {
    id,
    name,
    x,
    y,
    vx: 0,
    vy: 0,
    radius,
    color,
    eyeColor,
    isPlayer,
    alive: true,
    bonkCooldown: 0,
    stunTimer: 0,
    score: 0,
    facing: 0,
    expression: "normal",
    knockbackResist: 1,
    superBonkTimer: 0,
    boosterTimer: 0,
    boosterCooldown: 0,
  };
}

export function resetGame(
  state: GameState,
  canvasW: number,
  canvasH: number,
  playerChar?: CharacterDef,
  isMultiplayer = false,
): GameState {
  const won = state.players.find(p => p.isPlayer)?.alive;
  const nextRound = won ? state.round + 1 : state.round;
  const fresh = createInitialState(canvasW, canvasH, playerChar, isMultiplayer, nextRound, state.level, state.maxTime);
  fresh.phase = "playing";
  fresh.playerScore = state.playerScore;
  fresh.theme = getThemeForRound(nextRound);
  return fresh;
}

interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  bonk: boolean;
  boost: boolean;
  mouseX: number;
  mouseY: number;
  touchActive: boolean;
  touchMoveX: number;
  touchMoveY: number;
  touchBonk: boolean;
}

export function updateGame(
  state: GameState,
  input: InputState,
  dt: number,
): GameState {
  if (state.phase !== "playing") return state;

  const s = { ...state };
  s.soundEvents = [];
  s.time += dt;
  s.shrinkTimer += dt;

  // Shrink arena over time
  const shrinkRate = 0.3 + s.round * 0.05;
  const minRadius = 80;
  s.arenaRadius = Math.max(
    minRadius,
    s.arenaMaxRadius - s.shrinkTimer * shrinkRate,
  );

  // Spawn power-ups
  if (Math.random() < 0.005 * dt * 60) {
    spawnPowerUp(s);
  }

  // Spawn hazards
  if (Math.random() < 0.002 * dt * 60) {
    spawnHazard(s);
  }

  // Update message timer
  if (s.messageTimer > 0) {
    s.messageTimer -= dt;
    if (s.messageTimer <= 0) s.message = "";
  }

  // Update Hazards (Autonomous Movement) - Done once per frame
  for (const h of s.hazards) {
    if (!h.alive) continue;
    
    if (h.cooldown > 0) {
      h.cooldown -= dt;
    }

    if (h.type === 'moving' && h.anchorX !== undefined && h.anchorY !== undefined) {
      // 60fps equivalent speed (2-4 pixels per frame)
      h.x += (h.vx || 0) * 60 * dt;
      h.y += (h.vy || 0) * 60 * dt;
      
      const dxFromAnchor = h.x - h.anchorX;
      const dyFromAnchor = h.y - h.anchorY;
      if (Math.sqrt(dxFromAnchor * dxFromAnchor + dyFromAnchor * dyFromAnchor) > 80) {
         h.vx = -1 * (h.vx || 0);
         h.vy = -1 * (h.vy || 0);
      }
    }
  }

  // Update players
  const alivePlayers = s.players.filter((p) => p.alive);

  for (const p of s.players) {
    if (!p.alive) continue;

    // Cooldowns
    if (p.bonkCooldown > 0) p.bonkCooldown -= dt;
    if (p.superBonkTimer > 0) p.superBonkTimer -= dt;
    if (p.boosterTimer > 0) p.boosterTimer -= dt;
    if (p.boosterCooldown > 0) p.boosterCooldown -= dt;

    if (p.stunTimer > 0) {
      p.stunTimer -= dt;
      p.expression = "stunned";
      // Slow movement when stunned
      p.vx *= 0.95;
      p.vy *= 0.95;
    } else if (p.expression === "stunned") {
      p.expression = "normal";
    }

    if (
      p.isPlayer ||
      (networkManager.role === "host" && p.id.startsWith("client-"))
    ) {
      // Human movement (local or remote via host)
      const isBoosting = p.boosterTimer > 0;
      let speed = p.stunTimer > 0 ? 100 : isBoosting ? 600 : 250;
      let mx = 0,
        my = 0;
      let WantsToBonk = false;
      let WantsToBoost = false;

      // Local player input
      if (p.isPlayer) {
        if (input.touchActive) {
          mx = input.touchMoveX;
          my = input.touchMoveY;
        } else {
          if (input.left) mx -= 1;
          if (input.right) mx += 1;
          if (input.up) my -= 1;
          if (input.down) my += 1;
        }
        WantsToBonk = input.bonk || input.touchBonk;
        WantsToBoost = input.boost;
      }
      // Remote player input (evaluated by Host)
      else if (
        networkManager.role === "host" &&
        networkManager.remoteInputs[p.id]
      ) {
        const rim = networkManager.remoteInputs[p.id];
        if (rim.touchActive) {
          mx = rim.touchMoveX;
          my = rim.touchMoveY;
        } else {
          if (rim.left) mx -= 1;
          if (rim.right) mx += 1;
          if (rim.up) my -= 1;
          if (rim.down) my += 1;
        }
        WantsToBonk = rim.bonk || rim.touchBonk;
        WantsToBoost = rim.boost;
      }

      const len = Math.sqrt(mx * mx + my * my);
      if (len > 0) {
        p.vx += (mx / len) * speed * dt * 5;
        p.vy += (my / len) * speed * dt * 5;
        p.facing = Math.atan2(my, mx);
      }

      // Bonk attack
      if (WantsToBonk && p.bonkCooldown <= 0 && p.stunTimer <= 0) {
        performBonk(s, p);
        p.bonkCooldown = 0.5;
        s.soundEvents.push("bonk");
      }

      // Booster activation
      if (
        WantsToBoost &&
        p.boosterCooldown <= 0 &&
        p.stunTimer <= 0 &&
        !isBoosting
      ) {
        p.boosterTimer = 3.0;
        p.boosterCooldown = 10.0;
        s.message = "🚀 BOOSTER ACTIVATED!";
        s.messageTimer = 1.5;
        s.soundEvents.push("powerup");
      }
    } else {
      // AI behavior (Only runs locally if offline, or on the Host)
      if (networkManager.role !== "client") {
        updateAI(s, p, dt);
      }
    }

    // Check Hazard Interactions
    let friction = 0.9;
    for (const h of s.hazards) {
      if (!h.alive) continue;

      const hdx = p.x - h.x;
      const hdy = p.y - h.y;
      const hDist = Math.sqrt(hdx * hdx + hdy * hdy);

      if (hDist < p.radius + h.radius) {
        if (h.type === "ice") {
          // Extremely low friction on ice
          friction = 0.99;

          // Small ice particles sometimes
          if (Math.random() < 0.1) {
            s.particles.push(
              createParticle(p.x, p.y + p.radius, "#e0ffff", 0.5),
            );
          }
        } else if (h.type === "trampoline" && h.cooldown <= 0) {
          // Launch the player
          const launchForce = 1200;
          p.vx = Math.cos(p.facing) * launchForce;
          p.vy = Math.sin(p.facing) * launchForce;
          h.cooldown = 1.0; // Wait a second before it can launch again
          s.soundEvents.push("bonk"); // Borrow bonk sound for boing
          p.stunTimer = 0.5; // Stunned while flying

          // Trampoline particles
          for (let i = 0; i < 10; i++) {
            s.particles.push(createParticle(h.x, h.y, "#76ff03"));
          }
        } else if (h.type === "trap" && h.cooldown <= 0) {
          // Trap hits player
          const angle = Math.atan2(hdy, hdx);
          const trapForce = 800;
          p.vx = Math.cos(angle) * trapForce;
          p.vy = Math.sin(angle) * trapForce;
          p.stunTimer = 0.6;
          h.cooldown = 2.0; // Trap retracts for 2 seconds
          s.soundEvents.push("bonk");
          for (let i = 0; i < 5; i++) {
             s.particles.push(createParticle(p.x, p.y, "#ff1744"));
          }
        } else if (h.type === "moving") {
          // Acts as a solid bumper, impart velocity
          const angle = Math.atan2(hdy, hdx);
          const bumperForce = 400;
          p.vx = Math.cos(angle) * bumperForce + (h.vx || 0) * 100;
          p.vy = Math.sin(angle) * bumperForce + (h.vy || 0) * 100;
          
          // Separate player immediately to prevent getting stuck
          const overlap = p.radius + h.radius - hDist;
          p.x += Math.cos(angle) * overlap;
          p.y += Math.sin(angle) * overlap;
        }
      }
    }

    // Apply friction
    p.vx *= friction;
    p.vy *= friction;

    // Move
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Trail particles for booster
    if (p.boosterTimer > 0 && Math.random() < 0.5) {
      s.particles.push(
        createParticle(p.x, p.y, lightenColor(p.color, 40), 1.2),
      );
    }

    // Check arena bounds
    const dx = p.x - s.arenaCenter.x;
    const dy = p.y - s.arenaCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > s.arenaRadius - p.radius) {
      if (dist > s.arenaRadius + p.radius) {
        // Fallen off!
        p.alive = false;
        s.soundEvents.push("elimination");
        if (p.isPlayer) {
          s.message = "💀 You got bonked off!";
          s.messageTimer = 2;
        } else {
          s.playerScore += 100;
          s.message = `💥 ${p.name} eliminated!`;
          s.messageTimer = 1.5;
        }
        // Death particles
        for (let i = 0; i < 15; i++) {
          s.particles.push(createParticle(p.x, p.y, p.color));
        }
      } else {
        // Push back toward center slightly, but allow falling off
        const pushBack = 0.3;
        p.vx -= (dx / dist) * pushBack * 60 * dt;
        p.vy -= (dy / dist) * pushBack * 60 * dt;
      }
    }

    // Power-up collection
    for (const pu of s.powerUps) {
      if (!pu.alive) continue;
      const pdx = p.x - pu.x;
      const pdy = p.y - pu.y;
      if (Math.sqrt(pdx * pdx + pdy * pdy) < p.radius + pu.radius) {
        pu.alive = false;
        applyPowerUp(s, p, pu);
        s.soundEvents.push("powerup");
      }
    }
  }

  // Player-to-player physical collision
  for (let i = 0; i < alivePlayers.length; i++) {
    for (let j = i + 1; j < alivePlayers.length; j++) {
      const p1 = alivePlayers[i];
      const p2 = alivePlayers[j];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const minDist = p1.radius + p2.radius;
      if (dist < minDist && dist > 0) {
        // They are overlapping! Push them apart.
        const overlap = minDist - dist;
        const pushTotal = overlap * 0.5 * 10; // push strength factor

        const nx = dx / dist;
        const ny = dy / dist;

        // Give them a bump in velocity
        p1.vx -= nx * pushTotal;
        p1.vy -= ny * pushTotal;

        p2.vx += nx * pushTotal;
        p2.vy += ny * pushTotal;
      }
    }
  }

  // Clean up dead power-ups and hazards
  s.powerUps = s.powerUps.filter((p) => p.alive);
  s.hazards = s.hazards.filter((h) => {
    // Hazards far outside the shrinking area disappear
    const dx = h.x - s.arenaCenter.x;
    const dy = h.y - s.arenaCenter.y;
    return Math.sqrt(dx * dx + dy * dy) < s.arenaMaxRadius + 50 && h.alive;
  });

  // Update particles
  s.particles = s.particles.filter((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 200 * dt;
    p.life -= dt;
    return p.life > 0;
  });

  // Check game over
  const player = s.players.find((p) => p.isPlayer);
  const aliveCount = s.players.filter((p) => p.alive).length;

  if (!player?.alive) {
    s.phase = "gameOver";
    s.message = s.level > 0 ? "You Died! Try Again!" : `Game Over! Score: ${s.playerScore}`;
    s.soundEvents.push("defeat");
  } else if (aliveCount <= 1) {
    s.playerScore += 500;
    
    if (s.level > 0) {
      s.phase = "victory";
      // We'll calculate stars based on time in BonkRoyaleGame or let UI handle it based on maxTime vs s.time
      s.message = "Level Cleared!";
      s.soundEvents.push("victory");
    } else {
      s.phase = "gameOver";
      s.message = `🏆 You Won! Score: ${s.playerScore}`;
      s.soundEvents.push("victory");
    }
  } else if (s.level > 0 && s.maxTime > 0 && s.time >= s.maxTime) {
    s.phase = "gameOver";
    s.message = "Time's Up!";
    s.soundEvents.push("defeat");
  }

  return s;
}

function performBonk(state: GameState, attacker: Player) {
  attacker.expression = "angry";
  setTimeout(() => {
    attacker.expression = "normal";
  }, 300);

  const isSuper = attacker.superBonkTimer > 0;

  // Base properties
  let abilityType = "Ground Pound";

  // Find character def to get their unique ability
  const characterDef = CHARACTERS.find((c) => c.name === attacker.name);
  if (characterDef) {
    abilityType = characterDef.ability;
  }

  // --- Zappy: Lightning Dash ---
  if (abilityType === "Lightning Dash") {
    const dashDist = isSuper ? 250 : 150;
    const startX = attacker.x;
    const startY = attacker.y;

    // Teleport forward
    attacker.x += Math.cos(attacker.facing) * dashDist;
    attacker.y += Math.sin(attacker.facing) * dashDist;

    // Dash trail limits
    for (let i = 0; i < 10; i++) {
      const rx = startX + (attacker.x - startX) * (i / 10);
      const ry = startY + (attacker.y - startY) * (i / 10);
      state.particles.push(createParticle(rx, ry, "#00e5ff", 1.5));
    }

    // Damage anyone nearby at the destination
    const bonkRange = isSuper ? 60 : 40;
    const bonkForce = isSuper ? 1000 : 500;
    for (const target of state.players) {
      if (target.id === attacker.id || !target.alive) continue;
      const dx = target.x - attacker.x;
      const dy = target.y - attacker.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < bonkRange + target.radius) {
        const nx = dx / dist;
        const ny = dy / dist;
        const force = bonkForce / target.knockbackResist;
        target.vx += nx * force;
        target.vy += ny * force;
        target.stunTimer = 1.0; // Long stun for lightning!

        for (let i = 0; i < 5; i++) {
          state.particles.push(
            createParticle(
              (attacker.x + target.x) / 2,
              (attacker.y + target.y) / 2,
              "#00e5ff",
            ),
          );
        }
      }
    }
    return; // Exit early
  }

  // --- Blobette: Bubble Shield ---
  if (abilityType === "Bubble Shield") {
    const bonkRange = isSuper ? 120 : 80;
    const bonkForce = isSuper ? 1500 : 800; // Very high push, but short range

    // Giant bubble wave
    for (let i = 0; i < (isSuper ? 20 : 12); i++) {
      const angle = (i / (isSuper ? 20 : 12)) * Math.PI * 2;
      state.particles.push({
        x: attacker.x + Math.cos(angle) * 30,
        y: attacker.y + Math.sin(angle) * 30,
        vx: Math.cos(angle) * 200,
        vy: Math.sin(angle) * 200,
        life: 0.4,
        maxLife: 0.4,
        color: "#ff6b9d",
        size: 15, // Giant bubbles
      });
    }

    for (const target of state.players) {
      if (target.id === attacker.id || !target.alive) continue;
      const dx = target.x - attacker.x;
      const dy = target.y - attacker.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < bonkRange + target.radius) {
        const nx = dx / dist;
        const ny = dy / dist;
        const force = bonkForce / target.knockbackResist;
        target.vx += nx * force;
        target.vy += ny * force;
        target.stunTimer = 0.2; // Tiny stun, mostly just huge push
      }
    }
    return; // Exit early
  }

  // --- Default processing (Bonky's Ground Pound / Fallback) ---
  const bonkRange = isSuper ? 75 : 50;
  const bonkForce = isSuper ? 1200 : 600;

  for (const target of state.players) {
    if (target.id === attacker.id || !target.alive) continue;

    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < bonkRange + target.radius) {
      const nx = dx / dist;
      const ny = dy / dist;
      const force = bonkForce / target.knockbackResist;
      target.vx += nx * force;
      target.vy += ny * force;
      target.stunTimer = 0.3;

      // Impact particles
      const impactX = (attacker.x + target.x) / 2;
      const impactY = (attacker.y + target.y) / 2;
      for (let i = 0; i < 8; i++) {
        state.particles.push(createParticle(impactX, impactY, "#FFD700"));
      }
      state.particles.push(createParticle(impactX, impactY - 10, "#ffffff", 2));
    }
  }

  // Bonk wave particles
  const particleCount = isSuper ? 12 : 6;
  const particleColor = isSuper ? "#ff1744" : "#FFD700";

  for (let i = 0; i < particleCount; i++) {
    const angle =
      attacker.facing + (Math.random() - 0.5) * (isSuper ? 2.5 : 1.5);
    state.particles.push({
      x: attacker.x + Math.cos(angle) * 25,
      y: attacker.y + Math.sin(angle) * 25,
      vx: Math.cos(angle) * (isSuper ? 250 : 150),
      vy: Math.sin(angle) * (isSuper ? 250 : 150),
      life: 0.3,
      maxLife: 0.3,
      color: particleColor,
      size: isSuper ? 10 : 6,
    });
  }
}

function updateAI(state: GameState, bot: Player, dt: number) {
  if (bot.stunTimer > 0) return;

  const player = state.players.find((p) => p.isPlayer && p.alive);
  const nearestEnemy = findNearest(state, bot);

  // Stay in arena - move toward center if near edge
  const dcx = bot.x - state.arenaCenter.x;
  const dcy = bot.y - state.arenaCenter.y;
  const distCenter = Math.sqrt(dcx * dcx + dcy * dcy);

  const speed = 180;

  if (distCenter > state.arenaRadius * 0.7) {
    // Move toward center
    bot.vx -= (dcx / distCenter) * speed * dt * 3;
    bot.vy -= (dcy / distCenter) * speed * dt * 3;
  } else if (nearestEnemy) {
    const dx = nearestEnemy.x - bot.x;
    const dy = nearestEnemy.y - bot.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 60) {
      // Attack!
      if (bot.bonkCooldown <= 0) {
        bot.facing = Math.atan2(dy, dx);
        performBonk(state, bot);
        bot.bonkCooldown = 0.8 + Math.random() * 0.5;
      }
    } else if (dist < 200) {
      // Chase
      bot.vx += (dx / dist) * speed * dt * 3;
      bot.vy += (dy / dist) * speed * dt * 3;
      bot.facing = Math.atan2(dy, dx);
    } else {
      // Wander
      bot.vx += (Math.random() - 0.5) * speed * dt * 2;
      bot.vy += (Math.random() - 0.5) * speed * dt * 2;
    }
  }
}

function findNearest(state: GameState, from: Player): Player | null {
  let nearest: Player | null = null;
  let minDist = Infinity;
  for (const p of state.players) {
    if (p.id === from.id || !p.alive) continue;
    const dx = p.x - from.x;
    const dy = p.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      nearest = p;
    }
  }
  return nearest;
}

function spawnPowerUp(state: GameState) {
  if (state.powerUps.length >= 3) return;
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * state.arenaRadius * 0.6;
  const types: PowerUp["type"][] = ["speed", "size", "superBonk", "shield"];
  state.powerUps.push({
    x: state.arenaCenter.x + Math.cos(angle) * dist,
    y: state.arenaCenter.y + Math.sin(angle) * dist,
    type: types[Math.floor(Math.random() * types.length)],
    radius: 12,
    alive: true,
    pulsePhase: Math.random() * Math.PI * 2,
  });
}

function applyPowerUp(state: GameState, player: Player, pu: PowerUp) {
  switch (pu.type) {
    case "speed":
      state.message = "⚡ Speed Boost!";
      state.messageTimer = 1;
      player.knockbackResist = 1.5;
      setTimeout(() => {
        player.knockbackResist = 1;
      }, 5000);
      break;
    case "size":
      state.message = "🔵 Size Up!";
      state.messageTimer = 1;
      player.radius = 30;
      setTimeout(() => {
        player.radius = 22;
      }, 5000);
      break;
    case "superBonk":
      state.message = "💥 Super Bonk!";
      state.messageTimer = 1;
      player.superBonkTimer = 5;
      break;
    case "shield":
      state.message = "🛡️ Shield!";
      state.messageTimer = 1;
      player.knockbackResist = 3;
      setTimeout(() => {
        player.knockbackResist = 1;
      }, 4000);
      break;
  }
  for (let i = 0; i < 10; i++) {
    state.particles.push(createParticle(pu.x, pu.y, "#00e5ff"));
  }
}

function spawnHazard(state: GameState) {
  if (state.hazards.length >= 4) return;
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * state.arenaRadius * 0.7; // Can spawn a bit further out than powerups
  const types: Hazard["type"][] = ["ice", "trampoline"];
  const type = types[Math.floor(Math.random() * types.length)];

  state.hazards.push({
    x: state.arenaCenter.x + Math.cos(angle) * dist,
    y: state.arenaCenter.y + Math.sin(angle) * dist,
    type,
    radius: type === "ice" ? 45 : 25, // Ice patches are big, trampolines are small
    alive: true,
    cooldown: 0,
  });
}

function createParticle(
  x: number,
  y: number,
  color: string,
  sizeMult = 1,
): Particle {
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 300,
    vy: (Math.random() - 0.5) * 300 - 100,
    life: 0.4 + Math.random() * 0.4,
    maxLife: 0.8,
    color,
    size: (3 + Math.random() * 4) * sizeMult,
  };
}

// ---- RENDERER ----

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  canvasW: number,
  canvasH: number,
) {
  ctx.clearRect(0, 0, canvasW, canvasH);

  // Background - themed
  const theme = state.theme;
  const bgGrad = ctx.createRadialGradient(
    canvasW / 2,
    canvasH / 2,
    0,
    canvasW / 2,
    canvasH / 2,
    canvasW,
  );
  bgGrad.addColorStop(0, theme.bgInner);
  bgGrad.addColorStop(1, theme.bgOuter);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Always render arena as background
  renderArena(ctx, state);

  // Hazards
  for (const haz of state.hazards) {
    if (!haz.alive) continue;
    renderHazard(ctx, haz, state.time);
  }

  // Power-ups
  for (const pu of state.powerUps) {
    renderPowerUp(ctx, pu, state.time);
  }

  // Players (dead ones first for layering)
  const sorted = [...state.players].sort(
    (a, b) => (a.alive ? 1 : 0) - (b.alive ? 1 : 0),
  );
  for (const p of sorted) {
    if (p.alive) renderPlayer(ctx, p, state.time);
  }

  // Particles
  for (const p of state.particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // HUD
  renderHUD(ctx, state, canvasW, canvasH);

  // renderHUD is already called above
}

function renderArena(ctx: CanvasRenderingContext2D, state: GameState) {
  const { arenaCenter: c, arenaRadius: r, theme } = state;

  // Danger zone (outside arena)
  ctx.fillStyle = theme.dangerColor;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Arena platform
  const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
  grad.addColorStop(0, theme.platformInner);
  grad.addColorStop(0.8, theme.platformMid);
  grad.addColorStop(1, theme.platformOuter);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
  ctx.fill();

  // Arena edge glow - themed
  ctx.strokeStyle = `hsl(${theme.edgeHue + Math.sin(state.time * 2) * 20}, 80%, 55%)`;
  ctx.lineWidth = 3;
  ctx.shadowColor = theme.edgeGlow;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Grid pattern
  ctx.strokeStyle = theme.gridColor;
  ctx.lineWidth = 1;
  for (let i = 50; i < r; i += 50) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, i, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function renderPlayer(ctx: CanvasRenderingContext2D, p: Player, time: number) {
  ctx.save();
  ctx.translate(p.x, p.y);

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(
    0,
    p.radius * 0.7,
    p.radius * 0.8,
    p.radius * 0.3,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Body wobble
  const wobble =
    p.stunTimer > 0 ? Math.sin(time * 30) * 3 : Math.sin(time * 3) * 1;

  // Body
  const bodyGrad = ctx.createRadialGradient(-3, -3, 0, 0, 0, p.radius);
  bodyGrad.addColorStop(0, lightenColor(p.color, 30));
  bodyGrad.addColorStop(1, p.color);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(wobble, 0, p.radius, 0, Math.PI * 2);
  ctx.fill();

  // Outline
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Booster Glow
  if (p.boosterTimer > 0) {
    ctx.shadowColor = "rgba(255, 145, 0, 0.8)";
    ctx.shadowBlur = 15;
    ctx.strokeStyle = "#ff9100";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(wobble, 0, p.radius + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Eyes
  const eyeOffsetX = Math.cos(p.facing) * 4;
  const eyeOffsetY = Math.sin(p.facing) * 4;

  // Left eye
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.ellipse(
    -6 + wobble + eyeOffsetX,
    -4 + eyeOffsetY,
    6,
    7,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Right eye
  ctx.beginPath();
  ctx.ellipse(
    6 + wobble + eyeOffsetX,
    -4 + eyeOffsetY,
    6,
    7,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Pupils
  ctx.fillStyle = p.eyeColor;
  const pupilOff = 2;
  ctx.beginPath();
  ctx.arc(
    -6 + wobble + eyeOffsetX * 1.5 + Math.cos(p.facing) * pupilOff,
    -4 + eyeOffsetY * 1.5 + Math.sin(p.facing) * pupilOff,
    3,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.beginPath();
  ctx.arc(
    6 + wobble + eyeOffsetX * 1.5 + Math.cos(p.facing) * pupilOff,
    -4 + eyeOffsetY * 1.5 + Math.sin(p.facing) * pupilOff,
    3,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  // Expression
  if (p.expression === "angry") {
    // Angry eyebrows
    ctx.strokeStyle = p.eyeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10 + wobble, -14);
    ctx.lineTo(-3 + wobble, -11);
    ctx.moveTo(10 + wobble, -14);
    ctx.lineTo(3 + wobble, -11);
    ctx.stroke();
  }

  // Mouth
  ctx.strokeStyle = p.eyeColor;
  ctx.lineWidth = 2;
  if (p.expression === "stunned") {
    ctx.beginPath();
    ctx.arc(wobble, 8, 4, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(wobble, 6, 6, 0.1, Math.PI - 0.1);
    ctx.stroke();
  }

  // Name tag
  ctx.fillStyle = "white";
  ctx.font = "bold 10px Fredoka, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(p.name, 0, -p.radius - 8);

  // Player indicator
  if (p.isPlayer) {
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.moveTo(0, -p.radius - 20);
    ctx.lineTo(-5, -p.radius - 14);
    ctx.lineTo(5, -p.radius - 14);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function renderPowerUp(
  ctx: CanvasRenderingContext2D,
  pu: PowerUp,
  time: number,
) {
  const pulse = Math.sin(time * 4 + pu.pulsePhase) * 3;
  const r = pu.radius + pulse;

  ctx.save();
  ctx.translate(pu.x, pu.y);

  // Glow
  ctx.shadowColor = getPowerUpColor(pu.type);
  ctx.shadowBlur = 15;

  ctx.fillStyle = getPowerUpColor(pu.type);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Icon
  ctx.fillStyle = "white";
  ctx.font = `${r}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const icons: Record<string, string> = {
    speed: "⚡",
    size: "🔵",
    superBonk: "💥",
    shield: "🛡️",
  };
  ctx.fillText(icons[pu.type] || "?", 0, 0);

  ctx.restore();
}

function renderHazard(
  ctx: CanvasRenderingContext2D,
  haz: Hazard,
  time: number,
) {
  ctx.save();
  ctx.translate(haz.x, haz.y);

  if (haz.type === "ice") {
    // Ice Patch
    ctx.fillStyle = "rgba(150, 220, 255, 0.4)";
    ctx.strokeStyle = "rgba(200, 240, 255, 0.6)";
    ctx.lineWidth = 2;

    // Wavy puddle shape
    ctx.beginPath();
    for (let i = 0; i < Math.PI * 2; i += 0.5) {
      const radiusOff = Math.sin(i * 3 + time * 2) * 4;
      const x = Math.cos(i) * (haz.radius + radiusOff);
      const y = Math.sin(i) * (haz.radius + radiusOff);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Snowflake icon in center
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("❄️", 0, 0);
  } else if (haz.type === "trampoline") {
    // Trampoline Pad
    const squish = haz.cooldown > 0 ? 0.7 : 1.0;

    ctx.scale(squish, squish);

    ctx.fillStyle = "#1b5e20"; // dark green base
    ctx.beginPath();
    ctx.arc(0, 5, haz.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#76ff03"; // bright green bouncy top
    ctx.beginPath();
    ctx.arc(0, 0, haz.radius, 0, Math.PI * 2);
    ctx.fill();

    // Bullseye rings
    ctx.strokeStyle = "#33691e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, haz.radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, haz.radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (haz.type === "trap") {
    // Spiked Trap
    ctx.fillStyle = "#333333";
    ctx.beginPath();
    ctx.arc(0, 0, haz.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ff1744"; // Red Rim
    ctx.lineWidth = 3;
    ctx.stroke();

    // Spikes (pop out if cooldown > 0 indicates active/triggered state in update logic)
    if (haz.cooldown > 0 || Math.sin(time * 3) > 0) { // animate for now if no rigid cooldown logic
       ctx.fillStyle = "#e0e0e0";
       for(let i=0; i<8; i++) {
          const a = (i / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a)*haz.radius*0.3, Math.sin(a)*haz.radius*0.3);
          ctx.lineTo(Math.cos(a)*haz.radius, Math.sin(a)*haz.radius);
          ctx.lineTo(Math.cos(a+0.2)*haz.radius*0.3, Math.sin(a+0.2)*haz.radius*0.3);
          ctx.fill();
       }
    }
  } else if (haz.type === "moving") {
    // Floating Platform / Bumper
    ctx.fillStyle = "#4a148c"; // Deep purple
    ctx.beginPath();
    ctx.arc(0, 0, haz.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Tech rings
    ctx.strokeStyle = "#d500f9"; // Neon purple
    ctx.lineWidth = 2;
    for(let r= haz.radius*0.3; r<haz.radius; r+= haz.radius*0.3) {
      ctx.beginPath();
      ctx.arc(0, 0, r + Math.sin(time*2)*2, 0, Math.PI*2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

function getPowerUpColor(type: string): string {
  switch (type) {
    case "speed":
      return "#ffea00";
    case "size":
      return "#448aff";
    case "superBonk":
      return "#ff1744";
    case "shield":
      return "#00e5ff";
    default:
      return "#ffffff";
  }
}

function renderHUD(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  w: number,
  h: number,
) {
  const player = state.players.find((p) => p.isPlayer);
  const alive = state.players.filter((p) => p.alive).length;

  ctx.font = "bold 16px Fredoka, sans-serif";

  // HUD Config
  const padding = 24;
  const pillH = 26; // Smaller pill height
  const pillR = 13;
  const edgeMargin = 8; // Tighter to the edge

  // 1. Score Pill (Left)
  const scoreText = `⭐ ${state.playerScore}`;
  const scoreW = ctx.measureText(scoreText).width + 20;

  // Shadow for contrast
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.beginPath();
  roundRect(ctx, edgeMargin, padding, scoreW, pillH, pillR);
  ctx.fill();

  ctx.shadowBlur = 0; // Reset shadow for text
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = "#FFD700";
  ctx.textAlign = "left";
  ctx.font = "700 13px Fredoka, sans-serif";
  ctx.fillText(scoreText, edgeMargin + 10, padding + 18);

  // 2. Alive Players Pill (Right)
  const aliveText = `👥 ${alive}`;
  const aliveW = ctx.measureText(aliveText).width + 20;

  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.beginPath();
  roundRect(ctx, w - aliveW - edgeMargin, padding, aliveW, pillH, pillR);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = "#ff6b9d";
  ctx.textAlign = "right";
  ctx.fillText(aliveText, w - edgeMargin - 10, padding + 18);

  // 3. Round Indicator (Center Pill)
  const roundText = `ROUND ${state.round}`;
  const roundW = 100;
  const rx = w / 2 - roundW / 2;

  const roundGrad = ctx.createLinearGradient(rx, 0, rx + roundW, 0);
  roundGrad.addColorStop(0, "rgba(0,0,0,0)");
  roundGrad.addColorStop(0.5, "rgba(0,0,0,0.5)");
  roundGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = roundGrad;
  ctx.fillRect(rx, padding, roundW, pillH);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.font = "700 14px Fredoka, sans-serif";
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 4;
  ctx.fillText(roundText, w / 2, padding + 19);
  ctx.shadowBlur = 0;
  ctx.font = "700 13px Fredoka, sans-serif";

  // Bonk cooldown
  if (player?.alive && player.bonkCooldown > 0) {
    const barW = 80;
    const barH = 6;
    const bx = w / 2 - barW / 2;
    const by = h - 60;

    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    roundRect(ctx, bx, by, barW, barH, 3);
    ctx.fill();

    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    roundRect(ctx, bx, by, barW * (1 - player.bonkCooldown / 0.5), barH, 3);
    ctx.fill();
  }

  // Booster HUD removed from canvas - now handled in React overlay

  // Message
  if (state.message && state.messageTimer > 0) {
    const msgAlpha = Math.min(1, state.messageTimer * 2);
    ctx.globalAlpha = msgAlpha;

    const textWidth = ctx.measureText(state.message).width;
    const bgW = Math.max(200, textWidth + 60);
    const bgH = 46;

    // Stylish backdrop
    const msgGrad = ctx.createLinearGradient(
      w / 2 - bgW / 2,
      0,
      w / 2 + bgW / 2,
      0,
    );
    msgGrad.addColorStop(0, "rgba(0,0,0,0)");
    msgGrad.addColorStop(0.5, "rgba(0,0,0,0.7)");
    msgGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = msgGrad;
    ctx.fillRect(w / 2 - bgW / 2, h / 2 - 25, bgW, bgH);

    // Text with glow
    ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "white";
    ctx.font = "bold 24px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(state.message, w / 2, h / 2 + 8);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}

// Helper for rounded rectangles (native roundRect might not be in all envs)
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function renderMenu(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 52px Fredoka, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("BONK ROYALE", w / 2, h / 2 - 60);

  ctx.fillStyle = "#ff6b9d";
  ctx.font = "bold 20px Fredoka, sans-serif";
  ctx.fillText("🎮 Bonk enemies off the arena!", w / 2, h / 2);

  ctx.fillStyle = "white";
  ctx.font = "16px Nunito, sans-serif";
  ctx.fillText("WASD / Arrow Keys to move", w / 2, h / 2 + 40);
  ctx.fillText("SPACE to Bonk! | SHIFT to Boost!", w / 2, h / 2 + 64);

  const pulse = Math.sin(Date.now() / 300) * 0.1 + 1;
  ctx.save();
  ctx.translate(w / 2, h / 2 + 120);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 24px Fredoka, sans-serif";
  ctx.fillText("[ Click or Tap to Start ]", 0, 0);
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "13px Nunito, sans-serif";
  ctx.fillText(
    "On mobile: Use joystick + BONK/BOOST buttons",
    w / 2,
    h / 2 + 170,
  );
}

function renderGameOver(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  w: number,
  h: number,
) {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, w, h);

  const won = state.players.find((p) => p.isPlayer)?.alive;

  ctx.fillStyle = won ? "#FFD700" : "#ff6b9d";
  ctx.font = "bold 44px Fredoka, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(won ? "🏆 VICTORY!" : "💀 BONKED!", w / 2, h / 2 - 40);

  ctx.fillStyle = "white";
  ctx.font = "bold 22px Fredoka, sans-serif";
  ctx.fillText(`Score: ${state.playerScore}`, w / 2, h / 2 + 10);

  ctx.fillStyle = "#FFD700";
  ctx.font = "bold 20px Fredoka, sans-serif";
  const pulse = Math.sin(Date.now() / 300) * 0.1 + 1;
  ctx.save();
  ctx.translate(w / 2, h / 2 + 70);
  ctx.scale(pulse, pulse);
  ctx.fillText("[ Click to Play Again ]", 0, 0);
  ctx.restore();
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, (num >> 16) + percent);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + percent);
  const b = Math.min(255, (num & 0x0000ff) + percent);
  return `rgb(${r},${g},${b})`;
}
