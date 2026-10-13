/**
 * CHARMINAR CHAI & BISCUIT RUSH - GAME ENGINE
 * Fast-paced incremental clicker & falling biscuit catcher
 */

(function () {
  // --- Audio Synthesis via Web Audio API (No external sound files required) ---
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playChaiPour() {
      if (!this.enabled || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(740, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    }

    playBiscuitCatch() {
      if (!this.enabled || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.14);
    }

    playSpecialCatch() {
      if (!this.enabled || !this.ctx) return;
      const notes = [587.33, 739.99, 880.0, 1174.66];
      notes.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = this.ctx.currentTime + index * 0.05;
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + 0.18);
      });
    }

    playHazardSound() {
      if (!this.enabled || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    }

    playFrenzySound() {
      if (!this.enabled || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    }
  }

  const sfx = new SoundFX();

  // --- Particle Canvas Engine for Rich Visual Effects ---
  const canvas = document.getElementById('fx-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor(x, y, color, speed, size) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.size = size || Math.random() * 5 + 3;
      const angle = Math.random() * Math.PI * 2;
      const spd = speed || Math.random() * 4 + 2;
      this.vx = Math.cos(angle) * spd;
      this.vy = Math.sin(angle) * spd;
      this.alpha = 1;
      this.decay = Math.random() * 0.03 + 0.02;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
    }

    draw(c) {
      c.save();
      c.globalAlpha = Math.max(0, this.alpha);
      c.fillStyle = this.color;
      c.shadowColor = this.color;
      c.shadowBlur = 8;
      c.beginPath();
      c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }

  function spawnBurst(x, y, color = '#fbbf24', count = 16) {
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(x, y, color));
    }
  }

  function loopParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw(ctx);
      if (particles[i].alpha <= 0) {
        particles.splice(i, 1);
      }
    }
    requestAnimationFrame(loopParticles);
  }
  loopParticles();

  // --- Game State & Upgrades ---
  const state = {
    coins: 0,
    score: 0,
    timeLeft: 60.0,
    maxTime: 60.0,
    isRunning: true,
    cupsServed: 0,
    biscuitsCaught: 0,
    highestCombo: 0,
    currentCombo: 0,
    dumProgress: 0,
    frenzyEnergy: 0,
    isFrenzyActive: false,
    frenzyTimer: 0,
    plateX: 0.5, // 0 to 1 ratio inside sky
    autoChaiPerSec: 0,
    chaiValue: 5,
    biscuitBaseValue: 10,
    plateWidthPx: 130,
    spawnIntervalMs: 850,
  };

  const upgrades = [
    {
      id: 'chhotu_worker',
      name: 'Hire Chhotu Boys',
      desc: 'Automatic chai pours every second (+1 cup/s)',
      icon: '👦',
      level: 0,
      cost: 30,
      costMult: 1.6,
      action: () => {
        state.autoChaiPerSec += 1;
      }
    },
    {
      id: 'dum_kettle',
      name: 'Pure Brass Dum Deg',
      desc: 'Rich mawa dum boils faster & pays +₹4 per cup',
      icon: '🫖',
      level: 0,
      cost: 60,
      costMult: 1.7,
      action: () => {
        state.chaiValue += 4;
      }
    },
    {
      id: 'golden_tray',
      name: 'Wide Silver Osmania Tray',
      desc: 'Expands your biscuit catch tray width by 25px',
      icon: '⚜️',
      level: 0,
      cost: 85,
      costMult: 1.8,
      action: () => {
        state.plateWidthPx += 25;
        updatePlateSize();
      }
    },
    {
      id: 'pista_house_recipe',
      name: 'Secret Zafrani Masala',
      desc: 'Osmania biscuits yield +₹10 each & extra score',
      icon: '✨',
      level: 0,
      cost: 130,
      costMult: 1.85,
      action: () => {
        state.biscuitBaseValue += 10;
      }
    },
    {
      id: 'rush_speed',
      name: 'Charminar Evening Crowd',
      desc: 'More biscuits rain faster from the sky',
      icon: '⚡',
      level: 0,
      cost: 200,
      costMult: 2.0,
      action: () => {
        state.spawnIntervalMs = Math.max(300, state.spawnIntervalMs - 120);
        restartSpawner();
      }
    }
  ];

  const milestones = [
    { id: 'first_chai', name: 'First Sip', icon: '☕', hint: 'Serve your 1st cup of Chai', unlocked: false, check: () => state.cupsServed >= 1 },
    { id: 'catch_10', name: 'Biscuit Master', icon: '🍪', hint: 'Catch 10 Osmania biscuits', unlocked: false, check: () => state.biscuitsCaught >= 10 },
    { id: 'combo_5', name: 'Old City Flow', icon: '🔥', hint: 'Reach a 5x Combo streak', unlocked: false, check: () => state.highestCombo >= 5 },
    { id: 'rich_cafe', name: 'Lakhpati Dream', icon: '🪙', hint: 'Accumulate ₹500 in coins', unlocked: false, check: () => state.coins >= 500 },
    { id: 'frenzy_unleashed', name: 'Dum Toofaan', icon: '⚡', hint: 'Trigger Hyderabadi Dum Frenzy', unlocked: false, check: () => state.isFrenzyActive }
  ];

  // --- UI Elements ---
  const timeDisplay = document.getElementById('time-display');
  const timerPill = document.getElementById('timer-pill');
  const coinsDisplay = document.getElementById('coins-display');
  const scoreDisplay = document.getElementById('score-display');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const cupsServedDisplay = document.getElementById('cups-served-display');
  const chaiRateDisplay = document.getElementById('chai-rate-display');
  const chaiPourBtn = document.getElementById('chai-pour-btn');
  const kettleBtn = document.getElementById('kettle-btn');
  const dumLiquid = document.getElementById('dum-liquid');
  const dumProgressBar = document.getElementById('dum-progress-bar');
  const dumPct = document.getElementById('dum-pct');
  const chaiEarnLabel = document.getElementById('chai-earn-label');

  const skyArea = document.getElementById('sky-area');
  const skyHint = document.getElementById('sky-hint');
  const catcherPlate = document.getElementById('catcher-plate');
  const comboBadge = document.getElementById('combo-badge');
  const comboNumber = document.getElementById('combo-number');
  const streakDisplay = document.getElementById('streak-display');
  const streakBonusText = document.getElementById('streak-bonus-text');
  const emergencyFrenzyBtn = document.getElementById('emergency-frenzy-btn');
  const frenzyGaugeTxt = document.getElementById('frenzy-gauge-txt');

  const upgradesList = document.getElementById('upgrades-list');
  const badgeTray = document.getElementById('badge-tray');
  const flavorText = document.getElementById('live-flavor-text');
  const addTimeBtn = document.getElementById('add-time-btn');
  const restartGameBtn = document.getElementById('restart-game-btn');

  // Modal elements
  const gameOverModal = document.getElementById('game-over-modal');
  const modalChai = document.getElementById('stat-modal-chai');
  const modalBiscuits = document.getElementById('stat-modal-biscuits');
  const modalCoins = document.getElementById('stat-modal-coins');
  const modalCombo = document.getElementById('stat-modal-combo');
  const modalScore = document.getElementById('stat-modal-score');
  const rankName = document.getElementById('rank-name');
  const modalPlayAgainBtn = document.getElementById('modal-play-again-btn');

  // --- Flavor Messages for Old City Atmosphere ---
  const flavorQuotes = [
    `"Ek single Irani chai aur do Osmania, jaldi lao ustaad!"`,
    `"Waah miyan! The aroma of cardamom is filling Lad Bazaar!"`,
    `"Don't let the biscuits break! Dip them hot in cutting chai!"`,
    `"Chhotu is pouring chai from two feet up without spilling a drop!"`,
    `"Evening rush at Charminar! Keep the dum pressure roaring!"`,
    `"Hyderabadis are lining up from Nimrah Cafe all the way to Mecca Masjid!"`
  ];

  function showRandomFlavor() {
    const q = flavorQuotes[Math.floor(Math.random() * flavorQuotes.length)];
    flavorText.textContent = q;
  }
  setInterval(showRandomFlavor, 9000);

  // --- Floating Text Effect ---
  function showFloatingNumber(x, y, text, color = '#fbbf24') {
    const el = document.createElement('div');
    el.className = 'floating-num';
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = color;
    document.body.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 800);
  }

  // --- Audio Toggle ---
  soundToggleBtn.addEventListener('click', () => {
    sfx.init();
    sfx.enabled = !sfx.enabled;
    soundToggleBtn.textContent = sfx.enabled ? '🔊' : '🔇';
  });

  // --- Chai Brewing Mechanics ---
  function pourChai(isAuto = false, event = null) {
    if (!state.isRunning) return;
    sfx.init();

    const multiplier = 1 + (state.currentCombo * 0.1) + (state.isFrenzyActive ? 1.5 : 0);
    const earned = Math.round(state.chaiValue * multiplier);
    const scoreAdd = Math.round(15 * multiplier);

    state.coins += earned;
    state.score += scoreAdd;
    state.cupsServed += 1;

    // Frenzy energy accumulation
    gainFrenzy(1.5);

    if (event) {
      sfx.playChaiPour();
      spawnBurst(event.clientX, event.clientY, '#f59e0b', 8);
      showFloatingNumber(event.clientX, event.clientY, `+₹${earned}`);
    }

    updateUI();
    checkMilestones();
  }

  function pumpKettle(event) {
    if (!state.isRunning) return;
    sfx.init();
    sfx.playChaiPour();

    state.dumProgress += 18;
    gainFrenzy(3);

    if (event) {
      spawnBurst(event.clientX, event.clientY, '#fbbf24', 12);
      showFloatingNumber(event.clientX, event.clientY, `+Steam! 🔥`, '#f59e0b');
    }

    if (state.dumProgress >= 100) {
      state.dumProgress = 0;
      // Bonus big pour!
      const bonusCoins = state.chaiValue * 3;
      state.coins += bonusCoins;
      state.score += 60;
      state.cupsServed += 3;
      spawnBurst(event ? event.clientX : window.innerWidth / 3, event ? event.clientY : window.innerHeight / 2, '#34d399', 24);
      if (event) {
        showFloatingNumber(event.clientX, event.clientY, `DUM SERVED! +₹${bonusCoins} ☕☕☕`, '#34d399');
      }
    }
    updateUI();
  }

  chaiPourBtn.addEventListener('click', (e) => pourChai(false, e));
  kettleBtn.addEventListener('click', (e) => pumpKettle(e));

  // --- Frenzy Mechanics ---
  function gainFrenzy(amount) {
    if (state.isFrenzyActive) return;
    state.frenzyEnergy = Math.min(100, state.frenzyEnergy + amount);
    emergencyFrenzyBtn.disabled = state.frenzyEnergy < 100;
    frenzyGaugeTxt.textContent = `${Math.floor(state.frenzyEnergy)}%`;
  }

  emergencyFrenzyBtn.addEventListener('click', () => {
    if (state.frenzyEnergy >= 100 && !state.isFrenzyActive) {
      triggerFrenzy();
    }
  });

  function triggerFrenzy() {
    state.isFrenzyActive = true;
    state.frenzyTimer = 8.0; // 8 seconds of hyper frenzy
    state.frenzyEnergy = 0;
    emergencyFrenzyBtn.disabled = true;
    sfx.playFrenzySound();
    flavorText.textContent = "⚡ CHARMINAR TOUFAAN! All biscuits and chai worth TRIPLE! Biscuits raining like crazy!";
    spawnBurst(window.innerWidth / 2, window.innerHeight / 2, '#9333ea', 50);
    checkMilestones();
  }

  // --- Falling Biscuits Arena ---
  let activeFallingItems = [];
  let spawnerTimer = null;

  function updatePlateSize() {
    catcherPlate.style.width = `${state.plateWidthPx}px`;
  }

  // Mouse / Touch movement for Catcher Tray
  skyArea.addEventListener('mousemove', (e) => {
    const rect = skyArea.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    state.plateX = x / rect.width;
    catcherPlate.style.left = `${x}px`;
    skyHint.style.display = 'none';
  });

  skyArea.addEventListener('touchmove', (e) => {
    if (!e.touches[0]) return;
    const rect = skyArea.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.touches[0].clientX - rect.left));
    state.plateX = x / rect.width;
    catcherPlate.style.left = `${x}px`;
    skyHint.style.display = 'none';
  }, { passive: true });

  class FallingBiscuit {
    constructor() {
      const rect = skyArea.getBoundingClientRect();
      this.width = 52;
      this.height = 52;
      this.x = Math.random() * (rect.width - 60) + 30;
      this.y = -40;
      this.speed = Math.random() * 2.2 + 2.5 + (state.isFrenzyActive ? 3.0 : 0);
      this.rotation = 0;
      this.rotSpeed = (Math.random() - 0.5) * 6;

      // Item types: 72% Regular Osmania, 18% Special Golden Osmania, 10% Burnt Hazard
      const rand = Math.random();
      if (rand < 0.12) {
        this.type = 'hazard'; // Burnt biscuit
      } else if (rand < 0.32) {
        this.type = 'golden'; // Zafrani Golden biscuit
      } else {
        this.type = 'normal'; // Classic Osmania
      }

      this.el = document.createElement('div');
      this.el.className = 'falling-item';
      
      const biscuitEl = document.createElement('div');
      biscuitEl.className = 'osmania-biscuit';

      if (this.type === 'normal') {
        biscuitEl.textContent = 'OSMANIA';
      } else if (this.type === 'golden') {
        biscuitEl.classList.add('special-golden');
        biscuitEl.textContent = '⭐ GOLD';
      } else if (this.type === 'hazard') {
        biscuitEl.classList.add('burnt-hazard');
        biscuitEl.textContent = 'BURNT!';
      }

      this.el.appendChild(biscuitEl);

      // Direct click on biscuit also catches it!
      this.el.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        this.catchItem(e.clientX, e.clientY);
      });
      this.el.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        const touch = e.touches[0];
        this.catchItem(touch.clientX, touch.clientY);
      }, { passive: true });

      skyArea.appendChild(this.el);
    }

    update(delta) {
      this.y += this.speed * (delta / 16.6);
      this.rotation += this.rotSpeed;
      this.el.style.left = `${this.x}px`;
      this.el.style.top = `${this.y}px`;
      this.el.style.transform = `translate(-50%, -50%) rotate(${this.rotation}deg)`;

      // Check collision with plate
      const rect = skyArea.getBoundingClientRect();
      const plateBottomY = rect.height - 20;
      const plateTopY = rect.height - 48;
      const plateLeft = (state.plateX * rect.width) - (state.plateWidthPx / 2);
      const plateRight = (state.plateX * rect.width) + (state.plateWidthPx / 2);

      if (this.y >= plateTopY && this.y <= plateBottomY) {
        if (this.x >= plateLeft && this.x <= plateRight) {
          const clientX = rect.left + this.x;
          const clientY = rect.top + this.y;
          this.catchItem(clientX, clientY);
          return false;
        }
      }

      // Check offscreen bottom
      if (this.y > rect.height + 40) {
        this.destroy();
        if (this.type !== 'hazard') {
          // Missed non-hazard biscuit breaks combo streak
          resetCombo();
        }
        return false;
      }

      return true;
    }

    catchItem(clientX, clientY) {
      sfx.init();

      if (this.type === 'hazard') {
        sfx.playHazardSound();
        spawnBurst(clientX, clientY, '#ef4444', 20);
        showFloatingNumber(clientX, clientY, '-₹25! BURNT!', '#ef4444');
        state.coins = Math.max(0, state.coins - 25);
        resetCombo();
      } else {
        state.biscuitsCaught += 1;
        state.currentCombo += 1;
        if (state.currentCombo > state.highestCombo) {
          state.highestCombo = state.currentCombo;
        }

        const comboMult = 1 + (state.currentCombo * 0.15);
        const frenzyMult = state.isFrenzyActive ? 3.0 : 1.0;

        let baseVal = state.biscuitBaseValue;
        if (this.type === 'golden') baseVal *= 3;

        const earned = Math.round(baseVal * comboMult * frenzyMult);
        const scoreEarned = Math.round(30 * comboMult * frenzyMult);

        state.coins += earned;
        state.score += scoreEarned;

        gainFrenzy(this.type === 'golden' ? 12 : 5);

        if (this.type === 'golden') {
          sfx.playSpecialCatch();
          spawnBurst(clientX, clientY, '#facc15', 30);
          showFloatingNumber(clientX, clientY, `GOLDEN OSMANIA! +₹${earned} ⭐`, '#facc15');
        } else {
          sfx.playBiscuitCatch();
          spawnBurst(clientX, clientY, '#fbbf24', 16);
          showFloatingNumber(clientX, clientY, `+₹${earned}`);
        }
      }

      this.destroy();
      updateUI();
      checkMilestones();
    }

    destroy() {
      if (this.el && this.el.parentNode) {
        this.el.parentNode.removeChild(this.el);
      }
    }
  }

  function resetCombo() {
    if (state.currentCombo > 0) {
      state.currentCombo = 0;
      comboBadge.classList.remove('active');
      updateUI();
    }
  }

  function spawnFallingBiscuit() {
    if (!state.isRunning) return;
    const biscuit = new FallingBiscuit();
    activeFallingItems.push(biscuit);

    if (state.isFrenzyActive) {
      // Spawn bonus extra in frenzy mode
      const extra = new FallingBiscuit();
      activeFallingItems.push(extra);
    }
  }

  function restartSpawner() {
    if (spawnerTimer) clearInterval(spawnerTimer);
    const interval = state.isFrenzyActive ? Math.max(220, state.spawnIntervalMs / 2) : state.spawnIntervalMs;
    spawnerTimer = setInterval(spawnFallingBiscuit, interval);
  }

  // --- Upgrades Rendering & Purchasing ---
  function renderUpgrades() {
    upgradesList.innerHTML = '';
    upgrades.forEach((upg) => {
      const item = document.createElement('div');
      item.className = 'upgrade-item';
      if (state.coins < upg.cost) {
        item.classList.add('disabled');
      }

      item.innerHTML = `
        <div class="upg-left">
          <span class="upg-icon">${upg.icon}</span>
          <div class="upg-info">
            <span class="upg-name">${upg.name}</span>
            <span class="upg-desc">${upg.desc}</span>
          </div>
        </div>
        <div class="upg-right">
          <span class="upg-cost">₹${upg.cost}</span>
          <span class="upg-lvl">Lvl ${upg.level}</span>
        </div>
      `;

      item.addEventListener('click', () => {
        if (state.coins >= upg.cost) {
          buyUpgrade(upg);
        }
      });

      upgradesList.appendChild(item);
    });
  }

  function buyUpgrade(upg) {
    state.coins -= upg.cost;
    upg.level += 1;
    upg.cost = Math.round(upg.cost * upg.costMult);
    upg.action();

    sfx.init();
    sfx.playSpecialCatch();
    spawnBurst(window.innerWidth * 0.85, window.innerHeight * 0.4, '#10b981', 18);
    showFloatingNumber(window.innerWidth * 0.85, window.innerHeight * 0.4, `UPGRADED! 🚀`, '#10b981');

    updateUI();
    checkMilestones();
  }

  // --- Milestones System ---
  function renderMilestones() {
    badgeTray.innerHTML = '';
    milestones.forEach((m) => {
      const badge = document.createElement('div');
      badge.className = 'achieve-badge';
      if (m.unlocked) badge.classList.add('unlocked');
      badge.title = `${m.name}: ${m.hint}`;
      badge.innerHTML = `<span>${m.icon}</span> <span>${m.name}</span>`;
      badgeTray.appendChild(badge);
    });
  }

  function checkMilestones() {
    let newUnlocked = false;
    milestones.forEach((m) => {
      if (!m.unlocked && m.check()) {
        m.unlocked = true;
        newUnlocked = true;
        state.score += 200;
        showFloatingNumber(window.innerWidth / 2, 100, `🏆 MILESTONE: ${m.name}! (+200 Score)`, '#fbbf24');
        sfx.playSpecialCatch();
      }
    });
    if (newUnlocked) {
      renderMilestones();
    }
  }

  // --- Quick Rush Time Purchase ---
  addTimeBtn.addEventListener('click', () => {
    if (state.coins >= 50 && state.isRunning) {
      state.coins -= 50;
      state.timeLeft += 15.0;
      state.maxTime += 15.0;
      sfx.playSpecialCatch();
      spawnBurst(window.innerWidth / 2, window.innerHeight - 80, '#34d399', 20);
      showFloatingNumber(window.innerWidth / 2, window.innerHeight - 80, `+15s RUSH TIME! ⏱️`, '#34d399');
      updateUI();
    } else {
      showFloatingNumber(window.innerWidth / 2, window.innerHeight - 80, `Need ₹50 to buy time!`, '#ef4444');
    }
  });

  restartGameBtn.addEventListener('click', () => {
    resetGameSession();
  });

  modalPlayAgainBtn.addEventListener('click', () => {
    gameOverModal.style.display = 'none';
    resetGameSession();
  });

  // --- Game Loop (60 FPS) ---
  let lastTime = performance.now();
  let secondAccumulator = 0;

  function gameLoop(now) {
    const delta = now - lastTime;
    lastTime = now;

    if (state.isRunning) {
      // Countdown Timer
      state.timeLeft -= delta / 1000;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        endGame();
      }

      // Frenzy Countdown
      if (state.isFrenzyActive) {
        state.frenzyTimer -= delta / 1000;
        if (state.frenzyTimer <= 0) {
          state.isFrenzyActive = false;
          frenzyGaugeTxt.textContent = '0%';
          restartSpawner();
        }
      }

      // Passive Auto Chai Pours every second
      secondAccumulator += delta;
      if (secondAccumulator >= 1000) {
        secondAccumulator -= 1000;
        if (state.autoChaiPerSec > 0) {
          for (let i = 0; i < state.autoChaiPerSec; i++) {
            pourChai(true);
          }
        }
      }

      // Update falling biscuits
      for (let i = activeFallingItems.length - 1; i >= 0; i--) {
        const item = activeFallingItems[i];
        const isAlive = item.update(delta);
        if (!isAlive) {
          activeFallingItems.splice(i, 1);
        }
      }

      // Refresh real-time displays
      timeDisplay.textContent = `${state.timeLeft.toFixed(1)}s`;
      if (state.timeLeft <= 10) {
        timerPill.style.animation = 'pulseGlow 0.5s infinite alternate';
      } else {
        timerPill.style.animation = 'none';
      }
    }

    requestAnimationFrame(gameLoop);
  }

  // --- UI Update Function ---
  function updateUI() {
    coinsDisplay.textContent = `₹${state.coins.toLocaleString()}`;
    scoreDisplay.textContent = state.score.toLocaleString();
    cupsServedDisplay.textContent = state.cupsServed;
    chaiRateDisplay.textContent = `${state.autoChaiPerSec}/s`;
    chaiEarnLabel.textContent = `+1 Cup (+₹${state.chaiValue})`;

    dumPct.textContent = `${Math.floor(state.dumProgress)}%`;
    dumProgressBar.style.width = `${state.dumProgress}%`;

    comboNumber.textContent = `${state.currentCombo}x`;
    if (state.currentCombo >= 2) {
      comboBadge.classList.add('active');
    } else {
      comboBadge.classList.remove('active');
    }

    streakDisplay.textContent = state.currentCombo;
    streakBonusText.textContent = `x${(1 + state.currentCombo * 0.15).toFixed(1)} Multiplier`;

    frenzyGaugeTxt.textContent = state.isFrenzyActive
      ? `ACTIVE: ${state.frenzyTimer.toFixed(1)}s`
      : `${Math.floor(state.frenzyEnergy)}%`;

    renderUpgrades();
  }

  function endGame() {
    state.isRunning = false;
    if (spawnerTimer) clearInterval(spawnerTimer);

    // Clear falling biscuits
    activeFallingItems.forEach((b) => b.destroy());
    activeFallingItems = [];

    // Calculate Rank
    let rank = 'Irani Chai Chhotu ☕';
    if (state.score > 5000) {
      rank = 'Sultan of Charminar 👑';
    } else if (state.score > 3000) {
      rank = 'Nimrah Cafe Master Ustaad 🏆';
    } else if (state.score > 1500) {
      rank = 'Old City Dum Specialist 🫖';
    } else if (state.score > 600) {
      rank = 'Osmania Biscuit Baker 🍪';
    }

    modalChai.textContent = state.cupsServed;
    modalBiscuits.textContent = state.biscuitsCaught;
    modalCoins.textContent = `₹${state.coins}`;
    modalCombo.textContent = `${state.highestCombo}x`;
    modalScore.textContent = state.score;
    rankName.textContent = rank;

    gameOverModal.style.display = 'flex';
  }

  function resetGameSession() {
    state.timeLeft = 60.0;
    state.maxTime = 60.0;
    state.coins = 0;
    state.score = 0;
    state.cupsServed = 0;
    state.biscuitsCaught = 0;
    state.currentCombo = 0;
    state.highestCombo = 0;
    state.dumProgress = 0;
    state.frenzyEnergy = 0;
    state.isFrenzyActive = false;
    state.autoChaiPerSec = 0;
    state.chaiValue = 5;
    state.biscuitBaseValue = 10;
    state.plateWidthPx = 130;
    state.spawnIntervalMs = 850;
    state.isRunning = true;

    // Reset upgrades
    upgrades.forEach((u) => {
      u.level = 0;
      if (u.id === 'chhotu_worker') u.cost = 30;
      if (u.id === 'dum_kettle') u.cost = 60;
      if (u.id === 'golden_tray') u.cost = 85;
      if (u.id === 'pista_house_recipe') u.cost = 130;
      if (u.id === 'rush_speed') u.cost = 200;
    });

    updatePlateSize();
    updateUI();
    renderMilestones();
    restartSpawner();
    lastTime = performance.now();
  }

  // --- Initialize ---
  updatePlateSize();
  updateUI();
  renderMilestones();
  restartSpawner();
  requestAnimationFrame(gameLoop);
})();
