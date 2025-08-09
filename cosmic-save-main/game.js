const currentPage = window.location.pathname.split('/').pop();

let canvas, ctx, scoreDisplay, livesDisplay, levelDisplay, currencyDisplay,
    startScreen, pauseScreen, gameOverScreen, bossWarning, finalScoreDisplay,
    startGameBtn, resumeBtn, restartBtn, restartPauseBtn, dialogue,
    achievementNotification, touchControls, joystickBase, joystickKnob, touchShoot,
    score = 0, lives = 3, level = 1, currency =  parseInt(localStorage.getItem('currency')) || 0
    gameOver = false, paused = false, gameStarted = false, asteroidSpeed = 1,
    asteroidSpawnRate = 2000, bossActive = false, boss = null, bossBullets = [],
    bossDialogueTimer = 0, lastBossPowerUp = 0, hitFlashTimer = 0,
    backgroundObjects = [], initialLives = 3, asteroidInterval = null, enemyInterval = null,
    damageFlashTimer = 0;

const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  ArrowDown: false,
  Space: false,
  KeyP: false
};

let touchState = { dx: 0, dy: 0, shoot: false };

const achievements = [
  {
    id: 'soldier_vorath_no_damage',
    name: 'Imbatível contra Soldado Vorath',
    description: 'Derrote o Soldado Vorath sem perder nenhuma vida.',
    unlocked: localStorage.getItem('achievement_soldier_vorath_no_damage') === 'true' || false
  },
  {
    id: 'defeat_commander_vorath',
    name: 'Destruidor de Comandantes',
    description: 'Derrote o Comandante Vorath.',
    unlocked: localStorage.getItem('achievement_defeat_commander_vorath') === 'true' || false
  },
  {
    id: 'defeat_general_vorath',
    name: 'General Derrotado',
    description: 'Derrote o General Vorath.',
    unlocked: localStorage.getItem('achievement_defeat_general_vorath') === 'true' || false
  },
  {
    id: 'defeat_emperor_zethar',
    name: 'Herói da Galáxia',
    description: 'Derrote o Imperador Zethar.',
    unlocked: localStorage.getItem('achievement_defeat_emperor_zethar') === 'true' || false
  },
  {
    id: 'high_score_1000',
    name: 'Mestre dos Pontos',
    description: 'Alcance 1000 pontos em uma única partida.',
    unlocked: localStorage.getItem('achievement_high_score_1000') === 'true' || false
  },
  {
    id: 'survive_5_minutes',
    name: 'Sobrevivente Cósmico',
    description: 'Sobreviva por 5 minutos sem perder todas as vidas.',
    unlocked: localStorage.getItem('achievement_survive_5_minutes') === 'true' || false
  }
];

const upgrades = {
  health: {
  levels: [3, 4, 5, 6, 7, 8, 9, 10], // Capped at 10
  costs: [100, 200, 400, 800, 1600, 3200, 6400],
  level: parseInt(localStorage.getItem('healthLevel')) || 0
},
  powerUpDuration: {
  levels: [5000, 6000, 7000, 8000, 9000, 10000], // 5s to 10s
  costs: [150, 300, 600, 1200, 2400],
  level: parseInt(localStorage.getItem('powerUpDurationLevel')) || 0
},
  speed: {
    levels: [5, 6, 7, 8],
    costs: [100, 200, 400],
    level: parseInt(localStorage.getItem('speedLevel')) || 0
  },
  fireRate: {
  levels: [500, 400, 300, 250], // Adjusted max to 250 to ensure shooting
  costs: [150, 300, 600],
  level: parseInt(localStorage.getItem('fireRateLevel')) || 0
  }
};

const ships = [
  { id: 'default', name: 'Nave Padrão', color: '#00ff88', cost: 0, unlocked: true, thrusterColor: '#ff8800', laserColor: '#ff4444', laserShape: 'rect' },
  { id: 'rainbow', name: 'Nave Arco-Íris', color: 'rainbow', cost: 0, unlocked: localStorage.getItem('achievement_defeat_emperor_zethar') === 'true' || false, thrusterColor: '#ff8800', laserColor: '#ff4444', laserShape: 'rect' },
  { id: 'fire', name: 'Nave de Fogo', color: '#ff4444', cost: 500, unlocked: localStorage.getItem('ship_fire') === 'true' || false, thrusterColor: '#ff8800', laserColor: '#ff4444', laserShape: 'rect' },
  { id: 'ice', name: 'Nave de Gelo', color: '#00b7eb', cost: 500, unlocked: localStorage.getItem('ship_ice') === 'true' || false, thrusterColor: '#ffffff', laserColor: '#00b7eb', laserShape: 'rect' },
  { id: 'plasma', name: 'Nave de Plasma', color: '#aa00ff', cost: 500, unlocked: localStorage.getItem('ship_plasma') === 'true' || false, thrusterColor: '#ff00ff', laserColor: '#ff00ff', laserShape: 'rect' },
  { id: 'black_hole', name: 'Nave de Singularidade', color: '#000000', cost: 1200, unlocked: localStorage.getItem('ship_black_hole') === 'true' || false, thrusterColor: '#8b0000', laserColor: '#ff0000', laserShape: 'rect', effect: 'distortion' },
  { id: 'nebula', name: 'Nave de Nebulosa', color: 'gradient', cost: 1000, unlocked: localStorage.getItem('ship_nebula') === 'true' || false, thrusterColor: 'gradient', laserColor: '#aa00ff', laserShape: 'rect' },
  { id: 'stellar_crystal', name: 'Nave de Cristal Estelar', color: '#00b7eb', cost: 1000, unlocked: localStorage.getItem('ship_stellar_crystal') === 'true' || false, thrusterColor: '#ffffff', laserColor: '#ffffff', laserShape: 'rect' },
  { id: 'alien_relic', name: 'Nave de Relíquia Alienígena', color: '#006400', cost: 1000, unlocked: localStorage.getItem('ship_alien_relic') === 'true' || false, thrusterColor: '#00ff00', laserColor: '#00ff00', laserShape: 'rect' },
  { id: 'cosmic_storm', name: 'Nave de Tempestade Cósmica', color: '#333333', cost: 1000, unlocked: localStorage.getItem('ship_cosmic_storm') === 'true' || false, thrusterColor: '#00b7eb', laserColor: '#00b7eb', laserShape: 'rect' }
];
let currentShip = ships.find(ship => ship.id === (localStorage.getItem('currentShip') || 'default')) || ships[0];

const player = {
  x: 0,
  y: 0,
  width: 40,
  height: 40,
  speed: upgrades.speed.levels[upgrades.speed.level],
  dx: 0,
  dy: 0,
  shield: false,
  fastShot: false,
  spreadShot: false,
  doubleShot: false,
  homingShot: false,
  fireRate: upgrades.fireRate.levels[upgrades.fireRate.level],
  lastShot: 0
};
const bullets = [];
const asteroids = [];
const enemies = [];
const powerUps = [];
const particles = [];
const stars = [];

const bulletSpeed = 7;
const bulletWidth = 5;
const bulletHeight = 10;
const asteroidSize = 30;
const enemySize = 25;
const largeEnemySize = 40;
const bossBulletWidth = 10;
const bossBulletHeight = 20;
const bossBulletSpeed = 1.5;
const enemySpawnRate = 6000;
let gameStartTime = 0;

let starfieldCanvas, starfieldCtx;

function initializeStarfield() {
  starfieldCanvas = document.getElementById('starfield');
  if (starfieldCanvas) {
    starfieldCtx = starfieldCanvas.getContext('2d');
    resizeStarfield();
    createStars();
    animateStarfield();
  }
}

function resizeStarfield() {
  if (starfieldCanvas) {
    starfieldCanvas.width = window.innerWidth;
    starfieldCanvas.height = window.innerHeight;
    starfieldCanvas.style.position = 'fixed';
    starfieldCanvas.style.top = '0';
    starfieldCanvas.style.left = '0';
    starfieldCanvas.style.zIndex = '-1';
  }
}

