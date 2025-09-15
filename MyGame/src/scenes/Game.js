const phrases = [
    'Ой, да у вас СКЕБОБ!',
    "Вас СКЕБОБНУЛИ!",
    "ПОЛНЫЙ СКЕБОБ!",
    "Кажется СКЕБОБ!",
    "СКЕБООООООБ!",
    "СКЕБОБ! ВСЕХ НАВЕРХ!",
    "По коням! Возможно СКЕБОБ!"
]

export class Game extends Phaser.Scene {
    bird;
    coin;
    coins;
    coinTimer;

    cursors;
    background;
    obstacles;
    timer;
    score = 0;
    scoreText;

    music

    //Переменные ускорения
    baseSpeed = -200;
    currentSpeed = -200;
    speedIncreaseRate = 5;
    obstacleDelay = 1500;
    minObstacleDelay = 800;
    delayDecreaseRate = 50;
    backgroundSpeed = 2;

    // Переменные для эффекта замедления
    isSlowed = false;
    slowDownTimer = null;
    originalSpeed = -200;
    originalBackgroundSpeed = 2;
    originalObstacleDelay = 1500;
    speedMultiplier = 1;
    obstacleDelayMultiplier = 1; // Множитель для задержки создания препятствий

    constructor() {
        super('Game');
    }

    preload() {
        this.load.image('background', 'assets/baseFone.jpg');
        this.load.spritesheet('bird', 'assets/scebob.png', { frameWidth: 136, frameHeight: 36 });
        this.load.spritesheet('bird_dead', 'assets/SkebobDead.png', { frameWidth: 236, frameHeight: 96 });
        this.load.spritesheet("boost_coin", 'assets/BoostCoin.png', { frameWidth: 100, frameHeight: 100 })
        this.load.audio('skebobMusic', 'assets/SCEBOB_MUSIC.m4a');
        this.load.audio("skebobPhrase", "assets/SCEBOB.m4a")
    }

    create() {
        this.score = 0;
        this.music = this.sound.add('skebobMusic');
        this.skebobPhrase = this.sound.add("skebobPhrase")
        this.music.setVolume(0.7);
        this.music.setLoop(true);
        this.music.play()

        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');
        this.bird = this.physics.add.sprite(140, 160, 'bird');
        this.bird.body.setSize(100, 120)
        this.bird.setCollideWorldBounds(true);

        this.obstacles = this.physics.add.group();
        this.coins = this.physics.add.group();

        this.cursors = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.input.on("pointerdown", () => this.jump());

        this.currentSpeed = this.baseSpeed;
        this.obstacleDelay = 1500;
        this.originalObstacleDelay = 1500;
        this.backgroundSpeed = 2;
        this.speedMultiplier = 1;
        this.obstacleDelayMultiplier = 1;

        this.timer = this.time.addEvent({
            delay: this.obstacleDelay,
            callback: this.createObstacle,
            callbackScope: this,
            loop: true
        });

        this.coinTimer = this.time.addEvent({
            delay: Phaser.Math.Between(5000, 10000),
            callback: this.createCoin,
            callbackScope: this,
            loop: true
        });

        this.scoreText = this.add.text(20, 20, 'Счет: 0', {
            fontSize: "32px",
            fill: 'white',
        });
        this.scoreText.setDepth(1000)

        this.physics.add.collider(this.bird, this.obstacles, this.hitObstacle, null, this);
        this.physics.add.overlap(this.bird, this.coins, this.collectCoin, null, this);
    }

    update() {
        this.background.tilePositionX += this.backgroundSpeed * this.speedMultiplier;

        if (Phaser.Input.Keyboard.JustDown(this.cursors)) {
            this.jump();
        }

        if (this.bird.y <= 61 || this.bird.y >= 659) {
            this.hitObstacle();
            return;
        }

        this.obstacles.getChildren().forEach(obstacle => {
            if (obstacle.x < -100) {
                obstacle.destroy();
                this.score += 1;
                this.scoreText.setText('Счет: ' + this.score);
                this.increaseDifficulty();
            }
        });

        this.coins.getChildren().forEach(coin => {
            if (coin.x < -100) {
                coin.destroy();
            }
        });
    }

    jump() {
        this.bird.setVelocityY(-300);
    }

    createObstacle() {
        const gap = Math.max(150, 350 - (this.score * 2));
        const obstaclePosition = Phaser.Math.Between(200, 400);

        const topObstacle = this.obstacles.create(1400, obstaclePosition - gap / 2, 'obstacle');
        topObstacle.setOrigin(0.5, 1);
        topObstacle.setScale(2, 40);
        topObstacle.flipY = true;

        const bottomObstacle = this.obstacles.create(1400, obstaclePosition + gap / 2, 'obstacle');
        bottomObstacle.setOrigin(0.5, 0);
        bottomObstacle.setScale(2, 25);

        bottomObstacle.setTint(0xff0000);
        topObstacle.setTint(0xff0000);

        [topObstacle, bottomObstacle].forEach(obstacle => {
            obstacle.setVelocityX(this.currentSpeed * this.speedMultiplier);
            obstacle.body.allowGravity = false;
            obstacle.body.setSize(
                obstacle.width * 0.9,
                obstacle.height * 0.99,
                true
            );
        });
    }

