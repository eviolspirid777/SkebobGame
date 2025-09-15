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
    cursors;
    background;
    obstacles;
    timer;
    score = 0;
    scoreText;

    music

    //Переменные ускорения
    baseSpeed = -200; // Базовая скорость преград
    currentSpeed = -200; // Текущая скорость
    speedIncreaseRate = 5; // На сколько увеличивать скорость за каждые 10 очков
    obstacleDelay = 1500; // Начальная задержка между преградами
    minObstacleDelay = 800; // Минимальная задержка
    delayDecreaseRate = 50; // На сколько уменьшать задержку за каждые 10 очков
    backgroundSpeed = 2; // Скорость фона

    constructor() {
        super('Game');
    }

    preload() {
        this.load.image('background', 'assets/baseFone.jpg');
        this.load.spritesheet('bird', 'assets/scebob.png', { frameWidth: 136, frameHeight: 36 });
        this.load.spritesheet('bird_dead', 'assets/SkebobDead.png', { frameWidth: 236, frameHeight: 96 });
        this.load.audio('skebobMusic', 'assets/SCEBOB_MUSIC.m4a');
    }

    create() {
        this.score = 0;
        this.music = this.sound.add('skebobMusic');

        // Настраиваем музыку (если нужно)
        this.music.setVolume(0.7); // Громкость 70%
        this.music.setLoop(true); // Зацикливаем музыку

        this.music.play()

        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');
        this.bird = this.physics.add.sprite(140, 160, 'bird');
        this.bird.body.setSize(100, 120)
        this.bird.setCollideWorldBounds(true);

        this.obstacles = this.physics.add.group();
        this.cursors = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.input.on("pointerdown", () => this.jump());

        this.currentSpeed = this.baseSpeed;
        this.obstacleDelay = 1500;
        this.backgroundSpeed = 2;

        this.timer = this.time.addEvent({
            delay: this.obstacleDelay,
            callback: this.createObstacle,
            callbackScope: this,
            loop: true
        });

        this.scoreText = this.add.text(20, 20, 'Счет: 0', {
            fontSize: "32px",
            fill: 'white',
        });

        this.scoreText.setDepth(1000)

        this.physics.add.collider(this.bird, this.obstacles, this.hitObstacle, null, this);
    }

    update() {
        console.log(this.game.config.height)
        console.group("BIRD")
        console.log(this.bird.y)
        console.log(this.bird.x)
        console.groupEnd()
        this.background.tilePositionX += this.backgroundSpeed;

        if (Phaser.Input.Keyboard.JustDown(this.cursors)) {
            this.jump();
        }

        // Проверяем выход за верхнюю и нижнюю границы
        if (this.bird.y <= 61 || this.bird.y >= 659) {
            this.hitObstacle();
            return; // Прекращаем выполнение update
        }

        // Удаляем преграды, которые ушли за экран
        this.obstacles.getChildren().forEach(obstacle => {
            if (obstacle.x < -100) {
                obstacle.destroy();
                this.score += 1;
                this.scoreText.setText('Счет: ' + this.score);

                this.increaseDifficulty();
            }
        });
    }

    jump() {
        this.bird.setVelocityY(-300);
    }

    createObstacle() {
        const gap = Math.max(150, 350 - (this.score * 2)); // Разрыв между преградами
        const obstaclePosition = Phaser.Math.Between(200, 400);

        // Верхняя преграда
        const topObstacle = this.obstacles.create(1400, obstaclePosition - gap / 2, 'obstacle');
        topObstacle.setOrigin(0.5, 1); // Якорь внизу
        topObstacle.setScale(2, 40); // Настройте масштаб под ваше изображение
        topObstacle.flipY = true; // Переворачиваем вертикально

        // Нижняя преграда
        const bottomObstacle = this.obstacles.create(1400, obstaclePosition + gap / 2, 'obstacle');
        bottomObstacle.setOrigin(0.5, 0); // Якорь вверху
        bottomObstacle.setScale(2, 25); // Настройте масштаб под ваше изображение

        bottomObstacle.setTint(0xff0000); // красный
        topObstacle.setTint(0xff0000);


        // Настройка физики с текущей скоростью
        [topObstacle, bottomObstacle].forEach(obstacle => {
            obstacle.setVelocityX(this.currentSpeed); // Используем текущую скорость
            obstacle.body.allowGravity = false;
            obstacle.body.setSize(
                obstacle.width * 0.9,
                obstacle.height * 0.99,
                true
            );
        });
    }

    increaseDifficulty() {
        const acceleration = 2;

        // Увеличиваем скорость каждые 10 очков
        if (this.score % acceleration === 0) {
            // Увеличиваем скорость преград
            this.currentSpeed = this.baseSpeed - (this.score / acceleration) * this.speedIncreaseRate / 10;

            // Увеличиваем скорость фона
            this.backgroundSpeed = Math.min(8, 2 + (this.score / acceleration) * 0.5);

            // Уменьшаем задержку между преградами (но не меньше минимума)
            this.obstacleDelay = Math.max(
                this.minObstacleDelay,
                this.obstacleDelay - this.delayDecreaseRate
            );

            // Обновляем таймер с новой задержкой
            this.timer.remove();
            this.timer = this.time.addEvent({
                delay: this.obstacleDelay,
                callback: this.createObstacle,
                callbackScope: this,
                loop: true
            });

            console.log(`Ускорение! Скорость: ${this.currentSpeed}, Задержка: ${this.obstacleDelay}`);
        }
    }

    hitObstacle() {
        this.bird.setTexture("bird_dead")
        this.physics.pause();
        this.music.pause();
        this.backgroundSpeed = 0;
        this.bird.setTint(0xff0000);
        this.timer.remove();

        this.obstacles.getChildren().forEach(obstacle => {
            obstacle.setVelocityX(0);
        });

        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)]

        this.add.text(650, 300, randomPhrase
            , {
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