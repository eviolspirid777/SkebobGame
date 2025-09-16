const phrases = [
    'Ой, да у вас СКЕБОБ!',
    "Вас СКЕБОБНУЛИ!",
    "ПОЛНЫЙ СКЕБОБ!",
    "Кажется СКЕБОБ!",
    "СКЕБООООООБ!",
    "СКЕБОБ! ВСЕХ НАВЕРХ!",
    "По коням! Возможно СКЕБОБ!"
]

let globalMusic;

export class Game extends Phaser.Scene {
    birdContainer;
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

        this.load.json("skebobSkeleton", "assets/SkebobSkeleton.json")
        this.load.json("skebobDeadSkeleton", "assets/SkebobDeadSkeleton.json")
    }

    create() {
        this.score = 0;
        if(!globalMusic) {
            globalMusic = this.sound.add('skebobMusic', { volume: 0.7, loop: true });
            globalMusic.play();
        }
        this.skebobPhrase = this.sound.add("skebobPhrase")

        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');

        // === Создаем bird через квадратики ===
        const physicsData = this.cache.json.get("skebobSkeleton").scebob.fixtures[0].vertices;

        this.birdContainer = this.add.container(140, 160);

        this.birdSprite = this.add.sprite(0, 0, 'bird');
        this.birdSprite.setOrigin(0.4, 0.5);
        this.birdContainer.add(this.birdSprite);

        physicsData.forEach(polygon => {
            // Находим bounding box каждой фигуры
            let minX = Math.min(...polygon.map(v => v.x));
            let minY = Math.min(...polygon.map(v => v.y));
            let maxX = Math.max(...polygon.map(v => v.x));
            let maxY = Math.max(...polygon.map(v => v.y));

            let width = maxX - minX;
            let height = maxY - minY;

            // Создаем прозрачный квадрат для Arcade Physics
            const rect = this.add.rectangle(
                minX + width / 2,
                minY + height / 2,
                width,
                height,
                0x00ff00,
                0
            );
            this.physics.add.existing(rect);
            rect.body.setImmovable(false);
            rect.body.allowGravity = true;
            rect.body.setCollideWorldBounds(true);

            this.birdContainer.add(rect);
        });

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

        // === Коллайдеры с препятствиями и монетами ===
        this.physics.add.collider(this.birdContainer.list, this.obstacles, this.hitObstacle, null, this);
        this.physics.add.overlap(this.birdContainer.list, this.coins, this.collectCoin, null, this);

    }

    update() {
        this.background.tilePositionX += this.backgroundSpeed * this.speedMultiplier;

        if (Phaser.Input.Keyboard.JustDown(this.cursors)) {
            this.jump();
        }

        // Привязка спрайта к первому прямоугольнику (или среднему)
        const mainRect = this.birdContainer.list.find(obj => obj.body);
        if (mainRect) {
            this.birdSprite.x = mainRect.x;
            this.birdSprite.y = mainRect.y;
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
        this.birdContainer.list.forEach(obj => {
            if (obj.body) {
                obj.body.setVelocityY(-300);
            }
        });
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

        coin.setScale(.4, .4)

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
            this.backgroundSpeed = Math.min(5, 2 + (this.score / acceleration) * 0.5);
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
        //this.bird.setTexture("bird_dead") // убираем
        this.physics.pause();
        globalMusic.pause();
        this.backgroundSpeed = 0;

        // Если хочешь подсветить квадраты красным
        this.birdContainer.list.forEach(obj => {
            if (obj.setFillStyle) {
                obj.setFillStyle(0xff0000, 0.5);
            }
        });

        if (this.timer) this.timer.remove();
        if (this.slowDownTimer) this.slowDownTimer.remove();
        if (this.coinTimer) this.coinTimer.remove();

        this.obstacles.getChildren().forEach(obstacle => obstacle.setVelocityX(0));
        this.coins.getChildren().forEach(coin => coin.setVelocityX(0));

        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

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
            globalMusic.play();
            this.scene.restart();
        });
    }
}