    createCoin() {
        if (this.isSlowed) return;

        const y = Phaser.Math.Between(100, 620);
        const coin = this.coins.create(1400, y, 'boost_coin');

        coin.setScale(.4,.4)

        coin.setVelocityX(this.currentSpeed * 0.8 * this.speedMultiplier);
        coin.body.allowGravity = false;

        this.tweens.add({
            targets: coin,
            angle: 360,
            duration: 2000,
            loop: -1,
            ease: 'Linear'
        });
    }

    collectCoin(bird, coin) {
        coin.destroy();

        this.skebobPhrase.setVolume(1);
        this.skebobPhrase.play();

        this.activateSlowDown();

        const effectText = this.add.text(bird.x, bird.y - 50, 'ЗАМЕДЛЕНИЕ!', {
            fontSize: '24px',
            fill: '#00ff00',
            stroke: '#000',
            strokeThickness: 3
        });

        this.tweens.add({
            targets: effectText,
            y: effectText.y - 100,
            alpha: 0,
            duration: 2000,
            onComplete: () => effectText.destroy()
        });
    }

    activateSlowDown() {
        if (this.isSlowed) {
            this.slowDownTimer.remove();
        } else {
            this.originalSpeed = this.currentSpeed;
            this.originalBackgroundSpeed = this.backgroundSpeed;
            this.originalObstacleDelay = this.obstacleDelay;
            this.isSlowed = true;
        }

        // Замедляем скорость в 2 раза
        this.speedMultiplier = 0.5;
        // Увеличиваем задержку между препятствиями в 2 раза
        this.obstacleDelayMultiplier = 2;

        this.updateAllSpeeds();
        this.updateObstacleTimer();

        this.slowDownTimer = this.time.delayedCall(5000, () => {
            this.deactivateSlowDown();
        });
    }

    deactivateSlowDown() {
        this.speedMultiplier = 1;
        this.obstacleDelayMultiplier = 1;
        this.isSlowed = false;

        this.updateAllSpeeds();
        this.updateObstacleTimer();
    }

    updateAllSpeeds() {
        this.obstacles.getChildren().forEach(obstacle => {
            obstacle.setVelocityX(this.currentSpeed * this.speedMultiplier);
        });

        this.coins.getChildren().forEach(coin => {
            coin.setVelocityX(this.currentSpeed * 0.8 * this.speedMultiplier);
        });
    }

    updateObstacleTimer() {
        // Пересоздаем таймер с новой задержкой
        if (this.timer) {
            this.timer.remove();
        }
        
        const actualDelay = this.obstacleDelay * this.obstacleDelayMultiplier;
        
        this.timer = this.time.addEvent({
            delay: actualDelay,
            callback: this.createObstacle,
            callbackScope: this,
            loop: true
        });
    }

    increaseDifficulty() {
        const acceleration = 2;

        if (this.score % acceleration === 0) {
            this.currentSpeed = this.baseSpeed - (this.score / acceleration) * this.speedIncreaseRate / 10;
            this.backgroundSpeed = Math.min(8, 2 + (this.score / acceleration) * 0.5);
            this.obstacleDelay = Math.max(
                this.minObstacleDelay,
                this.obstacleDelay - this.delayDecreaseRate
            );

            this.updateAllSpeeds();
            this.updateObstacleTimer();

            console.log(`Ускорение! Скорость: ${this.currentSpeed}, Задержка: ${this.obstacleDelay}`);
        }
    }

    hitObstacle() {
        this.bird.setTexture("bird_dead")
        this.physics.pause();
        this.music.pause();
        this.backgroundSpeed = 0;
        this.bird.setTint(0xff0000);
        
        if (this.timer) this.timer.remove();
        if (this.slowDownTimer) this.slowDownTimer.remove();
        if (this.coinTimer) this.coinTimer.remove();

        this.obstacles.getChildren().forEach(obstacle => {
            obstacle.setVelocityX(0);
        });

        this.coins.getChildren().forEach(coin => {
            coin.setVelocityX(0);
        });

        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)]

        this.add.text(650, 300, randomPhrase, {
            fontSize: '64px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(650, 400, 'Нажмите для перезагрузки...', {
            fontSize: '32px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.restart();
            this.music.restart();
            this.music.play();
        });
    }
}