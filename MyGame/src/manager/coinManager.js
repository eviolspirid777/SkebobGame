export class CoinManager {
    constructor(scene) {
        this.scene = scene;
        this.group = scene.physics.add.group();
        this.timer = null;
    }

    start() {
        this.timer = this.scene.time.addEvent({
            delay: Phaser.Math.Between(5000,10000),
            callback: this.createCoin,
            callbackScope: this,
            loop: true
        });
    }

    createCoin() {
        const y = Phaser.Math.Between(100, 620);
        const coin = this.group.create(1400, y, 'boost_coin').setScale(0.4);
        coin.body.allowGravity = false;
        this.scene.tweens.add({
            targets: coin,
            angle: 360,
            duration: 2000,
            loop: -1,
            ease: 'Linear'
        });
    }

    stop() {
        if (this.timer) this.timer.remove();
        this.group.getChildren().forEach(coin => coin.setVelocityX(0));
    }
}
