/**
 * game_ui.js - Endless Runner Web Assembly Frontend Controller
 * 
 * If a compiled Emscripten WASM module is missing, this script automatically provisions
 * a high-fidelity JS replica of the C++ GameManager class exposing the exact same
 * C++ EMSCRIPTEN_BINDINGS layout to ensure immediate web playability.
 */

// ==========================================
// Web Audio retro sound synthesizer
// ==========================================
class SoundSynth {
    constructor() {
        this.ctx = null;
    }
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    playJump() {
        this.init();
        if (!this.ctx) return;
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(380, this.ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }
    playCollect(isBuff) {
        this.init();
        if (!this.ctx) return;
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = isBuff ? 'triangle' : 'sawtooth';
        let f1 = isBuff ? 300 : 180;
        let f2 = isBuff ? 600 : 90;
        osc.frequency.setValueAtTime(f1, this.ctx.currentTime);
        osc.frequency.setValueAtTime(f2, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.25);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    }
    playShieldPop() {
        this.init();
        if (!this.ctx) return;
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    }
    playGameOver() {
        this.init();
        if (!this.ctx) return;
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.6);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.65);
    }
}
const audio = new SoundSynth();

// ==========================================
// C++ Emscripten Mock Binding Layer (WASM Emulator)
// ==========================================
window.Module = window.Module || {};

