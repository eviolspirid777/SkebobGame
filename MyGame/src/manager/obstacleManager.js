export class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.currentSpeed = -200;
        this.timer = null;

        // Ключевой момент:
        this.group = scene.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite, // все объекты будут Arcade.Sprite
            runChildUpdate: false // обновлять автоматически не нужно
        });
    }

    start(delay = 1500) {
        this.timer = this.scene.time.addEvent({
            delay,
            callback: this.createObstacle,
            callbackScope: this,
            loop: true
        });
    }

    createObstacle() {
        const gap = Math.max(150, 350 - (this.scene.score * 2));
        const y = Phaser.Math.Between(200, 400);

        const top = this.group.get(1400, y - gap / 2, 'obstacle');
        top.setOrigin(0.5, 1).setScale(2, 40).setFlipY(true);
        top.body.allowGravity = false;
        top.setActive(true).setVisible(true);
        top.setVelocityX(this.currentSpeed);

        const bottom = this.group.get(1400, y + gap / 2, 'obstacle');
        bottom.setOrigin(0.5, 0).setScale(2, 25);
        bottom.body.allowGravity = false;
        bottom.setActive(true).setVisible(true);
        bottom.setVelocityX(this.currentSpeed);

        bottom.setTint(0xff0000);
        top.setTint(0xff0000)
    }

    updateSpeed(speedMultiplier = 1) {
        this.group.getChildren().forEach(obs => {
            if (obs.active) obs.setVelocityX(this.currentSpeed * speedMultiplier);
        });
    }

    stop() {
        if (this.timer) this.timer.remove();
        this.group.getChildren().forEach(obs => {
            if (obs.active) obs.setVelocityX(0);
        });
    }
}
