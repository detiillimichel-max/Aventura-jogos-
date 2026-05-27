const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

CONFIG.LANE_WIDTH = canvas.width / CONFIG.LANES;

let player = {
  lane: 1,
  y: canvas.height - 150,
  targetX: canvas.width / 2,
  x: canvas.width / 2,
  jumping: false,
  jumpVel: 0
};

let obstacles = [];
let coins = [];
let score = 0;
let highscore = localStorage.getItem('gitRunnerHighscore') || 0;
let speed = CONFIG.BASE_SPEED;
let gameRunning = false;
let particles = [];

const playerImg = new Image();
playerImg.src = 'assets/img/player.png';

document.getElementById('highscoreValue').textContent = highscore;

// Controles
let touchStartX = 0;
canvas.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
});

canvas.addEventListener('touchend', e => {
  if (!gameRunning) return;
  const touchEndX = e.changedTouches[0].clientX;
  const diff = touchEndX - touchStartX;
  
  if (Math.abs(diff) > 50) {
    if (diff > 0 && player.lane < CONFIG.LANES - 1) player.lane++;
    if (diff < 0 && player.lane > 0) player.lane--;
  } else {
    jump();
  }
});

// Teclado para teste no PC
document.addEventListener('keydown', e => {
  if (!gameRunning) return;
  if (e.key === 'ArrowLeft' && player.lane > 0) player.lane--;
  if (e.key === 'ArrowRight' && player.lane < CONFIG.LANES - 1) player.lane++;
  if (e.key === 'ArrowUp' || e.key === ' ') jump();
});

function jump() {
  if (!player.jumping) {
    player.jumping = true;
    player.jumpVel = -15;
  }
}

function spawnObstacle() {
  const lane = Math.floor(Math.random() * CONFIG.LANES);
  obstacles.push({
    x: lane * CONFIG.LANE_WIDTH + CONFIG.LANE_WIDTH/2 - CONFIG.OBSTACLE_SIZE/2,
    y: -CONFIG.OBSTACLE_SIZE,
    lane: lane,
    type: 'bug'
  });
}

function spawnCoin() {
  const lane = Math.floor(Math.random() * CONFIG.LANES);
  coins.push({
    x: lane * CONFIG.LANE_WIDTH + CONFIG.LANE_WIDTH/2 - CONFIG.COIN_SIZE/2,
    y: -CONFIG.COIN_SIZE,
    lane: lane
  });
}

function update() {
  if (!gameRunning) return;

  // Movimento suave do player
  player.targetX = player.lane * CONFIG.LANE_WIDTH + CONFIG.LANE_WIDTH/2;
  player.x += (player.targetX - player.x) * 0.2;

  // Pulo
  if (player.jumping) {
    player.y += player.jumpVel;
    player.jumpVel += 0.8;
    if (player.y >= canvas.height - 150) {
      player.y = canvas.height - 150;
      player.jumping = false;
    }
  }

  // Spawn
  if (Math.random() < CONFIG.SPAWN_RATE) spawnObstacle();
  if (Math.random() < CONFIG.COIN_RATE) spawnCoin();

  // Update obstáculos
  obstacles = obstacles.filter(obs => {
    obs.y += speed;
    
    // Colisão
    if (!player.jumping && 
        Math.abs(obs.x + CONFIG.OBSTACLE_SIZE/2 - player.x) < 40 &&
        Math.abs(obs.y + CONFIG.OBSTACLE_SIZE/2 - player.y) < 50) {
      gameOver();
      return false;
    }
    
    return obs.y < canvas.height;
  });

  // Update moedas
  coins = coins.filter(coin => {
    coin.y += speed;
    
    if (Math.abs(coin.x + CONFIG.COIN_SIZE/2 - player.x) < 35 &&
        Math.abs(coin.y + CONFIG.COIN_SIZE/2 - player.y) < 45) {
      score++;
      document.getElementById('scoreValue').textContent = score;
      createParticles(coin.x, coin.y);
      return false;
    }
    
    return coin.y < canvas.height;
  });

  // Partículas
  particles = particles.filter(p => {
    p.y -= p.vy;
    p.x += p.vx;
    p.life--;
    return p.life > 0;
  });

  speed += CONFIG.SPEED_INCREMENT;
}

function createParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      life: 30,
      color: '#EC4899'
    });
  }
}

function draw() {
  // Fundo
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#1E1B4B');
  gradient.addColorStop(1, '#7C3AED');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Linhas das lanes
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 2;
  for (let i = 1; i < CONFIG.LANES; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CONFIG.LANE_WIDTH, 0);
    ctx.lineTo(i * CONFIG.LANE_WIDTH, canvas.height);
    ctx.stroke();
  }

  // Player
  ctx.drawImage(playerImg, player.x - CONFIG.PLAYER_WIDTH/2, player.y - CONFIG.PLAYER_HEIGHT/2, CONFIG.PLAYER_WIDTH, CONFIG.PLAYER_HEIGHT);

  // Obstáculos - Bugs
  ctx.fillStyle = '#EF4444';
  obstacles.forEach(obs => {
    ctx.fillRect(obs.x, obs.y, CONFIG.OBSTACLE_SIZE, CONFIG.OBSTACLE_SIZE);
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.fillText('🐛', obs.x + 10, obs.y + 35);
    ctx.fillStyle = '#EF4444';
  });

  // Moedas - Commits
  coins.forEach(coin => {
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(coin.x + CONFIG.COIN_SIZE/2, coin.y + CONFIG.COIN_SIZE/2, CONFIG.COIN_SIZE/2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText('📝', coin.x + 5, coin.y + 22);
  });

  // Partículas
  particles.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / 30;
    ctx.fillRect(p.x, p.y, 4, 4);
    ctx.globalAlpha = 1;
  });
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function startGame() {
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('gameOver').classList.add('hidden');
  gameRunning = true;
  score = 0;
  speed = CONFIG.BASE_SPEED;
  obstacles = [];
  coins = [];
  player.lane = 1;
  player.x = canvas.width / 2;
  document.getElementById('scoreValue').textContent = 0;
}

function gameOver() {
  gameRunning = false;
  if (score > highscore) {
    highscore = score;
    localStorage.setItem('gitRunnerHighscore', highscore);
  }
  document.getElementById('finalScore').textContent = score;
  document.getElementById('finalHighscore').textContent = highscore;
  document.getElementById('highscoreValue').textContent = highscore;
  document.getElementById('gameOver').classList.remove('hidden');
}

document.getElementById('btnStart').onclick = startGame;
document.getElementById('btnRestart').onclick = startGame;

gameLoop();
