export class Bird {
    constructor(scene, x, y) {
        this.scene = scene;
        this.container = scene.add.container(x, y);
        this.sprite = scene.add.sprite(0, 0, 'bird');
        this.sprite.setOrigin(0.4, 0.5);
        this.container.add(this.sprite);

        this.createPhysics();
    }

    createPhysics() {
        const physicsData = this.scene.cache.json.get("skebobSkeleton").scebob.fixtures[0].vertices;
        physicsData.forEach(polygon => {
            const minX = Math.min(...polygon.map(v => v.x));
            const minY = Math.min(...polygon.map(v => v.y));
            const maxX = Math.max(...polygon.map(v => v.x));
            const maxY = Math.max(...polygon.map(v => v.y));
            const rect = this.scene.add.rectangle(
                minX + (maxX - minX) / 2,
                minY + (maxY - minY) / 2,
                maxX - minX,
                maxY - minY,
                0x00ff00,
                0
            );
            this.scene.physics.add.existing(rect);
            rect.body.setCollideWorldBounds(true);
            this.container.add(rect);
        });
    }

    jump() {
        this.container.list.forEach(obj => {
            if (obj.body) obj.body.setVelocityY(-300);
        });
    }

    updateSpritePosition() {
        const mainRect = this.container.list.find(obj => obj.body);
        if (mainRect) {
            this.sprite.x = mainRect.x;
            this.sprite.y = mainRect.y;
        }
    }
}