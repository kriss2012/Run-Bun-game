// Game Configuration
const CONFIG = {
  width: 800,
  height: 600,
  gravity: 0.6,
  jumpPower: -15,
  moveSpeed: 5,
  difficulty: {
    easy: {
      lavaSpeed: 0.3,
      enemyFrequency: 0.15,
      platformSize: 100
    },
    normal: {
      lavaSpeed: 0.5,
      enemyFrequency: 0.25,
      platformSize: 80
    },
    hard: {
      lavaSpeed: 0.8,
      enemyFrequency: 0.35,
      platformSize: 60
    }
  }
};

// Game State
let gameState = {
  screen: 'menu',
  score: 0,
  highscore: 0,
  height: 0,
  gameSpeed: 1,
  difficulty: 'normal',
  volume: 0.7,
  musicEnabled: true,
  paused: false
};

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Input Handler
const input = {
  left: false,
  right: false,
  keys: {}
};

window.addEventListener('keydown', (e) => {
  input.keys[e.key] = true;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    input.left = true;
  }
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    input.right = true;
  }
});

window.addEventListener('keyup', (e) => {
  input.keys[e.key] = false;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    input.left = false;
  }
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    input.right = false;
  }
});

// Mobile Controls
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');

if (leftBtn && rightBtn) {
  leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    input.left = true;
  });
  leftBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    input.left = false;
  });
  rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    input.right = true;
  });
  rightBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    input.right = false;
  });
}

// Touch controls on canvas
canvas.addEventListener('touchstart', (e) => {
  if (gameState.screen !== 'game') return;
  e.preventDefault();
  const touch = e.touches[0];
  const x = touch.clientX;
  if (x < canvas.width / 2) {
    input.left = true;
  } else {
    input.right = true;
  }
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  input.left = false;
  input.right = false;
});

// Game Objects
class Bunny {
  constructor() {
    this.width = 32;
    this.height = 32;
    this.x = canvas.width / 2 - this.width / 2;
    this.y = canvas.height / 2;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.color = '#FFB6C1';
  }

  update() {
    // Horizontal movement
    if (input.left) {
      this.vx = -CONFIG.moveSpeed;
    } else if (input.right) {
      this.vx = CONFIG.moveSpeed;
    } else {
      this.vx = 0;
    }

    this.x += this.vx;

    // Wrap around screen
    if (this.x < -this.width) {
      this.x = canvas.width;
    } else if (this.x > canvas.width) {
      this.x = -this.width;
    }

    // Gravity
    this.vy += CONFIG.gravity;
    this.y += this.vy;

    this.onGround = false;
  }

  jump() {
    if (this.onGround) {
      this.vy = CONFIG.jumpPower;
      this.onGround = false;
    }
  }

  draw() {
    // Draw bunny body
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw ears
    ctx.fillStyle = '#FFC0CB';
    ctx.fillRect(this.x + 6, this.y - 8, 6, 10);
    ctx.fillRect(this.x + 20, this.y - 8, 6, 10);

    // Draw eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x + 8, this.y + 10, 4, 4);
    ctx.fillRect(this.x + 20, this.y + 10, 4, 4);

    // Draw nose
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(this.x + 14, this.y + 18, 4, 3);
  }
}

class Platform {
  constructor(x, y, width) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = 12;
    this.hasEnemy = false;
    this.enemy = null;
    this.color = this.getColorByHeight(y);
  }

  getColorByHeight(y) {
    const height = canvas.height - y;
    if (height > 3000) {
      return '#4A4A4A'; // Dark area
    } else if (height > 1500) {
      return '#E0E0E0'; // Snowy area
    } else {
      return '#8B4513'; // Normal area
    }
  }

  update(scrollY) {
    // Platforms are stationary, camera moves
  }

  draw(cameraY) {
    const screenY = this.y - cameraY + canvas.height / 2;
    if (screenY < -20 || screenY > canvas.height + 20) return;

    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, screenY, this.width, this.height);
    
    // Platform border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, screenY, this.width, this.height);

    // Draw enemy if exists
    if (this.enemy) {
      this.enemy.draw(cameraY);
    }
  }
}