if (!window.Module.GameManager) {
    console.log("WASM: Initializing high-precision C++ GameManager Web emulation layer.");
    
    class JSPlayer {
        constructor(x, y, w, h) {
            this.x = x; this.y = y; this.width = w; this.height = h;
            this.baseWidth = w; this.baseHeight = h;
            this.vx = 0; this.vy = 0;
            this.grounded = true;
            this.ducking = false;
            this.jumpsRemaining = 1;
            this.maxJumps = 1;
        }
        update(dt) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }
        jump(doubleJumpEnabled, heavyGravity, miniSize) {
            this.maxJumps = doubleJumpEnabled ? 2 : 1;
            if (this.grounded) {
                this.vy = miniSize ? -950 : -850;
                this.grounded = false;
                this.jumpsRemaining = this.maxJumps - 1;
                audio.playJump();
            } else if (doubleJumpEnabled && this.jumpsRemaining > 0) {
                this.vy = miniSize ? -800 : -750;
                this.jumpsRemaining--;
                audio.playJump();
            }
        }
        setDucking(state, miniSize) {
            this.ducking = state;
            let targetH = this.baseHeight;
            let targetW = this.baseWidth;
            if (miniSize) {
                targetH *= 0.5;
                targetW *= 0.5;
            }
            if (this.ducking) {
                this.width = targetW * 1.3;
                this.height = targetH * 0.5;
            } else {
                this.width = targetW;
                this.height = targetH;
            }
        }
        reset() {
            this.vy = 0; this.vx = 0;
            this.grounded = true;
            this.ducking = false;
            this.jumpsRemaining = 1;
            this.maxJumps = 1;
            this.width = this.baseWidth;
            this.height = this.baseHeight;
        }
    }

    class JSEntity {
        constructor(x, y, w, h, type, subtype) {
            this.x = x; this.y = y; this.width = w; this.height = h;
            this.vx = 0; this.vy = 0;
            this.type = type; // 0: Player, 1: Obstacle, 2: Buff, 3: Debuff, 4: Bullet
            this.subtype = subtype;
            this.active = true;
            this.hp = 1;

            if (type === 1) {
                if (subtype === 0) this.hp = 3; // small cactus
                else if (subtype === 1) this.hp = 5; // big cactus
                else if (subtype === 2) this.hp = 1; // bird
            }
        }
        update(dt) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }
        checkCollision(p) {
            if (!this.active) return false;
            return (this.x < p.x + p.width &&
                    this.x + this.width > p.x &&
                    this.y < p.y + p.height &&
                    this.y + this.height > p.y);
        }
    }

    class JSBuffManager {
        constructor() {
            this.buffs = Array(7).fill(0); // SHIELD, SCORE_X2, DOUBLE_JUMP, MINI_SIZE, GLIDE, MAGNET, GUN
            this.debuffs = Array(5).fill(0); // HEAVY_GRAVITY, INVERTED_CONTROLS, SANDSTORM, HALLUCINATION, SCORE_BLEED
        }
        update(dt) {
            for (let i = 0; i < 7; i++) {
                if (this.buffs[i] > 0) {
                    this.buffs[i] = Math.max(0, this.buffs[i] - dt);
                }
            }
            for (let i = 0; i < 5; i++) {
                if (this.debuffs[i] > 0) {
                    this.debuffs[i] = Math.max(0, this.debuffs[i] - dt);
                }
            }
        }
        activateBuff(type, duration) {
            this.buffs[type] = duration;
        }
        activateDebuff(type, duration) {
            this.debuffs[type] = duration;
        }
        removeBuff(type) {
            this.buffs[type] = 0;
        }
        removeDebuff(type) {
            this.debuffs[type] = 0;
        }
        getBuffMask() {
            let mask = 0;
            for (let i = 0; i < 7; i++) {
                if (this.buffs[i] > 0) mask |= (1 << i);
            }
            return mask;
        }
        getDebuffMask() {
            let mask = 0;
            for (let i = 0; i < 5; i++) {
                if (this.debuffs[i] > 0) mask |= (1 << i);
            }
            return mask;
        }
        clear() {
            this.buffs.fill(0);
            this.debuffs.fill(0);
        }
    }

    window.Module.GameManager = class JSGameManager {
        constructor() {
            this.player = new JSPlayer(100, 340, 40, 60);
            this.entities = [];
            this.buffManager = new JSBuffManager();
            this.init();
        }

        init() {
            this.entities = [];
            this.buffManager.clear();
            this.baseGameSpeed = 360;
            this.gameSpeed = this.baseGameSpeed;
            this.maxGameSpeed = 1100;
            this.score = 0;
            this.scoreAccumulator = 0;
            this.distanceTravelled = 0;
            this.gameOverState = false;
            this.levelPaused = false;
            this.spawnTimer = 0;
            this.nextSpawnInterval = 1.4;
            this.lastMilestone = 0;
            this.isJumpPressed = false;
            this.isDuckPressed = false;
            this.flappyModeActive = false;
            this.portalSpawned = false;
            this.player.reset();
            this.player.y = 400 - this.player.height;
        }

        update(dt) {
            if (this.gameOverState || this.levelPaused) return;

            dt = Math.min(dt, 0.1); // Cap delta to avoid physical clip

            // Speed & Distance formulas
            this.distanceTravelled += this.gameSpeed * dt;
            this.gameSpeed = Math.min(this.maxGameSpeed, this.baseGameSpeed + this.distanceTravelled * 0.008);

            // Score bleed check
            if (this.buffManager.debuffs[4] > 0) { // SCORE_BLEED
                this.scoreAccumulator = Math.max(0, this.scoreAccumulator - 20 * dt);
            }

            // Normal score tick with speed multiplier
            const scoreMult = (this.buffManager.buffs[1] > 0) ? 2.0 : 1.0; // SCORE_X2
            this.scoreAccumulator += (this.gameSpeed * 0.05) * scoreMult * dt;
            this.score = Math.floor(this.scoreAccumulator);

            // Portal trigger
            if (this.score >= 5000 && !this.portalSpawned) {
                this.portalSpawned = true;
                let portal = new JSEntity(1150, 200, 40, 60, 2, 99); // type 2, subtype 99 = Portal
                portal.vx = -this.gameSpeed;
                this.entities.push(portal);
            }

            // 1,000 Points spawn milestones
            let currentMilestone = Math.floor(this.score / 1000);
            if (currentMilestone > this.lastMilestone && currentMilestone < 10) {
                this.lastMilestone = currentMilestone;
                
                // Spawn Level Portal
                let levelPortal = new JSEntity(1150, 400 - 100, 40, 100, 2, 100);
                levelPortal.vx = -this.gameSpeed;
                this.entities.push(levelPortal);
            }

            // Update timers
            this.buffManager.update(dt);

            this.player.setDucking(this.isDuckPressed, this.buffManager.buffs[3] > 0);

            // Physical gravity variables
            let gravityMult = 1.0;
            if (this.flappyModeActive) {
                if (this.isJumpPressed) {
                    this.player.vy -= 4000 * dt; // thrust upwards
                }
                gravityMult = 0.8; // reduced gravity
            } else {
                if (this.isDuckPressed && !this.player.grounded) {
                    gravityMult = 7.0; // Fast fall
                } else if (this.buffManager.buffs[4] > 0 && this.isJumpPressed && this.player.vy > 0) { // GLIDE
                    gravityMult = 0.25;
                }
            }

            const currentGravity = 2400 * gravityMult;
            this.player.vy += currentGravity * dt;
            
            if (this.flappyModeActive) {
                this.player.vy = Math.max(-450, Math.min(this.player.vy, 450));
            }

            // Coordinate integration
            this.player.update(dt);

            // Flappy Bounds check
            if (this.flappyModeActive) {
                if (this.player.y < 0) {
                    this.player.y = 0;
                    this.player.vy = 0;
                }
                if (this.player.y + this.player.height >= 400) {
                    // Touched ground in flappy mode means death
                    this.gameOverState = true;
                    audio.playGameOver();
                }
            }

            // Ground floor boundary check
            const floorLevel = 400 - this.player.height;
            if (this.player.y >= floorLevel && !this.flappyModeActive) {
                this.player.y = floorLevel;
                this.player.vy = 0;
                this.player.grounded = true;
                this.player.jumpsRemaining = (this.buffManager.buffs[2] > 0) ? 2 : 1; // DOUBLE_JUMP
            } else {
                this.player.grounded = false;
            }

            // Bullets logic
            let gunActive = this.buffManager.buffs[6] > 0;
            if (gunActive) {
                if (this.fireCooldown === undefined) this.fireCooldown = 0;
                this.fireCooldown -= dt;
                if (this.fireCooldown <= 0) {
                    this.fireCooldown = 0.3;
                    let bullet = new JSEntity(this.player.x + this.player.width, this.player.y + this.player.height/2 - 2, 10, 4, 4, 0);
                    bullet.vx = 900;
                    this.entities.push(bullet);
                    audio.playShieldPop(); // simple pop sound for bullet
                }
            }

            // Process dynamic entities
            const magnetActive = this.buffManager.buffs[5] > 0; // MAGNET
            this.entities.forEach(e => {
                if (!e.active) return;
                
                if (e.type === 4) { // bullet
                    e.vx = 900;
                } else {
                    e.vx = -this.gameSpeed;
                }

                if (magnetActive && (e.type === 2 || e.type === 3)) {
                    // Magnetic pull
                    let dx = (this.player.x + this.player.width / 2) - (e.x + e.width / 2);
                    let dy = (this.player.y + this.player.height / 2) - (e.y + e.height / 2);
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 265 && dist > 5) {
                        e.vx = -this.gameSpeed + (dx / dist) * 550;
                        e.vy = (dy / dist) * 550;
                    }
                }

                e.update(dt);

                if (e.x + e.width < -100 || e.x > 2000) {
                    e.active = false;
                }
            });

            // Handle bounding collisions
            let bullets = this.entities.filter(e => e.type === 4 && e.active);

            this.entities.forEach(e => {
                if (!e.active) return;

                if (e.type === 1 && bullets.length > 0) { // OBSTACLE collision with bullet
                    bullets.forEach(b => {
                        if (!b.active) return;
                        if (e.checkCollision(b)) {
                            b.active = false;
                            e.hp -= 1;
                            if (e.hp <= 0) {
                                e.active = false;
                                audio.playCollect(true);
                                this.scoreAccumulator += (e.subtype === 1 ? 50 : 20); // Score bonus
                            }
                        }
                    });
                }

                if (!e.active || e.type === 4) return; // Disregard bullets hitting player or inactive items

                if (e.checkCollision(this.player)) {
                    if (e.type === 1) { // OBSTACLE
                        // Fake obstacles
                        if (e.subtype === 9 || this.buffManager.debuffs[3] > 0) { // HALLUCINATION
                            e.active = false;
                            return;
                        }

                        if (this.buffManager.buffs[0] > 0) { // SHIELD
                            this.buffManager.removeBuff(0);
                            e.active = false;
                            audio.playShieldPop();
                            if (window.triggerScreenShake) window.triggerScreenShake();
                        } else {
                            this.gameOverState = true;
                            audio.playGameOver();
                        }
                    } else if (e.type === 2) { // BUFF
                        if (e.subtype === 100) { // Level Portal
                            this.levelPaused = true;
                            this.entities = []; // clear screen
                            this.buffManager.clear();
                            this.player.y = 400 - this.player.height;
                            this.player.vy = 0;
                            this.spawnTimer = 0;
                            audio.playCollect(true);
                        } else if (e.subtype === 99) { // Flappy Portal
                            this.flappyModeActive = true;
                            this.player.y = 200;
                            this.player.vy = 0;
                            this.entities = this.entities.filter(ent => ent.type !== 1); // remove obstacles
                        } else {
                            let duration = (e.subtype === 0) ? 999.0 : 8.5; // Shield is persistent
                            this.buffManager.activateBuff(e.subtype, duration);
                        }
                        e.active = false;
                        audio.playCollect(true);
                    } else if (e.type === 3) { // DEBUFF
                        this.buffManager.activateDebuff(e.subtype, 7.0);
                        e.active = false;
                        audio.playCollect(false);
                    }
                }
            });

            // Clean retired structures
            this.entities = this.entities.filter(e => e.active);

            // Spawner
            this.spawnTimer += dt;
            if (this.spawnTimer >= this.nextSpawnInterval) {
                this.spawnTimer = 0;
                this.spawnRandomEntity();
                
                let minSpace = Math.max(1.2, 2.0 - (this.gameSpeed * 0.001));
                let maxSpace = Math.max(2.0, 3.5 - (this.gameSpeed * 0.001));
                this.nextSpawnInterval = minSpace + Math.random() * (maxSpace - minSpace);
            }
        }

        spawnRandomEntity() {
            let numSpawns = Math.random() > 0.85 ? 2 : 1; 
            let spawnX = 1100;
            
            for (let i = 0; i < numSpawns; i++) {
                let roll = Math.random();
                // 6 blocks interval
                let xOffset = i * 240; 
                
                if (roll < 0.65) {
                    // Obstacle (Ground, Elevated, Hallucination)
                    let subType = Math.floor(Math.random() * 4); // 0, 1, 2, 3
                    let w = 32, h = 40, y = 400 - h;
                    if (subType === 1) { // Big Cactus
                        w = 40; h = 58; y = 400 - h;
                    } else if (subType === 2) { // Bird
                        w = 36; h = 28; y = 400 - 80 - Math.random() * 60; // random height bird
                    }
                    if (subType === 3) {
                        // Fake spike
                        w = 30; h = 32; y = 400 - h;
                        let obs = new JSEntity(spawnX + xOffset, y, w, h, 1, 9);
                        obs.vx = -this.gameSpeed;
                        this.entities.push(obs);
                    } else {
                        let obs = new JSEntity(spawnX + xOffset, y, w, h, 1, subType);
                        obs.vx = -this.gameSpeed;
                        this.entities.push(obs);
                    }
                } else if (roll < 0.85) {
                    // Buffs
                    let buffId = Math.floor(Math.random() * 7); // 0 to 6
                    let y = 400 - 90 - Math.random() * 110;
                    let buff = new JSEntity(spawnX + xOffset, y, 26, 26, 2, buffId);
                    buff.vx = -this.gameSpeed;
                    this.entities.push(buff);
                } else {
                    // Debuffs
                    let debuffId = 1 + Math.floor(Math.random() * 4); // Omit 0 (Heavy Gravity), pick 1 to 4
                    let yPosType = Math.floor(Math.random() * 3);
                    let y = 400 - 26; // default ground
                    if (yPosType === 1) y = 400 - 70 - Math.random() * 30; // mid
                    if (yPosType === 2) y = 400 - 130 - Math.random() * 30; // top
                    let debuff = new JSEntity(spawnX + xOffset, y, 26, 26, 3, debuffId);
                    debuff.vx = -this.gameSpeed;
                    this.entities.push(debuff);
                }
            }
        }

        handleJumpPress(pressed) {
            this.isJumpPressed = pressed;
            if (pressed) {
                if (this.levelPaused) {
                    this.levelPaused = false;
                    return;
                }
                if (this.flappyModeActive && !this.gameOverState) {
                    audio.playJump();
                    return;
                }
                if (this.buffManager.debuffs[1] > 0) { // INVERTED
                    this.isDuckPressed = true;
                } else {
                    let djump = this.buffManager.buffs[2] > 0;
                    let heavy = this.buffManager.debuffs[0] > 0;
                    let isMini = this.buffManager.buffs[3] > 0;
                    this.player.jump(djump, heavy, isMini);
                }
            } else {
                if (this.buffManager.debuffs[1] > 0) {
                    this.isDuckPressed = false;
                }
            }
        }

        handleDuckPress(pressed) {
            if (this.buffManager.debuffs[1] > 0) { // INVERTED
                if (pressed) {
                    let djump = this.buffManager.buffs[2] > 0;
                    let heavy = this.buffManager.debuffs[0] > 0;
                    let isMini = this.buffManager.buffs[3] > 0;
                    this.player.jump(djump, heavy, isMini);
                    this.isJumpPressed = true;
                } else {
                    this.isJumpPressed = false;
                }
            } else {
                this.isDuckPressed = pressed;
            }
        }

        // Getters
        getPlayerX() { return this.player.x; }
        getPlayerY() { return this.player.y; }
        getPlayerWidth() { return this.player.width; }
        getPlayerHeight() { return this.player.height; }
        isPlayerDucking() { return this.player.ducking; }
        getScore() { return this.score; }
        getDistance() { return this.distanceTravelled; }
        isGameOver() { return this.gameOverState; }
        getGameSpeed() { return this.gameSpeed; }
        getBuffsMask() { return this.buffManager.getBuffMask(); }
        getDebuffsMask() { return this.buffManager.getDebuffMask(); }
        getBuffRemainingTime(type) { return this.buffManager.buffs[type] || 0; }
        getDebuffRemainingTime(type) { return this.buffManager.debuffs[type] || 0; }
        
        getEntityCount() { return this.entities.length; }
        getEntityType(idx) { return this.entities[idx] ? this.entities[idx].type : -1; }
        getEntitySubtype(idx) { return this.entities[idx] ? this.entities[idx].subtype : -1; }
        getEntityX(idx) { return this.entities[idx] ? this.entities[idx].x : 0; }
        getEntityY(idx) { return this.entities[idx] ? this.entities[idx].y : 0; }
        getEntityWidth(idx) { return this.entities[idx] ? this.entities[idx].width : 0; }
        getEntityHeight(idx) { return this.entities[idx] ? this.entities[idx].height : 0; }
        isEntityActive(idx) { return this.entities[idx] ? this.entities[idx].active : false; }
    }
}

