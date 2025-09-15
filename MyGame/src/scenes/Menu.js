export class Menu extends Phaser.Scene {
    startSound;

    constructor() {
        super('Menu');
    }

    preload() {
        this.load.image('background', 'assets/baseFone.jpg');
        this.load.audio('skebobStart', 'assets/SCEBOB.m4a');
    }

    create() {
        this.background = this.add.tileSprite(640, 360, 1280, 720, 'background');

        // Создаем звуки
        this.startSound = this.sound.add('skebobStart');

        // Добавляем заголовок
        this.add.text(640, 200, 'СКЕБОБ 2.0!', {
            fontSize: '80px',
            fill: '#ff0000',
            stroke: '#000',
            strokeThickness: 8,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Создаем кнопку старта
        const startButton = this.add.text(640, 500, 'НАЧАТЬ ИГРУ', {
            fontSize: '48px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4,
            backgroundColor: '#ff0000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        startButton.on('pointerout', () => {
            startButton.setStyle({ fill: '#fff' });
            startButton.setScale(1);
        });

        startButton.on('pointerdown', () => {
            startButton.setStyle({ fill: '#cc0000' });
            this.playStartSoundAndStartGame();
        });
    }

    update() {
        this.background.tilePositionX += 1;
    }

    playStartSoundAndStartGame() {
        // Воспроизводим звук старта
        this.startSound.play();

        // Запускаем игровую сцену после небольшой задержки (чтобы звук успел проиграться)
        this.time.delayedCall(500, () => {
            this.scene.start('Game');
        });
    }
}