/*
import { Bird } from "../entities/bird.js"
import { ObstacleManager } from "../manager/obstacleManager.js"
import { CoinManager } from "../manager/coinManager.js"
import { SlowDownManager } from "../manager/slowDownManager.js"


const phrases = [
    'Ой, да у вас СКЕБОБ!',
    "Вас СКЕБОБНУЛИ!",
    "ПОЛНЫЙ СКЕБОБ!",
    "Кажется СКЕБОБ!",
    "СКЕБООООООБ!",
    "СКЕБОБ! ВСЕХ НАВЕРХ!",
    "По коням! Возможно СКЕБОБ!"
];

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        this.score = 0;
        this.baseSpeed = -200;
        this.backgroundSpeed = 2;
    }

    preload() {
        this.load.image('background', 'assets/baseFone.jpg');
        this.load.spritesheet('bird', 'assets/scebob.png', { frameWidth: 136, frameHeight: 36 });
        this.load.spritesheet('bird_dead', 'assets/SkebobDead.png', { frameWidth: 236, frameHeight: 96 });
        this.load.spritesheet("boost_coin", 'assets/BoostCoin.png', { frameWidth: 100, frameHeight: 100 });
        this.load.audio('skebobMusic', 'assets/SCEBOB_MUSIC.m4a');
        this.load.audio("skebobPhrase", "assets/SCEBOB.m4a");
        this.load.json("skebobSkeleton", "assets/SkebobSkeleton.json");
        this.load.json("skebobDeadSkeleton", "assets/SkebobDeadSkeleton.json");
        this.load.image("obstacle", "assets/obstacle.png"); // Добавим текстуру препятствия
    }

    create() {
        this.score = 0;

        // Музыка
        this.music = this.sound.add('skebobMusic', { volume: 0.7, loop: true });
        this.music.play();

        this.skebobPhrase = this.sound.add("skebobPhrase");

        // Фон
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');

        // Игрок
        this.bird = new Bird(this, 140, 160);

        // Препятствия и монеты
        this.obstacleManager = new ObstacleManager(this);
        this.obstacleManager.currentSpeed = this.baseSpeed;
        this.obstacleManager.start(1500);

        this.coinManager = new CoinManager(this);
        this.coinManager.start();

        // Эффект замедления
        this.slowDownManager = new SlowDownManager(this, this.obstacleManager, this.coinManager);

        // Ввод
        this.cursors = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.input.on("pointerdown", () => this.bird.jump());

        // Текст счёта
        this.scoreText = this.add.text(20, 20, 'Счет: 0', { fontSize: "32px", fill: 'white' }).setDepth(1000);

        // Коллайдеры
        this.physics.add.collider(this.bird.container.list, this.obstacleManager.group, this.hitObstacle, null, this);
        this.physics.add.overlap(this.bird.container.list, this.coinManager.group, this.collectCoin, null, this);
    }

    update() {
        this.background.tilePositionX += this.backgroundSpeed * (this.slowDownManager.isSlowed ? 0.5 : 1);

        if (Phaser.Input.Keyboard.JustDown(this.cursors)) this.bird.jump();

        this.bird.updateSpritePosition();

        // Проверка препятствий для удаления и увеличения счета
        this.obstacleManager.group.getChildren().forEach(obstacle => {
            if (obstacle.x < -100) {
                obstacle.destroy();
                this.score += 1;
                this.scoreText.setText('Счет: ' + this.score);
                this.increaseDifficulty();
            }
        });

        // Удаление монет за пределами экрана
        this.coinManager.group.getChildren().forEach(coin => {
            if (coin.x < -100) coin.destroy();
        });
    }

    collectCoin(birdObj, coin) {
        coin.destroy();
        this.skebobPhrase.play();

        // Замедление
        this.slowDownManager.activate(5000);

        // Текст эффекта
        const effectText = this.add.text(birdObj.x, birdObj.y - 50, 'ЗАМЕДЛЕНИЕ!', {
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

    increaseDifficulty() {
        const acceleration = 2;
        if (this.score % acceleration === 0) {
            const speed = this.baseSpeed - (this.score / acceleration) * 0.5;
            this.obstacleManager.currentSpeed = speed;
            this.obstacleManager.updateSpeed(this.slowDownManager.isSlowed ? 0.5 : 1);

            this.backgroundSpeed = Math.min(5, 2 + (this.score / acceleration) * 0.5);
        }
    }

    hitObstacle() {
        this.physics.pause();
        this.music.pause();
        this.backgroundSpeed = 0;

        // Подсветка игрока
        this.bird.container.list.forEach(obj => { if (obj.setFillStyle) obj.setFillStyle(0xff0000, 0.5); });

        // Остановка всех таймеров
        this.obstacleManager.stop();
        this.coinManager.stop();

        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];

        this.add.text(650, 300, randomPhrase, { fontSize: '64px', fill: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        this.add.text(650, 400, 'Нажмите для перезагрузки...', { fontSize: '32px', fill: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.restart();
            this.music.play();
        });
    }
}

*/