import { SaveManager } from '../systems/SaveManager';
import { AudioManager } from '../systems/AudioManager';
import { InputManager } from '../systems/InputManager';
import { generateProceduralAssets } from '../systems/ProceduralAssets';
import { installPostFX } from '../systems/PostFXPipeline';

export class BootScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private audio!: AudioManager;
  private save!: SaveManager;
  private startLock = false;

  constructor() { super('BootScene'); }

  create(): void {
    this.startLock = false;
    if (!this.game.registry.get('proceduralAssetsReady')) {
      generateProceduralAssets(this);
      this.game.registry.set('proceduralAssetsReady', true);
    }
    this.save = this.game.registry.get('saveManager') ?? new SaveManager();
    this.audio = this.game.registry.get('audioManager') ?? new AudioManager();
    this.inputManager = this.game.registry.get('inputManager') ?? new InputManager(this.game.canvas);
    this.game.registry.set('saveManager', this.save);
    this.game.registry.set('audioManager', this.audio);
    this.game.registry.set('inputManager', this.inputManager);
    if (!this.game.registry.get('postfx')) this.game.registry.set('postfx', installPostFX(this.game));
    this.drawHubBackplate();
    this.updateSaveSummary();

    const menu = document.getElementById('menu-screen');
    const hud = document.getElementById('hud');
    const ending = document.getElementById('ending-screen');
    if (menu) menu.style.display = 'flex';
    if (hud) hud.style.display = 'none';
    if (ending) ending.style.display = 'none';

    const accept = document.getElementById('accept-button') as HTMLButtonElement | null;
    const reset = document.getElementById('reset-button') as HTMLButtonElement | null;
    if (accept) accept.onclick = () => { void this.startNight(); };
    if (reset) reset.onclick = () => { this.save.reset(); this.updateSaveSummary(); };
    window.addEventListener('pointerdown', this.unlockAudio, { once: true });
    window.addEventListener('keydown', this.unlockAudio, { once: true });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('pointerdown', this.unlockAudio);
      window.removeEventListener('keydown', this.unlockAudio);
    });
  }

  private unlockAudio = (): void => { void this.audio.unlock(); };

  private updateSaveSummary(): void {
    const summary = document.getElementById('save-summary');
    if (!summary) return;
    const data = this.save.dataSnapshot;
    const items = data.inventory.length ? data.inventory.join('、') : '無';
    const progress = data.completedNights.includes(1) ? '第 2 夜進度已解鎖・內容待製作' : '第 1 夜可用';
    summary.textContent = `帳戶：NT$ ${data.pocketMoney}　｜　裝備：${items}　｜　${progress}`;
  }

  private async startNight(): Promise<void> {
    if (this.startLock) return;
    this.startLock = true;
    await this.audio.unlock();
    const menu = document.getElementById('menu-screen');
    if (this.save.dataSnapshot.unlockedLevel > 1 && this.save.dataSnapshot.completedNights.includes(1)) {
      const dialog = document.querySelector('#menu-screen .dialogue');
      if (dialog) dialog.innerHTML = '<strong>聞淨香：</strong>「第 2 夜《奪命小丑派對》進度已解鎖，關卡內容尚未收錄。可以重新挑戰第一夜。」';
      const accept = document.getElementById('accept-button');
      if (accept) (accept as HTMLButtonElement).textContent = '重新挑戰第 1 夜';
    }
    if (menu) menu.style.display = 'none';
    this.scene.start('Level1Scene');
    this.scene.launch('UIOverlayScene');
  }

  private drawHubBackplate(): void {
    const bg = this.add.graphics().setDepth(-10);
    bg.fillGradientStyle(0x171a21, 0x171a21, 0x3b2d28, 0x171b20, 1).fillRect(0, 0, 1280, 720);
    bg.fillStyle(0x272a30, 1).fillRect(0, 476, 1280, 244);
    bg.lineStyle(3, 0x765a48, 1).lineBetween(0, 478, 1280, 478);
    for (let i = 0; i < 7; i += 1) {
      const x = i * 205 - 10;
      bg.fillStyle(0x252b31, 1).fillRect(x, 120, 148, 356);
      bg.lineStyle(3, 0x655546, 0.8).strokeRect(x + 14, 155, 120, 265);
      bg.fillStyle(i % 2 ? 0x404448 : 0x3d342e, 1).fillRect(x + 22, 185, 103, 10);
    }
    bg.fillStyle(0x542b25, 0.92).fillRect(920, 180, 244, 276);
    bg.fillStyle(0x19191c, 1).fillRect(947, 208, 190, 199);
    bg.lineStyle(5, 0xc38c48, 1).strokeRect(943, 204, 198, 207);
    bg.fillStyle(0xf7d37d, 0.22).fillCircle(1005, 260, 66);
    this.add.image(384, 466, 'player').setDisplaySize(120, 184).setDepth(0);
    this.add.image(1027, 386, 'shelf').setDisplaySize(180, 260).setDepth(-1).setAlpha(0.38);
    this.add.text(90, 91, '頂樓加蓋・欠費單', { fontFamily: 'sans-serif', fontSize: '20px', color: '#f3d58a', backgroundColor: '#17191fdd', padding: { x: 12, y: 9 } });
    this.add.text(102, 145, '房租催繳\n母親連帶保證債務\n電費：逾期 3 次', { fontFamily: 'sans-serif', fontSize: '19px', color: '#e8d8bc', lineSpacing: 10, backgroundColor: '#18191ddd', padding: { x: 13, y: 12 } });
    this.add.text(906, 142, '一路好走\n人力銀行', { fontFamily: 'sans-serif', fontSize: '26px', fontStyle: 'bold', align: 'center', color: '#f5d988', backgroundColor: '#241915cc', padding: { x: 8, y: 6 } }).setDepth(1);
    this.add.text(510, 514, '「先活著領薪水，欠的債再慢慢還。」', { fontFamily: 'sans-serif', fontSize: '20px', color: '#cbd7c6', fontStyle: 'italic' });
    for (let i = 0; i < 16; i += 1) this.add.image(78 + i * 77, 604 + (i % 3) * 21, 'dust').setScale(0.6 + (i % 3) * 0.2).setAlpha(0.24).setDepth(-2);
  }

  update(): void {
    const snapshot = this.inputManager.read();
    if (!this.startLock && (snapshot.pressed.interact || snapshot.pressed.start)) void this.startNight();
  }
}
