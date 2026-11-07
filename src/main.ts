import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { Level1Scene } from './scenes/Level1Scene';
import { UIOverlayScene } from './scenes/UIOverlayScene';
import { DaveEndingScene } from './scenes/DaveEndingScene';

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#090b12',
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  antialiasGL: false,
  powerPreference: 'high-performance',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
    expandParent: true,
  },
  render: {
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    antialiasGL: false,
    clearBeforeRender: true,
    preserveDrawingBuffer: false,
    maxLights: 8,
  },
  input: {
    activePointers: 3,
    smoothFactor: 0,
    windowEvents: true,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  fps: { target: 60, forceSetTimeOut: false, deltaHistory: 10 },
  scene: [BootScene, Level1Scene, UIOverlayScene, DaveEndingScene],
});

window.addEventListener('resize', () => game.scale.refresh(), { passive: true });
window.addEventListener('orientationchange', () => game.scale.refresh(), { passive: true });
window.addEventListener('beforeunload', () => {
  const audio = game.registry.get('audioManager') as { destroy?: () => void } | undefined;
  audio?.destroy?.();
}, { once: true });

declare global {
  interface Window { __QIONGTU_GAME__?: Phaser.Game; }
}

window.__QIONGTU_GAME__ = game;
