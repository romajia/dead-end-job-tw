import { PARAMS } from '../config/GameConstants';
import { AudioManager } from '../systems/AudioManager';
import { InputManager } from '../systems/InputManager';
import { SaveManager } from '../systems/SaveManager';

export class DaveEndingScene extends Phaser.Scene {
  private audio!: AudioManager;
  private inputManager!: InputManager;
  private save!: SaveManager;
  private stage = 0;
  private finalReady = false;
  private endingCopy!: HTMLElement;
  private endingScreen!: HTMLElement;
  private hud!: HTMLElement;
  private continueButton!: HTMLButtonElement;
  private rumbleTimer = 0;
  private rumbleFallback = (event: Event): void => {
    const detail = (event as CustomEvent<{ duration: number; intensity: number }>).detail;
    if (detail) this.cameras.main.shake(detail.duration, detail.intensity);
  };

  constructor() { super('DaveEndingScene'); }

  create(): void {
    this.audio = this.game.registry.get('audioManager') as AudioManager;
    this.inputManager = this.game.registry.get('inputManager') as InputManager;
    this.save = this.game.registry.get('saveManager') as SaveManager;
    this.endingScreen = document.getElementById('ending-screen')!;
    this.endingCopy = document.getElementById('ending-copy')!;
    this.hud = document.getElementById('hud')!;
    this.continueButton = document.getElementById('continue-button') as HTMLButtonElement;
    this.drawEndingStage();
    this.hud.style.display = 'none';
    this.endingScreen.style.display = 'flex';
    this.continueButton.disabled = true;
    this.continueButton.textContent = '結算動畫播放中…';
    this.continueButton.onclick = () => this.continueToHub();
    this.inputManager.addEventListener('rumble-fallback', this.rumbleFallback);
    this.endingCopy.innerHTML = '<p><strong>阿財衝到店門口的舊 ATM。</strong></p><p>夜班 4 小時（時薪 NT$ 196 × 4）＝ <strong>實領 NT$ 784 元</strong></p><p>提款機正在吐出鈔票與硬幣……</p>';
    this.pulseCash(12);
    this.time.delayedCall(3500, () => this.showSnatch());
    this.time.delayedCall(7500, () => this.showDrink());
    this.time.delayedCall(11_500, () => this.showStamp());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.rumbleTimer) window.clearInterval(this.rumbleTimer);
      this.inputManager.removeEventListener('rumble-fallback', this.rumbleFallback);
      this.continueButton.onclick = null;
      this.endingScreen.style.display = 'none';
    });
  }

  private drawEndingStage(): void {
    const background = this.add.graphics();
    background.fillGradientStyle(0x15212a, 0x15212a, 0x483628, 0x1b2327, 1).fillRect(0, 0, 1280, 720);
    background.fillStyle(0x524941, 1).fillRect(0, 500, 1280, 220);
    background.lineStyle(4, 0x9a8568, 0.8).lineBetween(0, 500, 1280, 500);
    background.fillStyle(0x182128, 1).fillRoundedRect(150, 200, 285, 330, 12);
    background.lineStyle(9, 0xa8a7a0, 1).strokeRoundedRect(150, 200, 285, 330, 12);
    background.fillStyle(0x101819, 1).fillRect(192, 240, 201, 125);
    background.lineStyle(4, 0x74d29c, 1).strokeRect(192, 240, 201, 125);
    this.add.text(220, 270, 'NT$ 784', { fontFamily: 'monospace', fontSize: '31px', fontStyle: 'bold', color: '#86efb1' });
    background.fillStyle(0x838176, 1).fillRoundedRect(218, 398, 149, 40, 5);
    background.fillStyle(0x3b3330, 1).fillRoundedRect(220, 454, 144, 45, 5);
    this.add.text(222, 458, '鈔票出口', { fontFamily: 'sans-serif', fontSize: '17px', color: '#e7d4a7' });
    this.add.image(600, 443, 'player').setDisplaySize(140, 218).setDepth(2);
    this.add.text(528, 253, '許見財', { fontFamily: 'sans-serif', fontSize: '23px', color: '#f3daa1', backgroundColor: '#121a20', padding: { x: 9, y: 5 } }).setDepth(3);
    this.add.graphics().setDepth(2).fillStyle(0x191c22, 1).fillRoundedRect(866, 274, 126, 246, 18).fillStyle(0xe6bd94, 1).fillCircle(928, 254, 54).fillStyle(0x25252a, 1).fillEllipse(928, 234, 106, 39);
    const tattoo = this.add.graphics().setDepth(3);
    tattoo.lineStyle(4, 0xb93c39, 0.98).lineBetween(885, 354, 970, 430).lineBetween(900, 349, 966, 385).lineBetween(879, 394, 958, 457);
    this.add.text(851, 532, '阿豹哥', { fontFamily: 'sans-serif', fontSize: '22px', color: '#f1d6a8', backgroundColor: '#11141a', padding: { x: 10, y: 5 } }).setDepth(4);
    this.add.text(888, 286, '8+9', { fontFamily: 'sans-serif', fontSize: '17px', color: '#e0e2df', fontStyle: 'bold' }).setDepth(4);
    this.add.text(474, 105, '俗俗埋 24H 生鮮百貨・鐵捲門外', { fontFamily: 'sans-serif', fontSize: '26px', color: '#f4d791', backgroundColor: '#12171be8', padding: { x: 14, y: 8 } }).setDepth(5);
    this.add.text(556, 589, '地下街清晨 06:00', { fontFamily: 'sans-serif', fontSize: '18px', color: '#d5cfbf', backgroundColor: '#191d20cc', padding: { x: 8, y: 4 } }).setDepth(5);
  }

  private pulseCash(count: number): void {
    if (this.rumbleTimer) window.clearInterval(this.rumbleTimer);
    let sent = 0;
    this.rumbleTimer = window.setInterval(() => {
      this.inputManager.triggerRumble(...[PARAMS.HAPTICS.ATM_DISPENSE_784.duration, PARAMS.HAPTICS.ATM_DISPENSE_784.weak, PARAMS.HAPTICS.ATM_DISPENSE_784.strong]);
      this.audio.play('cash');
      this.spawnCashSprite(sent);
      sent += 1;
      if (sent >= count) { window.clearInterval(this.rumbleTimer); this.rumbleTimer = 0; }
    }, 110);
  }

  private spawnCashSprite(index: number): void {
    const note = this.add.rectangle(378, 413, 26, 12, index % 3 === 0 ? 0xa54643 : 0xd9bd79).setAngle(-18 + Math.random() * 36).setDepth(8);
    this.tweens.add({ targets: note, x: 340 + Math.random() * 130, y: 466 + Math.random() * 55, angle: note.angle + 180, duration: 420, onComplete: () => note.destroy() });
  }

  private showSnatch(): void {
    if (this.stage >= 1) return;
    this.stage = 1;
    this.audio.play('hit');
    this.inputManager.triggerRumble(...[PARAMS.HAPTICS.GANGSTER_SNATCH_700.duration, PARAMS.HAPTICS.GANGSTER_SNATCH_700.weak, PARAMS.HAPTICS.GANGSTER_SNATCH_700.strong]);
    this.cameras.main.shake(360, 0.027);
    this.endingCopy.innerHTML = '<p><strong>阿豹哥</strong>穿著黑色吊嘎、包手刺青，滿臉笑容滑步貼近，摟住阿財肩膀：「見財仔，大夜班辛苦捏！今日高利貸利息阿兄先幫你收起來喔！」</p><p>七張百元鈔票被「唰」地抽走：<strong>−NT$ 700</strong>。阿財手心只剩 <strong>NT$ 84 元銅板</strong>，當場石化。</p>';
  }

  private showDrink(): void {
    if (this.stage >= 2) return;
    this.stage = 2;
    this.audio.play('interact');
    this.inputManager.triggerRumble(80, 0.5, 0.3);
    this.endingCopy.innerHTML = '<p>阿豹哥拍拍阿財的臉，把黑底螢光綠抓痕的<strong>魔爪風提神飲料 × 1</strong>塞進他懷裡。</p><p>阿豹哥：「喝這罐補一下啦，明晚繼續打拼嘿！」</p><p>阿財盯著 84 元硬幣，想起冰箱還有半顆滷蛋。</p>';
    this.add.graphics().setDepth(10).fillRoundedRect(682, 386, 100, 142, 13).fillStyle(0x69df49, 1).fillTriangle(703, 430, 747, 400, 760, 458).fillTriangle(703, 465, 760, 440, 759, 492).fillTriangle(705, 497, 754, 477, 745, 523);
  }

  private showStamp(): void {
    if (this.finalReady) return;
    this.finalReady = true;
    this.stage = 3;
    this.audio.play('stamp');
    this.inputManager.triggerRumble(...[PARAMS.HAPTICS.FINAL_STAMP_BOOM.duration, PARAMS.HAPTICS.FINAL_STAMP_BOOM.weak, PARAMS.HAPTICS.FINAL_STAMP_BOOM.strong]);
    this.cameras.main.shake(520, 0.035);
    this.add.rectangle(640, 365, 1040, 172, 0x9f2825, 0.94).setAngle(-3).setDepth(9).setStrokeStyle(10, 0xf3d18b);
    this.add.text(640, 363, '【第一夜：都市怪談—深夜福利社\n實領 NT$ 84 元 ＋ 魔爪提神飲 × 1】', { fontFamily: 'sans-serif', fontSize: '35px', fontStyle: 'bold', color: '#fff1cf', align: 'center', stroke: '#591716', strokeThickness: 8, lineSpacing: 6 }).setOrigin(0.5).setAngle(-3).setDepth(10);
    this.tweens.add({ targets: this.children.list.slice(-2), scale: 1.05, duration: 90, yoyo: true, repeat: 2 });
    this.endingCopy.innerHTML = '<p><strong>NT$ 784 − NT$ 700 ＝ NT$ 84。</strong></p><p>你完成第 1 夜並收到一罐魔爪提神飲。存檔後可回到據點查看夜班進度。</p>';
    this.continueButton.disabled = false;
    this.continueButton.textContent = '存檔並返回據點';
  }

  private continueToHub(): void {
    if (!this.finalReady) return;
    this.save.completeNightOne();
    this.endingScreen.style.display = 'none';
    this.scene.start('BootScene');
  }

  update(): void {
    if (this.finalReady && this.inputManager.read().pressed.interact) this.continueToHub();
  }
}