// ==========================================
// RENDERING & INTERACTIVE SYSTEMS
// ==========================================
const BUFF_NAMES = ["Shield", "Double Score", "Double Jump", "Mini-Size", "Glide Mode", "Magnetism", "Gun"];
const DEBUFF_NAMES = ["Heavy Gravity", "Inverted Controls", "Sandstorm / Fog", "Hallucinations", "Score Bleed"];

class GameViewport {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        // Virtual game coordinates bounds
        this.virtualWidth = 1000;
        this.virtualHeight = 500;
        
        // Particle engine
        this.particles = [];
        this.screenShake = 0;
        
        // Keyboard mapping
        this.keys = {};
        
        // Sky stars
        this.stars = Array.from({ length: 60 }, () => ({
            x: Math.random() * 1000,
            y: Math.random() * 260,
            speed: 0.1 + Math.random() * 0.4,
            size: 0.5 + Math.random() * 1.5
        }));

        // Parallax desert outline
        this.hills = Array.from({ length: 20 }, (_, idx) => ({
            x: idx * 60,
            y: 280 + Math.sin(idx * 0.8) * 30 + Math.random() * 5,
        }));
        
        window.triggerScreenShake = () => { this.screenShake = 16; };
        
        this.game = new window.Module.GameManager();
        this.lastTime = performance.now();
        