function createStars() {
  stars.length = 0;
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: Math.random() * (starfieldCanvas ? starfieldCanvas.width : canvas.width),
      y: Math.random() * (starfieldCanvas ? starfieldCanvas.height : canvas.height),
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.1
    });
  }
  backgroundObjects.length = 0;
  for (let i = 0; i < 3; i++) {
    backgroundObjects.push({
      x: Math.random() * (starfieldCanvas ? starfieldCanvas.width : canvas.width),
      y: Math.random() * (starfieldCanvas ? starfieldCanvas.height : canvas.height),
      size: Math.random() * 100 + 50,
      opacity: Math.random() * 0.2 + 0.1,
      speed: Math.random() * 0.2 + 0.05
    });
  }
}

function drawStars() {
  const targetCtx = starfieldCtx || ctx;
  backgroundObjects.forEach(obj => {
    targetCtx.fillStyle = `rgba(100, 100, 255, ${obj.opacity})`;
    targetCtx.beginPath();
    targetCtx.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2);
    targetCtx.fill();
  });
  targetCtx.fillStyle = '#fff';
  stars.forEach(star => {
    targetCtx.beginPath();
    targetCtx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    targetCtx.fill();
  });
}

function updateStars() {
  stars.forEach(star => {
    star.y += star.speed;
    if (star.y > (starfieldCanvas ? starfieldCanvas.height : canvas.height)) star.y = 0;
  });
  backgroundObjects.forEach(obj => {
    obj.y += obj.speed;
    if (obj.y > (starfieldCanvas ? starfieldCanvas.height : canvas.height) + obj.size) obj.y = -obj.size;
  });
}

function animateStarfield() {
  if (!starfieldCtx) return;
  starfieldCtx.clearRect(0, 0, starfieldCanvas.width, starfieldCanvas.height);
  drawStars();
  updateStars();
  requestAnimationFrame(animateStarfield);
}

function spawnParticles(x, y, count, type = 'default') {
  for (let i = 0; i < count; i++) {
    let particle;
    if (type === 'nebula') {
      particle = {
        x: x,
        y: y,
        size: Math.random() * 3 + 1,
        color: ['#aa00ff', '#0000ff', '#ff69b4'][Math.floor(Math.random() * 3)],
        speed: Math.random() * 2 + 1,
        angle: Math.random() * Math.PI * 2,
        type: 'nebula',
        orbitRadius: 5 + Math.random() * 5
      };
    } else if (type === 'cosmic_storm') {
      particle = {
        x: x,
        y: y,
        size: Math.random() * 2 + 1,
        color: '#00b7eb',
        speed: Math.random() * 3 + 1,
        angle: Math.random() * Math.PI * 2,
        type: 'cosmic_storm',
        life: Math.random() * 20 + 10
      };
    } else {
      particle = {
        x: x,
        y: y,
        size: Math.random() * 5 + 2,
        dx: Math.random() * 4 - 2,
        dy: Math.random() * 4 - 2,
        life: 30,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        alpha: 1,
        type: 'default'
      };
    }
    particles.push(particle);
  }
}

function updateParticles() {
  particles.forEach((particle, index) => {
    if (particle.type === 'nebula') {
      particle.angle += 0.05;
      particle.x = player.x + player.width / 2 + Math.cos(particle.angle) * particle.orbitRadius;
      particle.y = player.y + player.height + Math.sin(particle.angle) * particle.orbitRadius;
    } else if (particle.type === 'cosmic_storm') {
      particle.x += Math.cos(particle.angle) * particle.speed;
      particle.y += Math.sin(particle.angle) * particle.speed;
      particle.life--;
      if (particle.life <= 0) {
        particles.splice(index, 1);
      }
    } else {
      particle.x += particle.dx;
      particle.y += particle.dy;
      particle.life--;
      particle.alpha = particle.life / 30;
      if (particle.life <= 0) {
        particles.splice(index, 1);
      }
    }
  });
}

