import { Game } from './scenes/Game.js';
import { Menu } from "./scenes/Menu.js"

const config = {
    type: Phaser.AUTO,
    title: 'Overlord Rising',
    description: '',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    pixelArt: false,
    scene: [
        Menu, Game
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: "arcade",
        arcade: { 
            gravity: { y: 900 },
            // debug: true
        }
    }
}

new Phaser.Game(config);
