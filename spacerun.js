document.addEventListener('DOMContentLoaded', () => {
    // Configuração do canvas
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Elementos da UI
    const scoreElement = document.getElementById('score');
    const livesElement = document.getElementById('lives');
    const levelElement = document.getElementById('level');
    const speedElement = document.getElementById('speed');
    const startButton = document.getElementById('startButton');
    const pauseButton = document.getElementById('pauseButton');
    const restartButton = document.getElementById('restartButton');
    const gameOverScreen = document.getElementById('gameOver');
    const finalScoreElement = document.getElementById('finalScore');
    
    // Variáveis do jogo (modo difícil)
    let gameRunning = false;
    let gamePaused = false;
    let score = 0;
    let lives = 3;
    let level = 1;
    let globalSpeedMultiplier = 1.0;
    let animationId;
    
    // Nave do jogador
    const player = {
        x: canvas.width / 2 - 25,
        y: canvas.height - 60,
        width: 50,
        height: 40,
        speed: 7,
        color: '#ff3300',
        invulnerable: false,
        blinkCount: 0
    };
    
    // Arrays de objetos do jogo
    let obstacles = [];
    let stars = [];
    let enemyShips = [];
    let enemyBullets = [];
    
    // Teclas pressionadas
    const keys = {
        ArrowLeft: false,
        ArrowRight: false
    };
    
    // Configuração de eventos
    window.addEventListener('keydown', (e) => {
        if (e.key in keys) {
            keys[e.key] = true;
        }
    });
    
    window.addEventListener('keyup', (e) => {
        if (e.key in keys) {
            keys[e.key] = false;
        }
    });
    
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);
    restartButton.addEventListener('click', restartGame);
    
    // Funções do jogo
    function startGame() {
        if (!gameRunning) {
            gameRunning = true;
            gamePaused = false;
            score = 0;
            lives = 3;
            level = 1;
            globalSpeedMultiplier = 1.0;
            obstacles = [];
            stars = [];
            enemyShips = [];
            enemyBullets = [];
            updateUI();
            gameOverScreen.style.display = 'none';
            gameLoop();
        }
    }
    
    function togglePause() {
        if (gameRunning) {
            gamePaused = !gamePaused;
            pauseButton.textContent = gamePaused ? 'Continuar' : 'Pausar';
        }
    }
    
    function restartGame() {
        gameOverScreen.style.display = 'none';
        startGame();
    }
    
    function gameOver() {
        gameRunning = false;
        cancelAnimationFrame(animationId);
        finalScoreElement.textContent = score;
        gameOverScreen.style.display = 'flex';
    }
    
    function updateUI() {
        scoreElement.textContent = score;
        livesElement.textContent = lives;
        levelElement.textContent = level;
        speedElement.textContent = globalSpeedMultiplier.toFixed(1) + 'x';
    }
    
    function makePlayerInvulnerable() {
        player.invulnerable = true;
        player.blinkCount = 0;
        
        const blinkInterval = setInterval(() => {
            player.blinkCount++;
            
            if (player.blinkCount >= 10) {
                player.invulnerable = false;
                clearInterval(blinkInterval);
            }
        }, 200);
    }
    
    function createObstacle() {
        const width = Math.random() * 50 + 20;
        const obstacle = {
            x: Math.random() * (canvas.width - width),
            y: -50,
            width: width,
            height: 30,
            speed: (Math.random() * 3 + 3 + level/2) * globalSpeedMultiplier,
            color: '#ff3300'
        };
        obstacles.push(obstacle);
    }
    
    function createStar() {
        const star = {
            x: Math.random() * (canvas.width - 20),
            y: -30,
            width: 20,
            height: 20,
            speed: (Math.random() * 2 + 2) * globalSpeedMultiplier,
            color: '#ffcc00',
            collected: false
        };
        stars.push(star);
    }
    
    function createEnemyShip() {
        const ship = {
            x: Math.random() * (canvas.width - 40),
            y: -60,
            width: 40,
            height: 30,
            speed: (Math.random() * 2 + 2) * globalSpeedMultiplier,
            color: '#ff0066',
            lastShot: Date.now()
        };
        enemyShips.push(ship);
    }
    
    function shootEnemyBullet(ship) {
        const bullet = {
            x: ship.x + ship.width / 2 - 2,
            y: ship.y + ship.height,
            width: 4,
            height: 15,
            speed: 5 * globalSpeedMultiplier,
            color: '#ff0066'
        };
        enemyBullets.push(bullet);
    }
    
    function updatePlayer() {
        if (keys.ArrowLeft && player.x > 0) {
            player.x -= player.speed;
        }
        if (keys.ArrowRight && player.x < canvas.width - player.width) {
            player.x += player.speed;
        }
    }
    
    function updateObstacles() {
        // Move os obstáculos e verifica colisões
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].y += obstacles[i].speed;
            
            // Verifica colisão com o jogador
            if (
                !player.invulnerable &&
                player.x < obstacles[i].x + obstacles[i].width &&
                player.x + player.width > obstacles[i].x &&
                player.y < obstacles[i].y + obstacles[i].height &&
                player.y + player.height > obstacles[i].y
            ) {
                obstacles.splice(i, 1);
                lives--;
                updateUI();
                makePlayerInvulnerable();
                if (lives <= 0) {
                    gameOver();
                    return;
                }
            }
            // Remove obstáculos que saíram da tela
            else if (obstacles[i].y > canvas.height) {
                obstacles.splice(i, 1);
            }
        }
    }
    
    function updateStars() {
        // Move as estrelas e verifica colisões
        for (let i = stars.length - 1; i >= 0; i--) {
            stars[i].y += stars[i].speed;
            
            // Verifica colisão com o jogador
            if (
                !stars[i].collected &&
                player.x < stars[i].x + stars[i].width &&
                player.x + player.width > stars[i].x &&
                player.y < stars[i].y + stars[i].height &&
                player.y + player.height > stars[i].y
            ) {
                stars[i].collected = true;
                score += 100;
                updateUI();
            }
            // Remove estrelas que saíram da tela
            if (stars[i].y > canvas.height) {
                stars.splice(i, 1);
            }
        }
    }
    
    function updateEnemyShips() {
        // Move as naves inimigas e faz elas atirarem
        for (let i = enemyShips.length - 1; i >= 0; i--) {
            enemyShips[i].y += enemyShips[i].speed;
            
            // Verifica se é hora de atirar
            if (Date.now() - enemyShips[i].lastShot > 2000) {
                shootEnemyBullet(enemyShips[i]);
                enemyShips[i].lastShot = Date.now();
            }
            
            // Remove naves que saíram da tela
            if (enemyShips[i].y > canvas.height) {
                enemyShips.splice(i, 1);
            }
        }
    }
    
    function updateEnemyBullets() {
        // Move os projéteis inimigos e verifica colisões
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            enemyBullets[i].y += enemyBullets[i].speed;
            
            // Verifica colisão com o jogador
            if (
                !player.invulnerable &&
                player.x < enemyBullets[i].x + enemyBullets[i].width &&
                player.x + player.width > enemyBullets[i].x &&
                player.y < enemyBullets[i].y + enemyBullets[i].height &&
                player.y + player.height > enemyBullets[i].y
            ) {
                enemyBullets.splice(i, 1);
                lives--;
                updateUI();
                makePlayerInvulnerable();
                if (lives <= 0) {
                    gameOver();
                    return;
                }
            }
            // Remove projéteis que saíram da tela
            else if (enemyBullets[i].y > canvas.height) {
                enemyBullets.splice(i, 1);
            }
        }
    }
    
    function increaseDifficulty() {
        // Aumenta o nível a cada 300 pontos
        const newLevel = Math.floor(score / 300) + 1;
        if (newLevel > level) {
            level = newLevel;
            updateUI();
        }
        
        // Aumenta a velocidade global progressivamente
        globalSpeedMultiplier = 1.0 + (score / 2000);
        
        // A cada 1000 pontos, adiciona uma vida (máximo de 5)
        if (score > 0 && score % 1000 === 0 && lives < 5) {
            lives++;
            updateUI();
        }
    }
    
    function drawPlayer() {
        // Piscar quando invulnerável
        if (player.invulnerable && player.blinkCount % 2 === 0) {
            return;
        }
        
        ctx.fillStyle = player.color;
        // Desenha a nave (triângulo)
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y);
        ctx.lineTo(player.x, player.y + player.height);
        ctx.lineTo(player.x + player.width, player.y + player.height);
        ctx.closePath();
        ctx.fill();
        
        // Desenha propulsor
        ctx.fillStyle = '#ff9900';
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2 - 10, player.y + player.height);
        ctx.lineTo(player.x + player.width / 2, player.y + player.height + 15);
        ctx.lineTo(player.x + player.width / 2 + 10, player.y + player.height);
        ctx.closePath();
        ctx.fill();
    }
    
    function drawObstacles() {
        obstacles.forEach(obstacle => {
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Detalhes no meteoro
            ctx.fillStyle = '#ff7744';
            ctx.beginPath();
            ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, obstacle.width/4, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    function drawStars() {
        stars.forEach(star => {
            if (!star.collected) {
                ctx.fillStyle = star.color;
                
                // Desenha uma estrela
                ctx.beginPath();
                ctx.moveTo(star.x + star.width/2, star.y);
                ctx.lineTo(star.x + star.width*0.7, star.y + star.height*0.7);
                ctx.lineTo(star.x + star.width, star.y + star.height*0.4);
                ctx.lineTo(star.x + star.width*0.8, star.y + star.height);
                ctx.lineTo(star.x + star.width/2, star.y + star.height*0.8);
                ctx.lineTo(star.x + star.width*0.2, star.y + star.height);
                ctx.lineTo(star.x, star.y + star.height*0.4);
                ctx.lineTo(star.x + star.width*0.3, star.y + star.height*0.7);
                ctx.closePath();
                ctx.fill();
            }
        });
    }
    
    function drawEnemyShips() {
        enemyShips.forEach(ship => {
            ctx.fillStyle = ship.color;
            
            // Desenha a nave inimiga
            ctx.beginPath();
            ctx.moveTo(ship.x, ship.y);
            ctx.lineTo(ship.x + ship.width, ship.y);
            ctx.lineTo(ship.x + ship.width/2, ship.y + ship.height);
            ctx.closePath();
            ctx.fill();
        });
    }
    
    function drawEnemyBullets() {
        enemyBullets.forEach(bullet => {
            ctx.fillStyle = bullet.color;
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
    }
    
    function drawBackground() {
        // Fundo estrelado
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Estrelas de fundo
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 2;
            ctx.fillRect(x, y, size, size);
        }
        
        // Efeito de velocidade
        if (globalSpeedMultiplier > 1.5) {
            ctx.fillStyle = 'rgba(255, 51, 0, 0.1)';
            
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * canvas.width;
                const height = Math.random() * 100 + 50;
                const width = Math.random() * 5 + 2;
                ctx.fillRect(x, canvas.height - height, width, height);
            }
        }
    }
    
    function draw() {
        drawBackground();
        drawPlayer();
        drawObstacles();
        drawStars();
        drawEnemyShips();
        drawEnemyBullets();
        
        // Desenha a pontuação no canvas também
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`Pontuação: ${score}`, 10, 30);
        ctx.fillText(`Vidas: ${lives}`, canvas.width - 100, 30);
        
        // Indicador de velocidade
        if (globalSpeedMultiplier > 1.2) {
            ctx.fillStyle = '#ff3300';
            ctx.fillText(`Velocidade: ${globalSpeedMultiplier.toFixed(1)}x`, canvas.width/2 - 80, 30);
        }
    }
    
    function update() {
        if (gamePaused) return;
        
        updatePlayer();
        updateObstacles();
        updateStars();
        updateEnemyShips();
        updateEnemyBullets();
        increaseDifficulty();
        
        // Gera novos obstáculos, estrelas e naves inimigas
        if (Math.random() < 0.05 + level/50) {
            createObstacle();
        }
        
        if (Math.random() < 0.02) {
            createStar();
        }
        
        if (Math.random() < 0.01 + level/100) {
            createEnemyShip();
        }
        
        // Aumenta a pontuação com o tempo
        score += 1;
        updateUI();
    }
    
    function gameLoop() {
        update();
        draw();
        
        if (gameRunning) {
            animationId = requestAnimationFrame(gameLoop);
        }
    }
    
    // Inicialização
    draw();
});