function drawParticles() {
  particles.forEach(particle => {
    ctx.save();
    if (particle.type === 'cosmic_storm') {
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(particle.x + Math.cos(particle.angle) * 10, particle.y + Math.sin(particle.angle) * 10);
      ctx.stroke();
    } else {
      ctx.globalAlpha = particle.alpha || 1;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function initializeGame() {
  console.log('Inicializando jogo...');
  console.log('Estado de keys:', keys);
  console.log('Estado de touchState:', touchState);
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  scoreDisplay = document.getElementById('score');
  livesDisplay = document.getElementById('lives');
  levelDisplay = document.getElementById('level');
  currencyDisplay = document.getElementById('currency');
  startScreen = document.getElementById('start-screen');
  pauseScreen = document.getElementById('pause-screen');
  gameOverScreen = document.getElementById('game-over');
  bossWarning = document.getElementById('boss-warning');
  finalScoreDisplay = document.getElementById('final-score');
  startGameBtn = document.getElementById('start-game-btn');
  resumeBtn = document.getElementById('resume-btn');
  restartBtn = document.getElementById('restart-btn');
  restartPauseBtn = document.getElementById('restart-pause-btn');
  dialogue = document.getElementById('dialogue');
  achievementNotification = document.getElementById('achievement-notification');
  touchControls = document.getElementById('touch-controls');
  joystickBase = document.getElementById('joystick-base');
  joystickKnob = document.getElementById('joystick-knob');
  touchShoot = document.getElementById('touch-shoot');

  if (!canvas || !ctx || !scoreDisplay || !livesDisplay || !levelDisplay || !currencyDisplay ||
      !startScreen || !pauseScreen || !gameOverScreen || !bossWarning || !finalScoreDisplay ||
      !startGameBtn || !resumeBtn || !restartBtn || !restartPauseBtn || !dialogue ||
      !achievementNotification || !touchControls || !joystickBase || !joystickKnob || !touchShoot) {
    console.error('Um ou mais elementos HTML não foram encontrados em game.html. Verifique os IDs.');
    return;
  }

  function resizeCanvas() {
    const canvasWidth = window.innerWidth * 0.5;
    const canvasHeight = canvasWidth * (3 / 4);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    player.x = canvas.width / 2;
    player.y = canvas.height - 50;
    canvas.style.display = 'block';
    if ('ontouchstart' in window) {
      touchControls.style.display = 'flex';
      joystickBase.style.display = 'block';
      joystickKnob.style.display = 'block';
      touchShoot.style.display = 'block';
      const baseSize = canvasWidth < 600 ? 80 : 100;
      const knobSize = canvasWidth < 600 ? 40 : 50;
      joystickBase.style.width = `${baseSize}px`;
      joystickBase.style.height = `${baseSize}px`;
      joystickKnob.style.width = `${knobSize}px`;
      joystickKnob.style.height = `${knobSize}px`;
      const canvasRect = canvas.getBoundingClientRect();
      joystickBase.style.left = `${canvasRect.left + 20}px`;
      joystickBase.style.bottom = `${window.innerHeight - canvasRect.bottom + (canvasHeight < 600 ? 10 : 20)}px`;
      touchShoot.style.right = `${window.innerWidth - canvasRect.right + 20}px`;
      touchShoot.style.bottom = `${window.innerHeight - canvasRect.bottom + (canvasHeight < 600 ? 10 : 20)}px`;
    }
  }
  window.addEventListener('resize', () => {
    resizeCanvas();
    resizeStarfield();
  });
  resizeCanvas();

  let joystickActive = false;
  let joystickCenterX, joystickCenterY;

  function setupTouchControls() {
    if ('ontouchstart' in window) {
      joystickBase.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        if (touch.clientX < window.innerWidth / 2) {
          joystickActive = true;
          const rect = joystickBase.getBoundingClientRect();
          joystickCenterX = rect.left + rect.width / 2;
          joystickCenterY = rect.top + rect.height / 2;
          handleJoystickMove(e);
        }
      });
      joystickBase.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (joystickActive) {
          handleJoystickMove(e);
        }
      });
      joystickBase.addEventListener('touchend', () => {
        joystickActive = false;
        touchState.dx = 0;
        touchState.dy = 0;
        const baseSize = canvas.width < 600 ? 80 : 100;
        const knobSize = canvas.width < 600 ? 40 : 50;
        joystickKnob.style.left = `${canvas.getBoundingClientRect().left + 20 + baseSize / 2 - knobSize / 2}px`;
        joystickKnob.style.top = `${window.innerHeight - canvas.getBoundingClientRect().bottom + (canvas.height < 600 ? 10 : 20) + baseSize / 2 - knobSize / 2}px`;
      });
      touchShoot.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchState.shoot = true;
        if (!gameOver && !paused && gameStarted) shoot();
      });
      touchShoot.addEventListener('touchend', () => {
        touchState.shoot = false;
      });
    }
  }

  function handleJoystickMove(e) {
    const touch = e.touches[0];
    const dx = touch.clientX - joystickCenterX;
    const dy = touch.clientY - joystickCenterY;
    const maxRadius = canvas.width < 600 ? 40 : 50;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const scale = Math.min(distance, maxRadius) / maxRadius;
    touchState.dx = Math.cos(angle) * scale * player.speed;
    touchState.dy = Math.sin(angle) * scale * player.speed;
    const knobX = Math.cos(angle) * Math.min(distance, maxRadius);
    const knobY = Math.sin(angle) * Math.min(distance, maxRadius);
    joystickKnob.style.left = `${joystickCenterX + knobX - (canvas.width < 600 ? 20 : 25)}px`;
    joystickKnob.style.top = `${joystickCenterY + knobY - (canvas.width < 600 ? 20 : 25)}px`;
  }

  setupTouchControls();

  document.addEventListener('keydown', (e) => {
    if (e.code in keys) {
      keys[e.code] = true;
      e.preventDefault();
    }
    if (e.code === 'KeyP' && gameStarted && !gameOver) togglePause();
  });

  document.addEventListener('keyup', (e) => {
    if (e.code in keys) keys[e.code] = false;
  });

  window.addEventListener('blur', () => {
    if (gameStarted && !gameOver && !paused) togglePause();
  });

  startGameBtn.addEventListener('click', () => {
    console.log('Botão Iniciar Jogo clicado');
    playSound('menuClick'); // Adicionado
    startGame();
  });
  resumeBtn.addEventListener('click', () => {
    console.log('Botão Continuar clicado');
    playSound('menuClick'); // Adicionado
    togglePause();
  });
  restartBtn.addEventListener('click', () => {
    console.log('Botão Reiniciar (Game Over) clicado');
    playSound('menuClick'); // Adicionado
    returnToMenu();
  });
  restartPauseBtn.addEventListener('click', () => {
    console.log('Botão Reiniciar (Pausa) clicado');
    playSound('menuClick'); // Adicionado
    returnToMenu();
  });

  initializeStarfield();
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
  const rotation = (keys && (keys.ArrowLeft || touchState.dx < 0)) ? -0.2 : (keys && (keys.ArrowRight || touchState.dx > 0)) ? 0.2 : 0;
  ctx.rotate(rotation);

  if (currentShip.id === 'nebula') {
    const gradient = ctx.createLinearGradient(-player.width / 2, -player.height / 2, player.width / 2, player.height / 2);
    gradient.addColorStop(0, '#aa00ff');
    gradient.addColorStop(0.5, '#0000ff');
    gradient.addColorStop(1, '#ff69b4');
    ctx.fillStyle = gradient;
  } else if (currentShip.id === 'stellar_crystal') {
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = currentShip.color;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;
  } else if (currentShip.id === 'alien_relic') {
    ctx.fillStyle = currentShip.color;
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 5;
    ctx.font = '12px Arial';
    ctx.fillStyle = '#00ff00';
    ctx.fillText('ᚼ', -player.width / 2 + 5, -player.height / 2 + 10);
    ctx.fillText('ᚺ', player.width / 2 - 15, player.height / 2 - 5);
  } else if (currentShip.id === 'cosmic_storm') {
    ctx.fillStyle = currentShip.color;
    if (Math.random() < 0.1) {
      ctx.strokeStyle = '#00b7eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
      ctx.stroke();
      spawnParticles(player.x + player.width / 2, player.y + player.height / 2, 1, 'cosmic_storm');
    }
  } else if (currentShip.id === 'black_hole') {
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#8b0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -player.height / 2);
    ctx.lineTo(-player.width / 2, player.height / 2);
    ctx.lineTo(player.width / 2, player.height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(139, 0, 0, ${Math.sin(Date.now() * 0.005) * 0.5 + 0.5})`;
    ctx.stroke();
  } else if (currentShip.id === 'rainbow') {
    ctx.fillStyle = `hsl(${Date.now() % 360}, 70%, 50%)`;
  } else {
    ctx.fillStyle = currentShip.color;
    if (player.shield) ctx.fillStyle = '#00ffff';
    if (player.spreadShot || player.homingShot || player.doubleShot) {
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 15;
    }
  }

  ctx.beginPath();
  ctx.moveTo(0, -player.height / 2);
  ctx.lineTo(-player.width / 2, player.height / 2);
  ctx.lineTo(player.width / 2, player.height / 2);
  ctx.closePath();
  ctx.fill();

  if (currentShip.id === 'fire') {
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.arc(-player.width / 4, player.height / 2, 5, 0, Math.PI * 2);
    ctx.arc(player.width / 4, player.height / 2, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (currentShip.id === 'ice') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-player.width / 4, -player.height / 2, 5, 0, Math.PI * 2);
    ctx.arc(player.width / 4, -player.height / 2, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (currentShip.id === 'plasma') {
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.rect(-player.width / 2, 0, 5, player.height / 2);
    ctx.rect(player.width / 2 - 5, 0, 5, player.height / 2);
    ctx.fill();
  }

  if ((keys && keys.ArrowUp) || touchState.dy < 0) {
    ctx.beginPath();
    ctx.moveTo(-player.width / 4, player.height / 2);
    ctx.lineTo(player.width / 4, player.height / 2);
    ctx.lineTo(0, player.height / 2 + 10 + Math.random() * 5);
    ctx.closePath();
    if (currentShip.id === 'nebula') {
      const gradient = ctx.createLinearGradient(0, player.height / 2, 0, player.height / 2 + 15);
      gradient.addColorStop(0, '#aa00ff');
      gradient.addColorStop(1, '#0000ff');
      ctx.fillStyle = gradient;
      spawnParticles(player.x + player.width / 2, player.y + player.height, 2, 'nebula');
    } else if (currentShip.id === 'stellar_crystal') {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 15;
    } else if (currentShip.id === 'alien_relic') {
      ctx.fillStyle = '#00ff00';
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 10;
    } else if (currentShip.id === 'cosmic_storm') {
      ctx.fillStyle = '#00b7eb';
      ctx.shadowColor = '#00b7eb';
      ctx.shadowBlur = 10;
    } else if (currentShip.id === 'black_hole') {
      ctx.fillStyle = '#8b0000';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = currentShip.thrusterColor;
    }
    ctx.fill();
  }

  ctx.restore();
}

function shoot() {
  const now = Date.now();
  if (now - player.lastShot >= player.fireRate) {
    if (player.spreadShot) {
      bullets.push(
        { x: player.x + player.width / 2 - bulletWidth / 2, y: player.y - bulletHeight, width: bulletWidth, height: bulletHeight, dx: 0, dy: -bulletSpeed, homing: player.homingShot ? findNearestTarget() : null, effect: currentShip.effect },
        { x: player.x + player.width / 2 - bulletWidth / 2 - 10, y: player.y - bulletHeight, width: bulletWidth, height: bulletHeight, dx: -2, dy: -bulletSpeed, homing: player.homingShot ? findNearestTarget() : null, effect: currentShip.effect },
        { x: player.x + player.width / 2 - bulletWidth / 2 + 10, y: player.y - bulletHeight, width: bulletWidth, height: bulletHeight, dx: 2, dy: -bulletSpeed, homing: player.homingShot ? findNearestTarget() : null, effect: currentShip.effect }
      );
    } else if (player.doubleShot) {
      bullets.push(
        { x: player.x + player.width / 2 - bulletWidth / 2 - 10, y: player.y - bulletHeight, width: bulletWidth, height: bulletHeight, dx: 0, dy: -bulletSpeed, homing: player.homingShot ? findNearestTarget() : null, effect: currentShip.effect },
        { x: player.x + player.width / 2 - bulletWidth / 2 + 10, y: player.y - bulletHeight, width: bulletWidth, height: bulletHeight, dx: 0, dy: -bulletSpeed, homing: player.homingShot ? findNearestTarget() : null, effect: currentShip.effect }
      );
    } else {
      bullets.push({
        x: player.x + player.width / 2 - bulletWidth / 2,
        y: player.y - bulletHeight,
        width: bulletWidth,
        height: bulletHeight,
        dx: 0,
        dy: -bulletSpeed,
        homing: player.homingShot ? findNearestTarget() : null,
        effect: currentShip.effect
      });
    }
    player.lastShot = now;
  }
}

function findNearestTarget() {
  let nearest = null;
  let minDist = Infinity;
  asteroids.forEach(asteroid => {
    const dist = Math.hypot(asteroid.x + asteroid.size / 2 - (player.x + player.width / 2), asteroid.y + asteroid.size / 2 - player.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = asteroid;
    }
  });
  enemies.forEach(enemy => {
    const dist = Math.hypot(enemy.x + enemy.size / 2 - (player.x + player.width / 2), enemy.y + enemy.size / 2 - player.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  });
  if (boss && boss.health > 0) {
    const dist = Math.hypot(boss.x + boss.width / 2 - (player.x + player.width / 2), boss.y + boss.height / 2 - player.y);
    if (dist < minDist) {
      minDist = dist;
      nearest = boss;
    }
  }
  return nearest;
}

function updateBullets() {
  bullets.forEach((bullet, index) => {
    if (bullet.homing) {
      if (!bullet.homing.health || bullet.homing.health <= 0 || 
          !asteroids.includes(bullet.homing) && !enemies.includes(bullet.homing) && bullet.homing !== boss) {
        bullet.homing = findNearestTarget();
        if (!bullet.homing) {
          bullets.splice(index, 1);
          return;
        }
      }
      const targetX = bullet.homing.x + (bullet.homing.size || bullet.homing.width) / 2;
      const targetY = bullet.homing.y + (bullet.homing.size || bullet.homing.height) / 2;
      const dx = targetX - (bullet.x + bullet.width / 2);
      const dy = targetY - (bullet.y + bullet.height / 2);
      const angle = Math.atan2(dy, dx);
      bullet.dx = Math.cos(angle) * bulletSpeed;
      bullet.dy = Math.sin(angle) * bulletSpeed;
    }
    bullet.x += bullet.dx;
    bullet.y += bullet.dy;
    if (bullet.y < -bullet.height || bullet.x < -bullet.width || bullet.x > canvas.width || bullet.y > canvas.height) {
      bullets.splice(index, 1);
    }
  });
}

function drawBullets() {
  bullets.forEach(bullet => {
    ctx.save();
    if (bullet.effect === 'distortion') {
      ctx.fillStyle = currentShip.laserColor;
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = bullet.homing ? '#ff00ff' : player.doubleShot ? '#ffff00' : currentShip.laserColor;
      if (['nebula', 'stellar_crystal', 'alien_relic', 'cosmic_storm'].includes(currentShip.id)) {
        ctx.shadowColor = currentShip.laserColor;
        ctx.shadowBlur = 10;
      }
    }
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    ctx.restore();
  });
}

function spawnAsteroid() {
  if (bossActive) return;
  asteroids.push({
    x: Math.random() * (canvas.width - asteroidSize),
    y: -asteroidSize,
    size: asteroidSize
  });
}

function updateAsteroids() {
  asteroids.forEach((asteroid, index) => {
    asteroid.y += asteroidSpeed;

    if (asteroid.y > canvas.height) {
      if (!player.shield) {
        lives = Math.max(0, lives - 1); // Garante que as vidas não fiquem negativas
        livesDisplay.textContent = `Vidas: ${lives}`;
        player.shield = true;
        setTimeout(() => { player.shield = false; }, upgrades.powerUpDuration.levels[upgrades.powerUpDuration.level]);
        hitFlashTimer = Date.now() + 300;
        damageFlashTimer = Date.now() + 300;
        if (lives <= 0) {
          gameOver = true;
          gameOverScreen.classList.add('show');
          finalScoreDisplay.textContent = `Pontos: ${score}`;
          localStorage.setItem('currency', currency);
        }
      }
      asteroids.splice(index, 1);
      return;
    }

    if (
      !player.shield &&
      player.x < asteroid.x + asteroid.size &&
      player.x + player.width > asteroid.x &&
      player.y < asteroid.y + asteroid.size &&
      player.y + player.height > asteroid.y
    ) {
      lives--;
      livesDisplay.textContent = `Vidas: ${lives}`;
      player.shield = true;
      setTimeout(() => { player.shield = false; }, upgrades.powerUpDuration.levels[upgrades.powerUpDuration.level]);
      hitFlashTimer = Date.now() + 300;
      damageFlashTimer = Date.now() + 300;
      asteroids.splice(index, 1);
      spawnParticles(asteroid.x + asteroid.size / 2, asteroid.y + asteroid.size / 2, 5);
      if (lives <= 0) {
        gameOver = true;
        gameOverScreen.classList.add('show');
        finalScoreDisplay.textContent = `Pontos: ${score}`;
        localStorage.setItem('currency', currency);
      }
      return;
    }

    bullets.forEach((bullet, bulletIndex) => {
      if (
        bullet.x < asteroid.x + asteroid.size &&
        bullet.x + bullet.width > asteroid.x &&
        bullet.y < asteroid.y + asteroid.size &&
        bullet.y + bullet.height > asteroid.y
      ) {
        asteroids.splice(index, 1);
        bullets.splice(bulletIndex, 1);
        spawnParticles(asteroid.x + asteroid.size / 2, asteroid.y + asteroid.size / 2, 5);
        score += 10;
        currency += 2;
        localStorage.setItem('currency', currency);
        currencyDisplay.textContent = `Moedas: ${currency}`;
        scoreDisplay.textContent = `Pontos: ${score}`;
        if (Math.random() < 0.05) spawnPowerUp(asteroid.x, asteroid.y);
        if (score >= 1000 && !achievements.find(a => a.id === 'high_score_1000').unlocked) {
          unlockAchievement('high_score_1000');
        }
      }
    });
  });
}

function drawAsteroids() {
  ctx.fillStyle = '#888';
  asteroids.forEach(asteroid => {
    ctx.beginPath();
    ctx.arc(asteroid.x + asteroid.size / 2, asteroid.y + asteroid.size / 2, asteroid.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function spawnEnemy() {
  if (bossActive || level < 7 || enemies.length >= 3) return;
  const isLargeEnemy = level >= 10 && Math.random() < 0.25;
  enemies.push({
    x: Math.random() * (canvas.width - (isLargeEnemy ? largeEnemySize : enemySize)),
    y: -(isLargeEnemy ? largeEnemySize : enemySize),
    size: isLargeEnemy ? largeEnemySize : enemySize,
    speed: isLargeEnemy ? 1 : 2 + (level - 7) * 0.05,
    movementPattern: 'zigzag',
    zigzagPhase: Math.random() * Math.PI * 2,
    health: isLargeEnemy ? 3 : 1,
    isLargeEnemy: isLargeEnemy
  });
}

function updateEnemies() {
  enemies.forEach((enemy, index) => {
    enemy.y += enemy.speed;
    if (enemy.movementPattern === 'zigzag') {
      enemy.x += Math.sin(enemy.zigzagPhase + Date.now() * 0.005) * 3;
    }
    if (enemy.y > canvas.height) {
      if (!player.shield) {
        lives = Math.max(0, lives - 1); // Garante que as vidas não fiquem negativas
        livesDisplay.textContent = `Vidas: ${lives}`;
        player.shield = true;
        setTimeout(() => { player.shield = false; }, upgrades.powerUpDuration.levels[upgrades.powerUpDuration.level]);
        hitFlashTimer = Date.now() + 300;
        damageFlashTimer = Date.now() + 300;
        if (lives <= 0) {
          gameOver = true;
          gameOverScreen.classList.add('show');
          finalScoreDisplay.textContent = `Pontos: ${score}`;
          localStorage.setItem('currency', currency);
        }
      }
      enemies.splice(index, 1);
      return;
    }

    if (
      !player.shield &&
      player.x < enemy.x + enemy.size &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + enemy.size &&
      player.y + player.height > enemy.y
    ) {
      lives = Math.max(0, lives - 1); // Garante que as vidas não fiquem negativas
      livesDisplay.textContent = `Vidas: ${lives}`;
      player.shield = true;
      setTimeout(() => { player.shield = false; }, upgrades.powerUpDuration.levels[upgrades.powerUpDuration.level]);
      hitFlashTimer = Date.now() + 300;
      damageFlashTimer = Date.now() + 300;
      enemies.splice(index, 1);
      spawnParticles(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2, 8);
      if (lives <= 0) {
        gameOver = true;
        gameOverScreen.classList.add('show');
        finalScoreDisplay.textContent = `Pontos: ${score}`;
        localStorage.setItem('currency', currency);
      }
      return;
    }

    bullets.forEach((bullet, bulletIndex) => {
      if (
        bullet.x < enemy.x + enemy.size &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.size &&
        bullet.y + bullet.height > enemy.y
      ) {
        enemy.health--;
        bullets.splice(bulletIndex, 1);
        if (enemy.health <= 0) {
          enemies.splice(index, 1);
          spawnParticles(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2, 8);
          score += 15;
          currency += 3;
          localStorage.setItem('currency', currency);
          currencyDisplay.textContent = `Moedas: ${currency}`;
          scoreDisplay.textContent = `Pontos: ${score}`;
          if (Math.random() < 0.1) spawnPowerUp(enemy.x, enemy.y);
        }
      }
    });
  });
}

function drawEnemies() {
  enemies.forEach(enemy => {
    ctx.fillStyle = enemy.isLargeEnemy ? '#ff8800' : '#ff5555';
    ctx.beginPath();
    ctx.arc(enemy.x + enemy.size / 2, enemy.y + enemy.size / 2, enemy.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function spawnBoss() {
  let bossName, bossHealth, bossSpeed, bossFireRate, bossWidth, bossHeight, attackPatterns;
  
  if (level === 5) {
    bossName = 'Soldado Vorath';
    bossHealth = 50;
    bossSpeed = 3;
    bossFireRate = 1000;
    bossWidth = 100;
    bossHeight = 50;
    attackPatterns = ['normal'];
    initialLives = lives;
  } else if (level === 10) {
    bossName = 'Comandante Vorath';
    bossHealth = 75;
    bossSpeed = 4;
    bossFireRate = 800;
    bossWidth = 120;
    bossHeight = 60;
    attackPatterns = ['normal', 'fan'];
  } else if (level === 15) {
    bossName = 'General Vorath';
    bossHealth = 100;
    bossSpeed = 5;
    bossFireRate = 600;
    bossWidth = 140;
    bossHeight = 70;
    attackPatterns = ['fan', 'rapid'];
  } else if (level === 20) {
    bossName = 'Imperador Zethar';
    bossHealth = 150;
    bossSpeed = 6;
    bossFireRate = 400;
    bossWidth = 160;
    bossHeight = 80;
    attackPatterns = ['normal', 'fan', 'rapid'];
  }

  const warningDialogues = [
    `Cuidado! ${bossName} se aproxima!`,
    "Você é fraco demais para me enfrentar!",
    "Prepare-se para ser destruído!",
    "A humanidade não tem chance contra mim!"
  ];
  dialogue.textContent = warningDialogues[Math.floor(Math.random() * warningDialogues.length)];
  dialogue.style.display = 'block';
  bossWarning.classList.add('show');
  setTimeout(() => {
    bossWarning.classList.remove('show');
    dialogue.style.display = 'none';
    boss = {
      x: canvas.width / 2 - bossWidth / 2,
      y: 50,
      width: bossWidth,
      height: bossHeight,
      health: bossHealth,
      lastShot: 0,
      fireRate: bossFireRate,
      dx: 0,
      speed: bossSpeed,
      direction: 1,
      lastDirectionChange: Date.now(),
      changeDirectionInterval: 2000,
      attackPattern: attackPatterns[0],
      attackPatterns: attackPatterns,
      lastPatternChange: Date.now(),
      phase: 1,
      lastDialogue: 0,
      name: bossName
    };
    bossActive = true;
    if (asteroidInterval) clearInterval(asteroidInterval);
    if (enemyInterval) clearInterval(enemyInterval);
    showBossDialogue();
  }, 2000);
}

function showBossDialogue() {
  let dialogues;
  if (boss.name === 'Soldado Vorath') {
    dialogues = [
      "Você não é digno de enfrentar os Vorath!",
      "Minhas balas vão te esmagar!",
      "A resistência humana é inútil!"
    ];
  } else if (boss.name === 'Comandante Vorath') {
    dialogues = [
      "Eu comando as frotas Vorath!",
      "Você nunca passará pela minha defesa!",
      "Sinta o poder do meu esquadrão!"
    ];
  } else if (boss.name === 'General Vorath') {
    dialogues = [
      "Eu sou a força suprema dos Vorath!",
      "Nenhuma nave escapa do meu alcance!",
      "Você será aniquilado!"
    ];
  } else if (boss.name === 'Imperador Zethar') {
    dialogues = [
      "Eu sou o Imperador Zethar, soberano da galáxia!",
      "Sua derrota será minha maior glória!",
      "A humanidade cairá perante meu poder!"
    ];
  }
  dialogue.textContent = dialogues[Math.floor(Math.random() * dialogues.length)];
  dialogue.style.display = 'block';
  bossDialogueTimer = Date.now() + 3000;
}

function drawBoss() {
  if (!boss) return;
  ctx.save();
  let bossColor;
  if (boss.name === 'Soldado Vorath') {
    bossColor = '#ff5555';
  } else if (boss.name === 'Comandante Vorath') {
    bossColor = '#00b7eb';
  } else if (boss.name === 'General Vorath') {
    bossColor = '#aa00ff';
  } else if (boss.name === 'Imperador Zethar') {
    bossColor = `hsl(${Date.now() % 360}, 70%, 50%)`;
  }
  ctx.fillStyle = bossColor;
  ctx.shadowColor = 'red';
  ctx.shadowBlur = 20;
  ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
  ctx.font = '16px Arial';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(boss.name, boss.x + boss.width / 2, boss.y - 30);
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(boss.x, boss.y - 20, (boss.health / (boss.name === 'Soldado Vorath' ? 50 : boss.name === 'Comandante Vorath' ? 75 : boss.name === 'General Vorath' ? 100 : 150)) * boss.width, 10);
  ctx.restore();
}

function updateBoss() {
  if (!boss) return;

  const maxHealth = boss.name === 'Soldado Vorath' ? 50 : boss.name === 'Comandante Vorath' ? 75 : boss.name === 'General Vorath' ? 100 : 150;
  if (boss.health < maxHealth * 0.7 && boss.phase === 1) {
    boss.phase = 2;
    boss.fireRate = boss.name === 'Soldado Vorath' ? 800 : boss.name === 'Comandante Vorath' ? 600 : boss.name === 'General Vorath' ? 400 : 300;
    boss.speed += 1;
  } else if (boss.health < maxHealth * 0.3 && boss.phase === 2) {
    boss.phase = 3;
    boss.fireRate = boss.name === 'Soldado Vorath' ? 600 : boss.name === 'Comandante Vorath' ? 400 : boss.name === 'General Vorath' ? 300 : 200;
    boss.speed += 1;
  }

  if (Date.now() - boss.lastDirectionChange > boss.changeDirectionInterval) {
    boss.direction = Math.random() < 0.5 ? -1 : 1;
    boss.lastDirectionChange = Date.now();
  }
  boss.dx = boss.speed * boss.direction * Math.sin(Date.now() * 0.002);
  boss.x += boss.dx;
  if (boss.x < 0) boss.x = 0;
  if (boss.x > canvas.width - boss.width) boss.x = canvas.width - boss.width;
  boss.y = Math.min(100, Math.max(50, boss.y));

  if (Date.now() - boss.lastPatternChange > 5000) {
    boss.attackPattern = boss.attackPatterns[Math.floor(Math.random() * boss.attackPatterns.length)];
    boss.lastPatternChange = Date.now();
  }

  const now = Date.now();
  if (now - boss.lastShot >= boss.fireRate) {
    const dx = (player.x + player.width / 2 - (boss.x + boss.width / 2)) * 0.05;
    if (boss.attackPattern === 'normal') {
      bossBullets.push({
        x: boss.x + boss.width / 2 - bossBulletWidth / 2,
        y: boss.y + boss.height,
        width: bossBulletWidth,
        height: bossBulletHeight,
        dx: dx,
        dy: bossBulletSpeed
      });
    } else if (boss.attackPattern === 'fan') {
      for (let i = -2; i <= 2; i++) {
        bossBullets.push({
          x: boss.x + boss.width / 2 - bossBulletWidth / 2,
          y: boss.y + boss.height,
          width: bossBulletWidth,
          height: bossBulletHeight,
          dx: i * 1,
          dy: bossBulletSpeed
        });
      }
    } else if (boss.attackPattern === 'rapid') {
      bossBullets.push({
        x: boss.x + boss.width / 2 - bossBulletWidth / 2,
        y: boss.y + boss.height,
        width: bossBulletWidth,
        height: bossBulletHeight,
        dx: dx,
        dy: bossBulletSpeed * 1.5
      });
    }
    boss.lastShot = now;
  }

  if (now - lastBossPowerUp > 15000 && Math.random() < 0.1) {
    spawnPowerUp(boss.x + boss.width / 2, boss.y + boss.height);
    lastBossPowerUp = now;
  }

  if (now - boss.lastDialogue > 10000) {
    showBossDialogue();
    boss.lastDialogue = now;
  }

  if (
    !player.shield &&
    player.x < boss.x + boss.width &&
    player.x + player.width > boss.x &&
    player.y < boss.y + boss.height &&
    player.y + player.height > boss.y
  ) {
    lives--;
    livesDisplay.textContent = `Vidas: ${lives}`;
    player.shield = true;
    setTimeout(() => { player.shield = false; }, upgrades.powerUpDuration.levels[upgrades.powerUpDuration.level]);
    hitFlashTimer = Date.now() + 300;
    damageFlashTimer = Date.now() + 300;
    if (lives <= 0) {
      gameOver = true;
      gameOverScreen.classList.add('show');
      finalScoreDisplay.textContent = `Pontos: ${score}`;
      localStorage.setItem('currency', currency);
    }
  }

  bullets.forEach((bullet, bulletIndex) => {
    if (
      bullet.x < boss.x + boss.width &&
      bullet.x + bullet.width > boss.x &&
      bullet.y < boss.y + boss.height &&
      bullet.y + bullet.height > boss.y
    ) {
      boss.health--;
      bullets.splice(bulletIndex, 1);
      if (boss.health <= 0) {
        spawnParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, 20);
        score += 100;
        currency += 50;
        localStorage.setItem('currency', currency);
        currencyDisplay.textContent = `Moedas: ${currency}`;
        if (boss.name === 'Soldado Vorath' && lives === initialLives) {
          unlockAchievement('soldier_vorath_no_damage');
        }
        if (boss.name === 'Comandante Vorath') {
          unlockAchievement('defeat_commander_vorath');
        }
        if (boss.name === 'General Vorath') {
          unlockAchievement('defeat_general_vorath');
        }
        if (boss.name === 'Imperador Zethar') {
          unlockAchievement('defeat_emperor_zethar');
          const rainbowShip = ships.find(ship => ship.id === 'rainbow');
          if (rainbowShip && !rainbowShip.unlocked) {
            rainbowShip.unlocked = true;
            localStorage.setItem('achievement_defeat_emperor_zethar', 'true');
          }
        }
        if (Math.random() < 0.25) spawnPowerUp(boss.x, boss.y);
        for (let i = bullets.length - 1; i >= 0; i--) {
          if (bullets[i].homing === boss) {
            bullets.splice(i, 1);
          }
        }
        boss = null;
        bossActive = false;
        bossBullets.length = 0;
        dialogue.style.display = 'none';
        if (asteroidInterval) clearInterval(asteroidInterval);
        asteroidInterval = setInterval(() => {
          if (!gameOver && !paused && gameStarted) spawnAsteroid();
        }, asteroidSpawnRate);
        if (level >= 7) {
          if (enemyInterval) clearInterval(enemyInterval);
          enemyInterval = setInterval(() => {
            if (!gameOver && !paused && gameStarted) spawnEnemy();
          }, Math.max(3000, enemySpawnRate - (level - 7) * 100));
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawStars();
      }
    }
  });

  if (Date.now() > bossDialogueTimer) {
    dialogue.style.display = 'none';
  }
}

function updateBossBullets() {
  bossBullets.forEach((bullet, index) => {
    bullet.x += bullet.dx;
    bullet.y += bullet.dy;
    if (bullet.y > canvas.height || bullet.x < -bullet.width || bullet.x > canvas.width) {
      bossBullets.splice(index, 1);
      return;
    }
    if (
      !player.shield &&
      player.x < bullet.x + bullet.width &&
      player.x + player.width > bullet.x &&
      player.y < bullet.y + bullet.height &&
      player.y + player.height > bullet.y
    ) {
      lives = Math.max(0, lives - 1); // Garante que as vidas não fiquem negativas
      livesDisplay.textContent = `Vidas: ${lives}`;
      player.shield = true;
      setTimeout(() => { player.shield = false; }, upgrades.powerUpDuration.levels[upgrades.powerUpDuration.level]);
      hitFlashTimer = Date.now() + 300;
      damageFlashTimer = Date.now() + 300;
      bossBullets.splice(index, 1);
      if (lives <= 0) {
        gameOver = true;
        gameOverScreen.classList.add('show');
        finalScoreDisplay.textContent = `Pontos: ${score}`;
        localStorage.setItem('currency', currency);
      }
    }
  });
}

function drawBossBullets() {
  bossBullets.forEach(bullet => {
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });
}

function spawnPowerUp(x, y) {
  const types = bossActive 
    ? ['shield', 'fastShot', 'spreadShot', 'doubleShot']
    : ['shield', 'fastShot', 'spreadShot', 'doubleShot', 'homingShot'];
  const type = types[Math.floor(Math.random() * types.length)];
  powerUps.push({
    x: x,
    y: y,
    width: 20,
    height: 20,
    type: type
  });
}

function drawPowerUps() {
  powerUps.forEach(powerUp => {
    ctx.fillStyle = 
      powerUp.type === 'shield' ? '#00ffff' :
      powerUp.type === 'fastShot' ? '#ff8800' :
      powerUp.type === 'spreadShot' ? '#00ff00' :
      powerUp.type === 'doubleShot' ? '#ffff00' :
      powerUp.type === 'homingShot' ? '#ff00ff' :
      '#ffffff';
    ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
  });

  if (player.shield || player.fastShot || player.spreadShot || player.doubleShot || player.homingShot) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    let activePowerUps = [];
    if (player.shield) activePowerUps.push('Escudo');
    if (player.fastShot) activePowerUps.push('Tiro Rápido');
    if (player.spreadShot) activePowerUps.push('Tiro Espalhado');
    if (player.doubleShot) activePowerUps.push('Tiro Duplo');
    if (player.homingShot) activePowerUps.push('Tiro Teleguiado');
    activePowerUps.forEach((powerUp, index) => {
      ctx.fillText(powerUp, 10, canvas.height - 30 - index * 20);
    });
  }
}

function updatePowerUps() {
  powerUps.forEach((powerUp, index) => {
    powerUp.y += 2;
    if (powerUp.y > canvas.height) powerUps.splice(index, 1);

    if (
      player.x < powerUp.x + powerUp.width &&
      player.x + player.width > powerUp.x &&
      player.y < powerUp.y + powerUp.height &&
      player.y + player.height > powerUp.y
    ) {
      powerUps.splice(index, 1);
      const duration = upgrades.powerUpDuration.levels[upgrades.powerUpDuration.level];
      if (powerUp.type === 'shield') {
        player.shield = true;
        setTimeout(() => { player.shield = false; }, duration);
      } else if (powerUp.type === 'fastShot') {
        player.fastShot = true;
        player.fireRate = 100;
        setTimeout(() => {
          player.fastShot = false;
          player.fireRate = upgrades.fireRate.levels[upgrades.fireRate.level];
        }, duration);
      } else if (powerUp.type === 'spreadShot') {
        player.spreadShot = true;
        setTimeout(() => { player.spreadShot = false; }, duration);
      } else if (powerUp.type === 'doubleShot') {
        player.doubleShot = true;
        setTimeout(() => { player.doubleShot = false; }, duration);
      } else if (powerUp.type === 'homingShot') {
        player.homingShot = true;
        setTimeout(() => { player.homingShot = false; }, duration);
      }
    }
  });
}

function updatePlayer() {
  player.dx = 0;
  player.dy = 0;

  if (keys.ArrowLeft) player.dx = -player.speed;
  if (keys.ArrowRight) player.dx = player.speed;
  if (keys.ArrowUp) player.dy = -player.speed;
  if (keys.ArrowDown) player.dy = player.speed;

  if (touchState.dx !== 0 || touchState.dy !== 0) {
    player.dx = touchState.dx;
    player.dy = touchState.dy;
  }

  player.x += player.dx;
  player.y += player.dy;

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  if (player.y < 10) player.y = 10; // Prevent moving too far up
  if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;

  if ((keys.Space || touchState.shoot) && !gameOver && !paused && gameStarted) {
    shoot();
  }
}

function startGame() {
  console.log('Iniciando o jogo... Estado inicial:', { gameStarted, gameOver, paused });
  gameStarted = true;
  startScreen.classList.remove('show');
  canvas.style.display = 'block';
  lives = upgrades.health.levels[upgrades.health.level];
  initialLives = lives;
  score = 0;
  level = 1;
  asteroidSpeed = 1;
  asteroidSpawnRate = 2000;
  scoreDisplay.textContent = `Pontos: ${score}`;
  livesDisplay.textContent = `Vidas: ${lives}`;
  levelDisplay.textContent = `Nível: ${level}`;
  currencyDisplay.textContent = `Moedas: ${currency}`;
  player.x = canvas.width / 2;
  player.y = canvas.height - 50;
  player.shield = false;
  player.fastShot = false;
  player.spreadShot = false;
  player.doubleShot = false;
  player.homingShot = false;
  player.fireRate = upgrades.fireRate.levels[upgrades.fireRate.level];
  bullets.length = 0;
  asteroids.length = 0;
  enemies.length = 0;
  powerUps.length = 0;
  particles.length = 0;
  bossBullets.length = 0;
  boss = null;
  bossActive = false;
  gameOver = false;
  paused = false;
  gameStartTime = Date.now();
  if (asteroidInterval) clearInterval(asteroidInterval);
  if (enemyInterval) clearInterval(enemyInterval);
  createStars();
  asteroidInterval = setInterval(() => {
    if (!gameOver && !paused && gameStarted) {
      console.log('Gerando asteroide...');
      spawnAsteroid();
    }
  }, asteroidSpawnRate);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  requestAnimationFrame(gameLoop);
}

function togglePause() {
  paused = !paused;
  console.log('Estado de pausa:', { paused, gameStarted, gameOver });
  if (paused) {
    pauseScreen.classList.add('show');
    if (asteroidInterval) clearInterval(asteroidInterval);
    if (enemyInterval) clearInterval(enemyInterval);
  } else {
    pauseScreen.classList.remove('show');
    if (!bossActive) {
      asteroidInterval = setInterval(() => {
        if (!gameOver && !paused && gameStarted) {
          console.log('Gerando asteroide após retomar...');
          spawnAsteroid();
        }
      }, asteroidSpawnRate);
      if (level >= 7) {
        enemyInterval = setInterval(() => {
          if (!gameOver && !paused && gameStarted) {
            console.log('Gerando inimigo após retomar...');
            spawnEnemy();
          }
        }, Math.max(3000, enemySpawnRate - (level - 7) * 100));
      }
    }
    requestAnimationFrame(gameLoop);
  }
}

function updateLevel() {
  if (score >= level * 100) {
    level++;
    asteroidSpeed = Math.min(3, asteroidSpeed + 0.15); // Cap at 3
    asteroidSpawnRate = Math.max(500, asteroidSpawnRate - 50);
    if (asteroidInterval) clearInterval(asteroidInterval);
    asteroidInterval = setInterval(() => {
      if (!gameOver && !paused && gameStarted) {
        console.log('Gerando asteroide no nível', level);
        spawnAsteroid();
      }
    }, asteroidSpawnRate);
    if (level >= 7 && !enemyInterval) {
      enemyInterval = setInterval(() => {
        if (!gameOver && !paused && gameStarted) {
          console.log('Gerando inimigo no nível', level);
          spawnEnemy();
        }
      }, Math.max(3000, enemySpawnRate - (level - 7) * 100));
    }
    if ([5, 10, 15, 20].includes(level) && !bossActive) {
      dialogue.textContent = 'Prepare-se! Um chefe está chegando!';
      dialogue.style.display = 'block';
      setTimeout(() => {
        dialogue.style.display = 'none';
        spawnBoss();
      }, 3000);
    }
    levelDisplay.textContent = `Nível: ${level}`;
  }
}

function gameLoop() {
  console.log('Executando gameLoop...', { gameStarted, gameOver, paused });
  if (!gameStarted || gameOver || paused) {
    console.log('gameLoop interrompido:', { gameStarted, gameOver, paused });
    return;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateStars();
  drawStars();
  updatePlayer();
  if (Date.now() < hitFlashTimer) {
    ctx.globalAlpha = 0.5;
    drawPlayer();
    ctx.globalAlpha = 1;
  } else {
    drawPlayer();
  }
  updateBullets();
  drawBullets();
  updateAsteroids();
  drawAsteroids();
  updateEnemies();
  drawEnemies();
  updateBoss();
  drawBoss();
  updateBossBullets();
  drawBossBullets();
  updatePowerUps();
  drawPowerUps();
  updateParticles();
  drawParticles();
  updateLevel();
  if (Date.now() < damageFlashTimer) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  if (Date.now() - gameStartTime >= 300000 && !achievements.find(a => a.id === 'survive_5_minutes').unlocked && lives > 0) {
    unlockAchievement('survive_5_minutes');
  }
  requestAnimationFrame(gameLoop);
}

function unlockAchievement(id) {
  const achievement = achievements.find(a => a.id === id);
  if (achievement && !achievement.unlocked) {
    achievement.unlocked = true;
    localStorage.setItem(`achievement_${id}`, 'true');
    achievementNotification.textContent = `Conquista desbloqueada: ${achievement.name}`;
    achievementNotification.style.display = 'block';
    setTimeout(() => {
      achievementNotification.style.display = 'none';
    }, 3000);
  }
}

function updateShop() {
  console.log('Atualizando loja...');
  const shipItems = document.getElementById('ship-items');
  const upgradeItems = document.getElementById('upgrade-items');
  const shopCurrency = document.getElementById('shop-currency');

  if (!shipItems || !upgradeItems || !shopCurrency) {
    console.error('Elementos da loja não encontrados. Verifique o shop.html.');
    return;
  }

  shopCurrency.textContent = `Moedas: ${currency}`;
  shipItems.innerHTML = '';
  ships.forEach(ship => {
    const div = document.createElement('div');
    div.className = `shop-item ${ship.unlocked ? '' : 'locked'} ${currentShip.id === ship.id ? 'selected' : ''} ${ship.cost >= 1000 || ship.id === 'rainbow' ? 'legendary' : ''}`;
    let buttonHTML = '';
    let rarity = '';
    if (ship.id === 'default') {
      rarity = 'Comum';
    } else if (ship.id === 'rainbow' || ship.cost >= 1000) {
      rarity = 'Lendária';
    } else if (ship.cost === 500) {
      rarity = 'Rara';
    }
    if (ship.id === 'rainbow' && !ship.unlocked) {
      buttonHTML = `<span class="locked-message">Derrote o Imperador Zethar para desbloquear</span>`;
    } else if (ship.unlocked) {
      buttonHTML = currentShip.id === ship.id ? '<span class="selected-message">Selecionado</span>' : `<button class="select-ship" data-id="${ship.id}">Selecionar</button>`;
    } else {
      buttonHTML = `<button class="buy-ship" data-id="${ship.id}">Comprar (${ship.cost} Moedas)</button>`;
    }
    div.innerHTML = `
      <span class="ship-name">${ship.name}</span>
      <span class="ship-rarity">${rarity}</span>
      ${ship.id === 'rainbow' ? '' : `<span class="ship-cost">Custo: ${ship.cost} Moedas</span>`}
      ${buttonHTML}
    `;
    shipItems.appendChild(div);
  });

  upgradeItems.innerHTML = '';
  Object.keys(upgrades).forEach(type => {
    const upgrade = upgrades[type];
    const div = document.createElement('div');
    div.className = `upgrade-item ${upgrade.level >= upgrade.levels.length - 1 ? 'locked' : ''}`;
    const level = upgrade.level;
    const nextLevel = level < upgrade.levels.length - 1 ? upgrade.levels[level + 1] : 'Máximo';
    const cost = level < upgrade.levels.length - 1 ? upgrade.costs[level] : 0;
    div.innerHTML = `
      <span>${type === 'health' ? 'Vidas' : type === 'powerUpDuration' ? 'Duração de Power-Ups' : type === 'speed' ? 'Velocidade' : 'Taxa de Tiro'}: ${nextLevel}</span>
      ${level < upgrade.levels.length - 1 ? `<span>Custo: ${cost} Moedas</span><button class="buy-upgrade" data-type="${type}">Comprar</button>` : '<span>Nível Máximo</span>'}
    `;
    upgradeItems.appendChild(div);
  });

  document.querySelectorAll('.buy-ship').forEach(button => {
    button.addEventListener('click', () => {
      console.log(`Tentando comprar nave: ${button.dataset.id}`);
      const id = button.dataset.id;
      const ship = ships.find(s => s.id === id);
      if (ship && !ship.unlocked && currency >= ship.cost) {
        currency -= ship.cost;
        ship.unlocked = true;
        localStorage.setItem('currency', currency);
        localStorage.setItem(`ship_${id}`, 'true');
        if (typeof playSound === 'function') {
          console.log('Tentando tocar upgradeBuy para compra de nave');
          playSound('upgradeBuy');
        } else {
          console.error('Função playSound não definida ao comprar nave');
        }
        updateShop();
      } else {
        console.log('Compra de nave falhou: moedas insuficientes ou nave já desbloqueada');
      }
    });
  });

  document.querySelectorAll('.select-ship').forEach(button => {
    button.addEventListener('click', () => {
      console.log(`Tentando selecionar nave: ${button.dataset.id}`);
      const id = button.dataset.id;
      const ship = ships.find(s => s.id === id);
      if (ship && ship.unlocked) {
        currentShip = ship;
        localStorage.setItem('currentShip', id);
        if (typeof playSound === 'function') {
          console.log('Tentando tocar menuClick para seleção de nave');
          playSound('menuClick');
        } else {
          console.error('Função playSound não definida ao selecionar nave');
        }
        updateShop();
      } else {
        console.log('Seleção de nave falhou: nave não desbloqueada');
      }
    });
  });

  document.querySelectorAll('.buy-upgrade').forEach(button => {
    button.addEventListener('click', () => {
      console.log(`Tentando comprar upgrade: ${button.dataset.type}`);
      const type = button.dataset.type;
      const upgrade = upgrades[type];
      if (upgrade.level < upgrade.levels.length - 1 && currency >= upgrade.costs[upgrade.level]) {
        currency -= upgrade.costs[upgrade.level];
        upgrade.level++;
        localStorage.setItem('currency', currency);
        localStorage.setItem(`${type}Level`, upgrade.level);
        if (type === 'speed') player.speed = upgrade.levels[upgrade.level];
        if (type === 'fireRate') player.fireRate = upgrade.levels[upgrade.level];
        if (typeof playSound === 'function') {
          console.log('Tentando tocar upgradeBuy para compra de upgrade');
          playSound('upgradeBuy');
        } else {
          console.error('Função playSound não definida ao comprar upgrade');
        }
        updateShop();
      } else {
        console.log('Compra de upgrade falhou: moedas insuficientes ou nível máximo atingido');
      }
    });
  });
}

  document.querySelectorAll('.buy-upgrade').forEach(button => {
  button.addEventListener('click', () => {
    console.log(`Tentando comprar upgrade: ${button.dataset.type}`);
    const type = button.dataset.type;
    const upgrade = upgrades[type];
    if (upgrade.level < upgrade.levels.length - 1 && currency >= upgrade.costs[upgrade.level]) {
      currency -= upgrade.costs[upgrade.level];
      upgrade.level++;
      localStorage.setItem('currency', currency);
      localStorage.setItem(`${type}Level`, upgrade.level);
      if (type === 'speed') player.speed = upgrade.levels[upgrade.level];
      if (type === 'fireRate') player.fireRate = upgrade.levels[upgrade.level];
      updateShop();
    } else {
      console.log('Compra de upgrade falhou: moedas insuficientes ou nível máximo atingido');
    }
  });
});


function updateAchievements() {
  console.log('Atualizando conquistas...');
  const achievementItems = document.getElementById('achievement-items');
  if (!achievementItems) {
    console.error('Elemento de conquistas não encontrado. Verifique o achievements.html.');
    return;
  }

  achievementItems.innerHTML = '';
  if (achievements.length === 0) {
    const div = document.createElement('div');
    div.className = 'achievement-item';
    div.innerHTML = '<span>Nenhuma conquista disponível no momento.</span>';
    achievementItems.appendChild(div);
  } else {
    achievements.forEach(achievement => {
      const div = document.createElement('div');
      div.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
      div.innerHTML = `
        <div class="achievement-icon">${achievement.unlocked ? '🏆' : '🔒'}</div>
        <div class="achievement-content">
          <span class="achievement-name">${achievement.name}</span>
          <span class="achievement-description">${achievement.description}</span>
          <span class="achievement-status">${achievement.unlocked ? 'Desbloqueado' : 'Bloqueado'}</span>
        </div>
      `;
      achievementItems.appendChild(div);
    });
  }
}

function resetProgress() {
  if (confirm('Tem certeza que deseja reiniciar seu progresso? Isso apagará todas as moedas, naves desbloqueadas, upgrades e conquistas.')) {
    localStorage.clear();
    currency = 0;
    ships.forEach(ship => {
      ship.unlocked = ship.id === 'default';
    });
    currentShip = ships[0];
    upgrades.health.level = 0;
    upgrades.powerUpDuration.level = 0;
    upgrades.speed.level = 0;
    upgrades.fireRate.level = 0;
    player.speed = upgrades.speed.levels[0];
    player.fireRate = upgrades.fireRate.levels[0];
    achievements.forEach(achievement => {
      achievement.unlocked = false;
    });
    localStorage.setItem('currency', currency);
    localStorage.setItem('currentShip', 'default');
    localStorage.setItem('healthLevel', '0');
    localStorage.setItem('powerUpDurationLevel', '0');
    localStorage.setItem('speedLevel', '0');
    localStorage.setItem('fireRateLevel', '0');
    if (currentPage === 'shop.html') updateShop();
    if (currentPage === 'achievements.html') updateAchievements();
  }
}

function returnToMenu() {
  window.location.href = 'index.html';
}

if (currentPage === 'index.html' || currentPage === '') {
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetProgress);
  } else {
    console.error('Botão de reiniciar progresso não encontrado em index.html.');
  }
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Carregando index.html...');
    initializeStarfield();
  });
} else if (currentPage === 'game.html') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Carregando game.html...');
    initializeGame();
  });
} else if (currentPage === 'shop.html') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Carregando shop.html...');
    initializeStarfield();
    updateShop();
  });
} else if (currentPage === 'achievements.html' || currentPage === 'lore.html') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log(`Carregando ${currentPage}...`);
    initializeStarfield();
    if (currentPage === 'achievements.html') updateAchievements();
  });
}