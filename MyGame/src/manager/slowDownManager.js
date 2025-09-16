export class SlowDownManager {
    constructor(scene, obstacleManager, coinManager) {
        this.scene = scene;
        this.obstacleManager = obstacleManager;
        this.coinManager = coinManager;
        this.isSlowed = false;
        this.timer = null;
    }

    activate(duration = 5000) {
        if (this.isSlowed) this.timer.remove();
        else this.isSlowed = true;

        this.obstacleManager.updateSpeed(0.5);
        this.timer = this.scene.time.delayedCall(duration, () => this.deactivate());
    }

    deactivate() {
        this.isSlowed = false;
        this.obstacleManager.updateSpeed(1);
    }
}