class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 24;
    this.color = this.getColorByHeight(y);
  }

  getColorByHeight(y) {
    const height = canvas.height - y;
    if (height > 3000) {
      return '#8B008B'; // Purple enemy for dark area
    } else if (height > 1500) {
      return '#4169E1'; // Blue enemy for snowy area
    } else {
      return '#DC143C'; // Red enemy for normal area
    }
  }

  draw(cameraY) {
    const screenY = this.y - cameraY + canvas.height / 2;
    if (screenY < -30 || screenY > canvas.height + 30) return;

    // Draw enemy body
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, screenY, this.width, this.height);

    // Draw eyes
    ctx.fillStyle = '#FFF';
    ctx.fillRect(this.x + 4, screenY + 6, 6, 6);
    ctx.fillRect(this.x + 14, screenY + 6, 6, 6);

    // Draw pupils
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x + 6, screenY + 8, 3, 3);
    ctx.fillRect(this.x + 16, screenY + 8, 3, 3);

    // Draw angry mouth
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x + 6, screenY + 16, 12, 2);
  }
}

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4 - 2;
    this.life = 1;
    this.color = color;
    this.size = Math.random() * 4 + 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2;
    this.life -= 0.02;
  }

  draw(cameraY) {
    const screenY = this.y - cameraY + canvas.height / 2;
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, screenY, this.size, this.size);
    ctx.globalAlpha = 1;
  }
}

// Game Manager
class Game {
  constructor() {
    this.bunny = null;
    this.platforms = [];
    this.particles = [];
    this.cameraY = 0;
    this.lavaY = 0;
    this.gameOver = false;
    this.maxHeight = 0;
    this.lastPlatformY = 0;
  }

  init() {
    this.bunny = new Bunny();
    this.platforms = [];
    this.particles = [];
    this.cameraY = 0;
    this.lavaY = canvas.height + 100;
    this.gameOver = false;
    this.maxHeight = 0;
    this.lastPlatformY = canvas.height - 100;
    gameState.score = 0;
    gameState.height = 0;
    gameState.gameSpeed = 1;

    // Create initial platforms
    const difficultyConfig = CONFIG.difficulty[gameState.difficulty];
    
    // Starting platform
    this.platforms.push(new Platform(
      canvas.width / 2 - 50,
      canvas.height - 100,
      100
    ));

    // Generate platforms upward
    for (let i = 0; i < 20; i++) {
      this.generatePlatform();
    }
  }

  generatePlatform() {
    const difficultyConfig = CONFIG.difficulty[gameState.difficulty];
    const gap = 80 + Math.random() * 60;
    const platformY = this.lastPlatformY - gap;
    const platformX = Math.random() * (canvas.width - difficultyConfig.platformSize);
    
    const platform = new Platform(platformX, platformY, difficultyConfig.platformSize);
    
    // Add enemy with probability
    if (Math.random() < difficultyConfig.enemyFrequency) {
      const enemyX = platformX + platform.width / 2 - 12;
      platform.enemy = new Enemy(enemyX, platformY - 24);
      platform.hasEnemy = true;
    }
    
    this.platforms.push(platform);
    this.lastPlatformY = platformY;
  }

  update() {
    if (this.gameOver) return;

    // Update bunny
    this.bunny.update();

    // Camera follows bunny
    const targetCameraY = this.bunny.y - canvas.height / 3;
    if (targetCameraY < this.cameraY) {
      this.cameraY = targetCameraY;
    }

    // Update height and score
    const currentHeight = Math.max(0, Math.floor(-this.cameraY / 10));
    if (currentHeight > gameState.height) {
      gameState.height = currentHeight;
      gameState.score = currentHeight;
      
      // Increase game speed gradually
      gameState.gameSpeed = 1 + (currentHeight / 1000);
    }

    // Generate new platforms
    const highestPlatform = Math.min(...this.platforms.map(p => p.y));
    if (highestPlatform > this.cameraY - canvas.height) {
      this.generatePlatform();
    }

    // Remove platforms far below
    this.platforms = this.platforms.filter(p => p.y < this.cameraY + canvas.height + 100);

    // Platform collision
    for (const platform of this.platforms) {
      if (this.bunny.vy > 0 &&
          this.bunny.y + this.bunny.height >= platform.y &&
          this.bunny.y + this.bunny.height <= platform.y + platform.height + 10 &&
          this.bunny.x + this.bunny.width > platform.x &&
          this.bunny.x < platform.x + platform.width) {
        
        this.bunny.y = platform.y - this.bunny.height;
        this.bunny.onGround = true;
        this.bunny.jump();
        
        // Create particles
        for (let i = 0; i < 5; i++) {
          this.particles.push(new Particle(
            this.bunny.x + this.bunny.width / 2,
            platform.y,
            platform.color
          ));
        }
      }

      // Enemy collision
      if (platform.enemy) {
        const enemy = platform.enemy;
        if (this.bunny.x < enemy.x + enemy.width &&
            this.bunny.x + this.bunny.width > enemy.x &&
            this.bunny.y < enemy.y + enemy.height &&
            this.bunny.y + this.bunny.height > enemy.y) {
          this.endGame();
        }
      }
    }

    // Update lava
    const difficultyConfig = CONFIG.difficulty[gameState.difficulty];
    this.lavaY -= difficultyConfig.lavaSpeed * gameState.gameSpeed;

    // Check if bunny fell into lava
    if (this.bunny.y > this.lavaY - 50) {
      this.endGame();
    }

    // Update particles
    this.particles = this.particles.filter(p => p.life > 0);
    this.particles.forEach(p => p.update());

    // Update HUD
    document.getElementById('score-display').textContent = gameState.score;
    document.getElementById('height-display').textContent = gameState.height + 'm';
    document.getElementById('best-display').textContent = gameState.highscore;
  }

  draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background based on height
    const height = gameState.height;
    if (height > 300) {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      ctx.fillStyle = gradient;
    } else if (height > 150) {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#b8e0f6');
      gradient.addColorStop(1, '#e8f4f8');
      ctx.fillStyle = gradient;
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#E0F6FF');
      ctx.fillStyle = gradient;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw lava
    const lavaScreenY = this.lavaY - this.cameraY + canvas.height / 2;
    if (lavaScreenY < canvas.height + 100) {
      const gradient = ctx.createLinearGradient(0, lavaScreenY, 0, canvas.height);
      gradient.addColorStop(0, '#FF4500');
      gradient.addColorStop(0.5, '#FF6347');
      gradient.addColorStop(1, '#FF0000');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, lavaScreenY, canvas.width, canvas.height);

      // Lava particles
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * canvas.width;
        const offset = Math.sin(Date.now() / 200 + i) * 10;
        ctx.fillStyle = 'rgba(255, 255, 0, 0.6)';
        ctx.fillRect(x, lavaScreenY + offset, 4, 4);
      }
    }

    // Draw platforms
    this.platforms.forEach(p => p.draw(this.cameraY));

    // Draw particles
    this.particles.forEach(p => p.draw(this.cameraY));

    // Draw bunny
    ctx.save();
    ctx.translate(0, -this.cameraY + canvas.height / 2);
    this.bunny.draw();
    ctx.restore();

    // Draw golden line for highscore
    if (gameState.highscore > 0) {
      const highscoreY = -gameState.highscore * 10 - this.cameraY + canvas.height / 2;
      if (highscoreY > -20 && highscoreY < canvas.height + 20) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(0, highscoreY);
        ctx.lineTo(canvas.width, highscoreY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('BEST: ' + gameState.highscore + 'm', 10, highscoreY - 5);
      }
    }
  }

  endGame() {
    this.gameOver = true;
    
    // Update highscore
    if (gameState.score > gameState.highscore) {
      gameState.highscore = gameState.score;
      document.getElementById('new-record').style.display = 'block';
    } else {
      document.getElementById('new-record').style.display = 'none';
    }

    // Show game over screen
    showScreen('gameover');
  }
}

const game = new Game();

// UI Management
function showScreen(screen) {
  document.getElementById('main-menu').style.display = 'none';
  document.getElementById('settings-menu').style.display = 'none';
  document.getElementById('game-over-screen').style.display = 'none';
  document.getElementById('hud').style.display = 'none';
  document.getElementById('mobile-controls').style.display = 'none';

  if (screen === 'menu') {
    document.getElementById('main-menu').style.display = 'block';
    document.getElementById('menu-highscore').textContent = gameState.highscore;
    gameState.screen = 'menu';
  } else if (screen === 'settings') {
    document.getElementById('settings-menu').style.display = 'block';
    gameState.screen = 'settings';
  } else if (screen === 'game') {
    document.getElementById('hud').style.display = 'block';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      document.getElementById('mobile-controls').style.display = 'flex';
    }
    gameState.screen = 'game';
  } else if (screen === 'gameover') {
    document.getElementById('game-over-screen').style.display = 'block';
    document.getElementById('final-score').textContent = gameState.score;
    document.getElementById('final-highscore').textContent = gameState.highscore;
    gameState.screen = 'gameover';
  }
}

// Event Listeners
document.getElementById('start-btn').addEventListener('click', () => {
  game.init();
  showScreen('game');
});

document.getElementById('settings-btn').addEventListener('click', () => {
  showScreen('settings');
});

document.getElementById('back-to-menu-btn').addEventListener('click', () => {
  showScreen('menu');
});

document.getElementById('restart-btn').addEventListener('click', () => {
  game.init();
  showScreen('game');
});

document.getElementById('menu-btn').addEventListener('click', () => {
  showScreen('menu');
});

document.getElementById('difficulty-select').addEventListener('change', (e) => {
  gameState.difficulty = e.target.value;
});

document.getElementById('volume-slider').addEventListener('input', (e) => {
  gameState.volume = e.target.value / 100;
  document.getElementById('volume-value').textContent = e.target.value + '%';
});

document.getElementById('music-toggle').addEventListener('change', (e) => {
  gameState.musicEnabled = e.target.checked;
});

// Game Loop
function gameLoop() {
  if (gameState.screen === 'game') {
    game.update();
    game.draw();
  }
  requestAnimationFrame(gameLoop);
}

// Initialize
showScreen('menu');
gameLoop();