        this.isPlaying = false;
        this.highestScore = parseInt(localStorage.getItem('runner-highscore') || '0', 10);
        let hsElem = document.getElementById('menu-highscore');
        if (hsElem) hsElem.innerText = this.highestScore;

        this.setupListeners();
        this.resize();
        
        // Match standard requestAnimationFrame
        this.tick = this.tick.bind(this);
        requestAnimationFrame(this.tick);
    }
    
    startGame() {
        this.isPlaying = true;
        this.game.init();
        this.particles = [];
        let modalMenu = document.getElementById('modal-menu');
        if (modalMenu) modalMenu.classList.add('hidden');
        let modalOver = document.getElementById('modal-gameover');
        if (modalOver) modalOver.classList.add('hidden');
    }

    setupListeners() {
        window.addEventListener('resize', () => this.resize());
        
        const handleKey = (e, pressed) => {
            const code = e.code;
            const key = e.key ? e.key.toLowerCase() : '';
            
            if (!this.isPlaying) {
                if (pressed && (code === 'KeyR' || key === 'r' || code === 'Space' || code === 'Enter')) {
                    this.startGame();
                }
                return;
            }
            if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW' || key === 'w') {
                this.game.handleJumpPress(pressed);
                this.keys['jump'] = pressed;
            }
            if (code === 'ArrowDown' || code === 'KeyS' || key === 's') {
                this.game.handleDuckPress(pressed);
                this.keys['duck'] = pressed;
            }
        };

        window.addEventListener('keydown', e => {
            if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
                e.preventDefault(); // Prevent scroll jump on spatial layouts
            }
            handleKey(e, true);
        });

        window.addEventListener('keyup', e => {
            handleKey(e, false);
        });
        
        // Mobile tap touch triggers
        const triggerArea = document.body;
        if (triggerArea) {
            triggerArea.addEventListener('touchstart', e => {
                if (!this.isPlaying) {
                    this.startGame();
                    return;
                }
                let x = e.touches[0].clientX;
                let width = window.innerWidth;
                // If touch is on left half of screen: Jump. If right half: Duck!
                
                if (x < width / 2) {
                    this.game.handleJumpPress(true);
                    this.keys['jump'] = true;
                } else {
                    this.game.handleDuckPress(true);
                    this.keys['duck'] = true;
                }
            }, { passive: false });

            triggerArea.addEventListener('touchend', () => {
                this.game.handleJumpPress(false);
                this.game.handleDuckPress(false);
                this.keys['jump'] = false;
                this.keys['duck'] = false;
            });
        }
    }
    
    resize() {
        const container = this.canvas.parentElement;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        
        // Match responsive width inside container keeping 2:1 aspect ratio
        let targetW = rect.width;
        let targetH = targetW / 2;
        
        if (targetH > rect.height && rect.height > 200) {
            targetH = rect.height;
            targetW = targetH * 2;
        }
        
        this.canvas.width = targetW;
        this.canvas.height = targetH;
    }
    
    // Scale coordinate mappings
    scaleX(x) {
        return (x / this.virtualWidth) * this.canvas.width;
    }
    scaleY(y) {
        return (y / this.virtualHeight) * this.canvas.height;
    }
    scaleW(w) {
        return (w / this.virtualWidth) * this.canvas.width;
    }
    scaleH(h) {
        return (h / this.virtualHeight) * this.canvas.height;
    }

    addSparkles(x, y, color, count = 6) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200 - 80,
                color,
                life: 1.0,
                decay: 1.5 + Math.random() * 1.5,
                size: 2 + Math.random() * 3
            });
        }
    }
    
    tick(now) {
        let dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        
        // Fixed physics updater loop call inside visual thread
        if (this.isPlaying) {
            this.game.update(dt);
        }

        if (this.game.isGameOver()) {
            let s = this.game.getScore();
            if (s > this.highestScore) {
                this.highestScore = s;
                localStorage.setItem('runner-highscore', this.highestScore);
                let hsElem = document.getElementById('menu-highscore');
                if (hsElem) hsElem.innerText = this.highestScore;
            }
            this.isPlaying = false; // pause physics
        }
        
        this.render(dt);
        
        requestAnimationFrame(this.tick);
    }
    
    render(dt) {
        if (!this.ctx) return;
        
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // 1. Core Canvas Cleaning & Screen Shake Transform matrix offsets
        ctx.save();
        if (this.screenShake > 0) {
            let dx = (Math.random() - 0.5) * this.screenShake;
            let dy = (Math.random() - 0.5) * this.screenShake;
            ctx.translate(dx, dy);
            this.screenShake = Math.max(0, this.screenShake - dt * 45);
        }
        
        // Theme Selection based on score
        const themes = [
            { name: "futuristic", sky: ['#0F121D', '#1E2538', '#2D354E'], hills: '#22293E', groundParallax: '#161B2B', ground: '#0c0e15', grid: '#4A5E8C' },
            { name: "desert", sky: ['#2b1d0f', '#4a2f1d', '#8c593b'], hills: '#522b10', groundParallax: '#381c08', ground: '#1f1308', grid: '#bd6a35' },
            { name: "sky", sky: ['#000000', '#1A3B5C', '#6AB4D1'], hills: '#092138', groundParallax: '#031326', ground: '#020b17', grid: '#ffffff' },
            { name: "jungle", sky: ['#0a200a', '#1e381e', '#3c5a3c'], hills: '#132e13', groundParallax: '#0a1a0a', ground: '#051005', grid: '#44aa44' },
            { name: "ocean", sky: ['#000B18', '#001b3a', '#003B73'], hills: '#002552', groundParallax: '#001229', ground: '#00050d', grid: '#0088cc' },
            { name: "snowy", sky: ['#1C2A35', '#3D5466', '#87A6BC'], hills: '#5b768a', groundParallax: '#3f576e', ground: '#1A2938', grid: '#aaccff' },
            { name: "raining", sky: ['#111317', '#1c2026', '#2b323b'], hills: '#222830', groundParallax: '#151920', ground: '#0a0d11', grid: '#557799' }
        ];
        
        let score = this.game.getScore ? this.game.getScore() : 0;
        let themeIndex = Math.floor(score / 1000) % themes.length;
        let t = themes[themeIndex];

        // Set solid background canvas gradient (Deep twilight skies)
        let skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, t.sky[0]);
        skyGrad.addColorStop(0.5, t.sky[1]);
        skyGrad.addColorStop(1, t.sky[2]);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);
        
        // Stars rendering
        const gameSp = this.game.getGameSpeed();
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        if (t.name === "raining") {
            ctx.fillStyle = "rgba(100, 150, 255, 0.5)"; // rain effect
        }
        this.stars.forEach(s => {
            if (t.name === "raining") {
                 s.x -= s.speed * gameSp * 0.15 * dt;
                 s.y += s.speed * 800 * dt;
                 if (s.y > this.virtualHeight) s.y = 0;
                 ctx.fillRect(this.scaleX(s.x), this.scaleY(s.y), 1, s.size * 5);
            } else {
                 s.x -= s.speed * gameSp * 0.05 * dt;
                 if (s.x < 0) s.x = this.virtualWidth;
                 ctx.fillRect(this.scaleX(s.x), this.scaleY(s.y), s.size, s.size);
            }
        });

        // Parallax desert hills vector layout
        ctx.fillStyle = t.hills;
        ctx.beginPath();
        ctx.moveTo(0, h);
        this.hills.forEach((hl, i) => {
            hl.x -= gameSp * 0.15 * dt;
            if (hl.x < -60) hl.x = this.canvas.width + 60;
            ctx.lineTo(this.scaleX(hl.x), this.scaleY(hl.y));
        });
        ctx.lineTo(w, h);
        ctx.fill();

        // Secondary ground parallax
        ctx.fillStyle = t.groundParallax;
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(0, this.scaleY(380));
        ctx.quadraticCurveTo(w * 0.3, this.scaleY(375), w * 0.6, this.scaleY(390));
        ctx.lineTo(w, this.scaleY(380));
        ctx.lineTo(w, h);
        ctx.fill();

        // 2. High Contrast Vector Ground level grid lines
        ctx.fillStyle = t.ground;
        ctx.fillRect(0, this.scaleY(400), w, h - this.scaleY(400));
        
        ctx.strokeStyle = t.grid;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, this.scaleY(400));
        ctx.lineTo(w, this.scaleY(400));
        ctx.stroke();

        // Fast-scrolling ground wireframe hashes
        ctx.strokeStyle = "rgba(90, 110, 150, 0.25)";
        ctx.lineWidth = 1;
        let groundHashShift = -(this.game.getDistance() % 80);
        for (let gx = groundHashShift; gx < this.virtualWidth + 100; gx += 80) {
            ctx.beginPath();
            ctx.moveTo(this.scaleX(gx), this.scaleY(400));
            ctx.lineTo(this.scaleX(gx - 40), h);
            ctx.stroke();
        }

        // Draw horizontal grid speed-lanes
        for (let gy = 400; gy < this.virtualHeight; gy += 25) {
            ctx.strokeStyle = `rgba(90, 110, 150, ${0.1 + (gy - 400) * 0.002})`;
            ctx.beginPath();
            ctx.moveTo(0, this.scaleY(gy));
            ctx.lineTo(w, this.scaleY(gy));
            ctx.stroke();
        }

        // 3. Spawns/Entities rendering
        const eCount = this.game.getEntityCount();
        for (let i = 0; i < eCount; i++) {
            if (!this.game.isEntityActive(i)) continue;
            
            const ex = this.game.getEntityX(i);
            const ey = this.game.getEntityY(i);
            const ew = this.game.getEntityWidth(i);
            const eh = this.game.getEntityHeight(i);
            const eType = this.game.getEntityType(i);
            const eSub = this.game.getEntitySubtype(i);

            ctx.save();
            ctx.translate(this.scaleX(ex), this.scaleY(ey));

            const sw = this.scaleW(ew);
            const sh = this.scaleH(eh);

            if (eType === 1) { 
                // OBSTACLE rendering (high voltage red hazard)
                if (eSub === 9) { // Hallucination fake spike
                    ctx.fillStyle = "rgba(180, 80, 255, 0.35)";
                    ctx.strokeStyle = "rgba(220, 150, 255, 0.7)";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(sw / 2, 0);
                    ctx.lineTo(sw, sh);
                    ctx.lineTo(0, sh);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    
                    // Ghostly eyes
                    ctx.fillStyle = "#FFF";
                    ctx.fillRect(sw * 0.3, sh * 0.45, 3, 3);
                    ctx.fillRect(sw * 0.6, sh * 0.45, 3, 3);
                } else {
                        // Real spike hazard
                        let rockGrad = ctx.createLinearGradient(0, 0, 0, sh);
                        rockGrad.addColorStop(0, '#FF4D4D');
                        rockGrad.addColorStop(1, '#990000');
                        ctx.fillStyle = rockGrad;
                        ctx.strokeStyle = "#FFA3A3";
                        ctx.lineWidth = 2;

                        ctx.beginPath();
                        if (eSub === 2) {
                            // Flying Bird shape: wings up and down alternating cycle
                            let wingY = Math.sin(performance.now() * 0.015) * (sh * 0.4);
                            ctx.moveTo(0, sh / 2);
                            ctx.lineTo(sw * 0.3, sh / 2 + wingY);
                            ctx.lineTo(sw * 0.5, sh * 0.2);
                            ctx.lineTo(sw * 0.7, sh / 2 + wingY);
                            ctx.lineTo(sw, sh / 2);
                            ctx.lineTo(sw * 0.5, sh * 0.7);
                        } else {
                            // Jagged sharp crystals
                            ctx.moveTo(sw / 2, 0);
                            ctx.lineTo(sw, sh);
                            ctx.lineTo(0, sh);
                        }
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();

                        // Hazard warnings
                        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
                        ctx.fillRect(sw * 0.35, sh * 0.5, sw * 0.3, sh * 0.35);
                    }
                } else if (eType === 2) {
                    if (eSub === 100) {
                        // Dynamic Portal pixelated retro shader effect simulation
                        let time = Date.now() * 0.005;
                        let pxSize = 5;
                        for (let px = 0; px < sw; px += pxSize) {
                            for (let py = 0; py < sh; py += pxSize) {
                                let noise = Math.sin(time + px * 0.2) * Math.cos(time + py * 0.2);
                                let distFromCenter = Math.sqrt(Math.pow(px - sw/2, 2) + Math.pow(py - sh/2, 2));
                                if (distFromCenter < sw/2 + noise * 5) {
                                    if (noise > 0) {
                                        ctx.fillStyle = `rgba(${150 + noise * 100}, ${50 + noise * 100}, 255, 0.8)`;
                                    } else {
                                        ctx.fillStyle = `rgba(50, ${150 - noise * 100}, 255, 0.8)`;
                                    }
                                    ctx.fillRect(px, py, pxSize, pxSize);
                                }
                            }
                        }
                        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
                        ctx.lineWidth = 2;
                        ctx.strokeRect(0, 0, sw, sh);
                    } else {
                        // BUFF Items (Neon turquoise spheres containing symbols)
                        ctx.fillStyle = "rgba(0, 240, 255, 0.15)";
                        ctx.strokeStyle = "#00F0FF";
                        if (eSub === 99) {
                            ctx.fillStyle = "rgba(255, 0, 255, 0.2)";
                            ctx.strokeStyle = "#FF00FF";
                        }
                        ctx.shadowColor = ctx.strokeStyle;
                        ctx.shadowBlur = 8;
                        ctx.lineWidth = 2;

                        ctx.beginPath();
                        ctx.arc(sw / 2, sh / 2, sw / 2, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.stroke();

                        // Draw central icon abbreviation representing Buff Types
                        ctx.shadowBlur = 0;
                        ctx.fillStyle = "#FFF";
                        ctx.font = `600 ${Math.floor(sh * 0.42)}px "JetBrains Mono"`;
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        const buffSymbols = ["SH", "2X", "DJ", "MN", "GL", "MG", "GU"];
                        if (eSub === 99) {
                            ctx.fillText("FL", sw / 2, sh / 2);
                        } else {
                            ctx.fillText(buffSymbols[eSub] || "B", sw / 2, sh / 2);
                        }
                    }
                } else if (eType === 3) {
                    // DEBUFF traps (Neon toxic yellow/orange warning hexagons)
                ctx.fillStyle = "rgba(255, 120, 0, 0.15)";
                ctx.strokeStyle = "#FF9900";
                ctx.shadowColor = "#FF9900";
                ctx.shadowBlur = 7;
                ctx.lineWidth = 2;

                ctx.beginPath();
                // Draw hexagon layout
                for (let hg = 0; hg < 6; hg++) {
                    let angle = (hg * Math.PI) / 3;
                    let hx = sw / 2 + (sw / 2) * Math.cos(angle);
                    let hy = sh / 2 + (sh / 2) * Math.sin(angle);
                    if (hg === 0) ctx.moveTo(hx, hy);
                    else ctx.lineTo(hx, hy);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Abbreviation symbols for debuffs
                ctx.shadowBlur = 0;
                ctx.fillStyle = "#FFF";
                ctx.font = `600 ${Math.floor(sh * 0.38)}px "JetBrains Mono"`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                const debuffSymbols = ["HG", "IC", "SD", "HL", "BL"];
                ctx.fillText(debuffSymbols[eSub] || "D", sw / 2, sh / 2);
            } else if (eType === 4) {
                // BULLET rendering
                ctx.fillStyle = "#FFF";
                ctx.shadowColor = "#00F0FF";
                ctx.shadowBlur = 4;
                ctx.beginPath();
                ctx.roundRect(0, 0, sw, sh, 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            ctx.restore();
        }

        // 4. Dynamic Player character loop
        const px = this.game.getPlayerX();
        const py = this.game.getPlayerY();
        const pw = this.game.getPlayerWidth();
        const ph = this.game.getPlayerHeight();
        const isDucking = this.game.isPlayerDucking();
        
        ctx.save();
        ctx.translate(this.scaleX(px), this.scaleY(py));
        
        const psw = this.scaleW(pw);
        const psh = this.scaleH(ph);

        // Track active vector buffs on player frame
        const buffsMask = this.game.getBuffsMask();
        const debuffsMask = this.game.getDebuffsMask();

        const isMini = (buffsMask & (1 << 3)) > 0;
        const speedMultiplierActive = (buffsMask & (1 << 1)) > 0;
        const glideActive = (buffsMask & (1 << 4)) > 0;
        const magnetActive = (buffsMask & (1 << 5)) > 0;
        const shieldActive = (buffsMask & (1 << 0)) > 0;
        const gunActive = (buffsMask & (1 << 6)) > 0;

        const heavyActive = (debuffsMask & (1 << 0)) > 0;
        const invertedActive = (debuffsMask & (1 << 1)) > 0;
        const bleedActive = (debuffsMask & (1 << 4)) > 0;

        // Render player body
        // Body color: shifts dynamically based on status (blue=buffs, orange=debuffs, green=normal)
        let playerColor = "#00D2C4";
        if (shieldActive) playerColor = "#80F3FF";
        else if (speedMultiplierActive) playerColor = "#FFFF80";
        else if (bleedActive) playerColor = "#FF8080";
        else if (heavyActive) playerColor = "#FF5533";

        // Animated neon core
        ctx.fillStyle = playerColor;
        ctx.shadowColor = playerColor;
        ctx.shadowBlur = 9;

        // Smooth corners for running droid
        ctx.beginPath();
        let r = 6;
        ctx.roundRect(0, 0, psw, psh, r);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Scanning lens visor (eye)
        ctx.fillStyle = "#0D111A";
        ctx.fillRect(psw * 0.4, psh * 0.16, psw * 0.6, psh * 0.2);
        
        // Laser visor core
        ctx.fillStyle = "#FF0055";
        if (shieldActive) ctx.fillStyle = "#00FFFF";
        ctx.fillRect(psw * 0.55, psh * 0.2, psw * 0.45, psh * 0.1);

        // Foot wheels/legs runner pacing rotations
        ctx.fillStyle = "#222D42";
        let wheelRotate = (performance.now() * 0.015);
        let wheelSize = psw * 0.28;
        
        if (this.game.getPlayerY() < (400 - ph - 2)) {
            // Hanging jump feet
            ctx.fillRect(psw * 0.12, psh, psw * 0.18, 5);
            ctx.fillRect(psw * 0.58, psh, psw * 0.18, 5);
        } else {
            // Rolling cycling feet
            ctx.beginPath();
            ctx.arc(psw * 0.28 + Math.cos(wheelRotate) * 2, psh, wheelSize/2, 0, Math.PI * 2);
            ctx.arc(psw * 0.72 + Math.sin(wheelRotate) * 2, psh, wheelSize/2, 0, Math.PI * 2);
            ctx.fill();
        }

        // HUD Overlays
        if (gunActive) {
            ctx.fillStyle = "#888";
            ctx.fillRect(psw * 0.8, psh * 0.4, psw * 0.5, psh * 0.15); // barrel
            ctx.fillRect(psw * 0.8, psh * 0.4, psw * 0.1, psh * 0.4); // grip
            ctx.fillStyle = "#0ff";
            ctx.fillRect(psw * 1.2, psh * 0.42, psw * 0.1, psh * 0.1); // muzzle tip
        }

        if (this.game.flappyModeActive) {
            // Draw jetpack
            ctx.fillStyle = "#AAB";
            ctx.fillRect(-psw * 0.25 + (isDucking ? psw*0.2 : 0), psh * 0.2, psw * 0.35, psh * 0.5);

            // Draw fire rocket when jumping
            if (this.keys['jump']) {
                ctx.fillStyle = "#FF5500";
                ctx.beginPath();
                ctx.moveTo(-psw * 0.1, psh * 0.7);
                ctx.lineTo(-psw * 0.3, psh * 0.7);
                ctx.lineTo(-psw * 0.2 + (Math.random() * 5), psh * 1.2 + Math.random() * 8);
                ctx.fill();
                ctx.fillStyle = "#FFDD00";
                ctx.beginPath();
                ctx.moveTo(-psw * 0.15, psh * 0.7);
                ctx.lineTo(-psw * 0.25, psh * 0.7);
                ctx.lineTo(-psw * 0.2, psh * 1.0 + Math.random() * 5);
                ctx.fill();
            }
        }

        // Draw HUD overlay indications around player (wings for DJ, shield bubble, magnet field)
        if (shieldActive) {
            ctx.strokeStyle = "rgba(0, 240, 255, 0.55)";
            ctx.lineWidth = 2;
            ctx.shadowColor = "#00F0FF";
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(psw / 2, psh / 2, psw * 0.9, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        if (glideActive) {
            // Draw schematic glider wings
            ctx.strokeStyle = "#FFFFB3";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, psh * 0.4);
            ctx.lineTo(-psw * 0.6, psh * 0.1);
            ctx.lineTo(-psw * 0.4, psh * 0.5);
            ctx.closePath();
            ctx.stroke();
        }

        if (magnetActive) {
            // Ring spark emitters
            ctx.strokeStyle = "rgba(0, 255, 120, 0.4)";
            ctx.lineWidth = 1;
            let rippleSize = psw * (1.1 + Math.sin(performance.now() * 0.02) * 0.35);
            ctx.beginPath();
            ctx.arc(psw / 2, psh / 2, rippleSize, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();

        // 5. Particles Engine Tick
        this.particles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * p.decay;

            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillRect(this.scaleX(p.x), this.scaleY(p.y), this.scaleW(p.size), this.scaleH(p.size));
        });
        ctx.globalAlpha = 1.0;
        this.particles = this.particles.filter(p => p.life > 0);

        // Inject runners smoke particles if player grounded
        if (!this.game.isGameOver() && this.game.getPlayerY() >= (400 - ph - 2)) {
            if (Math.random() < 0.28) {
                this.particles.push({
                    x: px,
                    y: 400 - 3,
                    vx: -gameSp * 0.7 - Math.random() * 50,
                    vy: -Math.random() * 32,
                    color: "rgba(120, 140, 160, 0.25)",
                    life: 0.6 + Math.random() * 0.4,
                    decay: 1.8,
                    size: 3 + Math.random() * 4
                });
            }
        }

        // 6. Sandstorm visual screen envelope (Debuff Type 2 overlay)
        if (this.game.getDebuffRemainingTime(2) > 0) {
            let sRem = this.game.getDebuffRemainingTime(2);
            let sOpacity = Math.min(0.72, sRem * 0.8);
            
            // Draw dusty overlay
            ctx.fillStyle = `rgba(210, 140, 60, ${sOpacity})`;
            ctx.fillRect(0, 0, w, h);

            // Sand whiplashes particles
            ctx.strokeStyle = "rgba(255, 220, 180, 0.3)";
            ctx.lineWidth = 1.5;
            for (let sd = 0; sd < 8; sd++) {
                let sy = h * (sd / 8) + Math.sin(performance.now() * 0.01 + sd) * 35;
                ctx.beginPath();
                ctx.moveTo(0, sy);
                ctx.lineTo(w, sy - 40);
                ctx.stroke();
            }
        }

        ctx.restore(); // Complete matrix transform stack

        if (this.game.levelPaused) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = "#FFF";
            ctx.font = `bold ${Math.floor(h * 0.08)}px "Inter", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("NEW LEVEL REACHED", w / 2, h / 2 - 20);
            ctx.font = `normal ${Math.floor(h * 0.04)}px "JetBrains Mono", monospace`;
            ctx.fillStyle = "#00F0FF";
            ctx.fillText("PRESS JUMP TO CONTINUE", w / 2, h / 2 + 40);
        }

        // 7. Update HTML overlay panel lists
        this.syncHTMLOverlay();
    }
    
    syncHTMLOverlay() {
        const hudScore = document.getElementById('hud-score');
        const hudDistance = document.getElementById('hud-distance');
        const hudSpeed = document.getElementById('hud-speed');
        const overlayBox = document.getElementById('indicators-grid');
        const modalGameOver = document.getElementById('modal-gameover');
        
        if (hudScore) hudScore.innerText = this.game.getScore().toLocaleString();
        if (hudDistance) hudDistance.innerText = Math.floor(this.game.getDistance()).toLocaleString() + "m";
        if (hudSpeed) hudSpeed.innerText = Math.floor(this.game.getGameSpeed()) + " u/s";

        if (overlayBox) {
            let rows = '';
            
            // Loop buffs
            for (let i = 0; i < 7; i++) {
                let rem = this.game.getBuffRemainingTime(i);
                if (rem > 0) {
                    let formatted = rem > 500 ? 'INF' : rem.toFixed(1) + 's';
                    rows += `<div class="flex items-center justify-between px-2 py-1 bg-teal-950/40 border border-teal-500/30 rounded text-[11px] text-teal-300 font-mono">
                        <span class="flex items-center gap-1">
                            <span class="h-1.5 w-1.5 bg-teal-400 rounded-full animate-ping"></span>
                            ${BUFF_NAMES[i]}
                        </span>
                        <span class="font-bold font-mono text-xs">${formatted}</span>
                    </div>`;
                }
            }

            // Loop debuffs
            for (let i = 0; i < 5; i++) {
                let rem = this.game.getDebuffRemainingTime(i);
                if (rem > 0) {
                    rows += `<div class="flex items-center justify-between px-2 py-1 bg-amber-950/40 border border-amber-500/30 rounded text-[11px] text-amber-300 font-mono">
                        <span class="flex items-center gap-1">
                            <span class="h-1.5 w-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                            ${DEBUFF_NAMES[i]}
                        </span>
                        <span class="font-bold font-mono text-xs">${rem.toFixed(1)}s</span>
                    </div>`;
                }
            }

            if (!rows) {
                rows = '<div class="col-span-2 text-center text-gray-500 text-xs italic py-2">No active effects. Collect cubes!</div>';
            }

            overlayBox.innerHTML = rows;
        }

        if (modalGameOver) {
            if (this.game.isGameOver()) {
                modalGameOver.classList.remove('hidden');
                const overScore = document.getElementById('overscore');
                if (overScore) overScore.innerText = this.game.getScore();
            } else {
                modalGameOver.classList.add('hidden');
            }
        }
    }
}

// Bind globally as canvas instance initialization trigger inside visual index loader
window.GameViewport = GameViewport;
