import { CALENDAR_RULES, PARAMS, PHASE_NAMES, type LevelPhase, PROMPTS } from '../config/GameConstants';
import { Player } from '../entities/Player';
import { RatBoss } from '../entities/RatBoss';
import { OctopusSenior } from '../entities/OctopusSenior';
import { InputManager, type InputDevice, type InputSnapshot } from '../systems/InputManager';
import { AudioManager } from '../systems/AudioManager';
import { ComicCutIn } from '../systems/ComicCutIn';
import { drawPixelBackdrop } from '../systems/ProceduralAssets';

export interface HUDState {
  phase: string;
  objective: string;
  clock: string;
  hp: number;
  maxHp: number;
  oxygen: number;
  bossHp: number;
  bossMaxHp: number;
  device: InputDevice;
  prompt: string;
  hidden: boolean;
}

const SHELF_X = [980, 1450, 1900];
const BOTTLE_X = [1210, 1690];

export class Level1Scene extends Phaser.Scene {
  private inputManager!: InputManager;
  private audio!: AudioManager;
  private player!: Player;
  private boss!: RatBoss;
  private octopus!: OctopusSenior;
  private comic!: ComicCutIn;
  private flashlight!: Phaser.GameObjects.Image;
  private playerLight!: Phaser.GameObjects.Light;
  private clerk!: Phaser.GameObjects.Image;
  private darkOverlay!: Phaser.GameObjects.Rectangle;
  private reflection!: Phaser.GameObjects.Image;
  private dawnOverlay!: Phaser.GameObjects.Graphics;
  private shutter!: Phaser.GameObjects.Graphics;
  private phase: LevelPhase = 'PHASE_0_TUTORIAL';
  private tutorialStep = 0;
  private tutorialBreathMs = 0;
  private phaseElapsed = 0;
  private shiftElapsed = 0;
  private timerActive = false;
  private calendarOpen = false;
  private calendarPage: 'rules' | 'final' = 'rules';
  private octopusClue = false;
  private finalPageRead = false;
  private toyCollected = false;
  private toyFailed = false;
  private swordUnlocked = false;
  private cutInActive = false;
  private teaPause = false;
  private lastSlashAt = 0;
  private lastFootstepAt = 0;
  private breathAudioActive = false;
  private noiseLevel = 0;
  private noiseDecay = 0;
  private lastHeartbeatAt = 0;
  private lastCreepRumbleAt = 0;
  private hitStopUntil = 0;
  private rollDirection = 1;
  private rollUntil = 0;
  private potTrapReady = true;
  private marbleCount = 2;
  private usedBottlePickup = new Set<number>();
  private endingStarted = false;
  private manuallyPaused = false;
  private zoneZoom = 1.15;
  private dialogueTimer: Phaser.Time.TimerEvent | null = null;
  private postFX: { setNight: (amount: number) => void; setSunrise: (amount: number) => void } | null = null;

  constructor() { super('Level1Scene'); }

  create(): void {
    this.inputManager = this.game.registry.get('inputManager') as InputManager;
    this.audio = this.game.registry.get('audioManager') as AudioManager;
    this.postFX = this.game.registry.get('postfx') as typeof this.postFX;
    this.comic = new ComicCutIn(this);
    try { this.cameras.main.setPostPipeline('MarketPostFX'); } catch { /* The WebGL shader is optional when the renderer cannot attach custom pipelines. */ }
    this.lights.enable().setAmbientColor(0xa39d8a);
    this.cameras.main.setBounds(0, 0, PARAMS.WORLD_WIDTH, PARAMS.WORLD_HEIGHT).setZoom(1.15);
    this.physics.world.setBounds(0, 0, PARAMS.WORLD_WIDTH, PARAMS.WORLD_HEIGHT);
    this.drawMarket();
    this.createProps();

    this.player = new Player(this, 420, PARAMS.FLOOR_Y);
    this.playerLight = this.lights.addLight(420, 550, 390, 0xffe5a6, 1.25);
    this.lights.addLight(340, 320, 205, 0xffbb64, 1.05);
    this.lights.addLight(2360, 333, 150, 0xf24338, 0.9);
    this.lights.addLight(2850, 310, 250, 0x76c7e6, 1.1);
    this.boss = new RatBoss(this, () => this.onBossAttack());
    this.octopus = new OctopusSenior(this);
    this.octopus.container.setVisible(false);
    this.cameras.main.startFollow(this.player.container, true, 0.08, 0.08);
    this.flashlight = this.add.image(this.player.x, this.player.y - 70, 'flashlight-cone').setOrigin(0.04, 0.5).setDisplaySize(760, 360).setDepth(750).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.38);
    this.darkOverlay = this.add.rectangle(640, 360, 1280, 720, 0x0c0c18, 0.82).setScrollFactor(0).setDepth(700).setVisible(false);
    this.dawnOverlay = this.add.graphics().setScrollFactor(0).setDepth(760).setAlpha(0);
    this.reflection = this.add.image(this.player.x, PARAMS.FLOOR_Y + 9, 'player').setOrigin(0.5, 0).setDisplaySize(46, 72).setFlipY(true).setAlpha(0.18).setTint(0x92d7dc).setDepth(3);

    this.inputManager.addEventListener('rumble-fallback', this.onRumbleFallback as EventListener);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.inputManager.removeEventListener('rumble-fallback', this.onRumbleFallback as EventListener));
    this.game.events.emit('level-started');
    this.showDialogue('阿東仔：「喔！你就是人力銀行派來交班的見財仔喔？時薪 196 塊還要值大夜，真歹命啦！來，先教你店內規矩。」', 6500);
  }

  private drawMarket(): void {
    const far = this.add.tileSprite(PARAMS.WORLD_WIDTH / 2, 360, PARAMS.WORLD_WIDTH, 720, 'parallax-far').setDepth(-20).setScrollFactor(0.2).setPipeline('Light2D');
    const mid = this.add.tileSprite(PARAMS.WORLD_WIDTH / 2, 360, PARAMS.WORLD_WIDTH, 720, 'parallax-mid').setDepth(-10).setScrollFactor(0.6).setPipeline('Light2D');
    const front = this.add.tileSprite(PARAMS.WORLD_WIDTH / 2, 330, PARAMS.WORLD_WIDTH, 720, 'parallax-front').setDepth(60).setScrollFactor(1.25).setAlpha(0.7);
    far.setTileScale(1, 1); mid.setTileScale(1, 1); front.setTileScale(1, 1);
    drawPixelBackdrop(this);
    const lights = this.add.graphics().setDepth(6).setBlendMode(Phaser.BlendModes.ADD);
    for (const x of [340, 1020, 1640, 2360, 2850]) {
      lights.fillStyle(x === 2850 ? 0x60a9c2 : 0xffba58, 0.08).fillCircle(x, 314, 150);
      lights.fillStyle(x === 2850 ? 0x6fc4dc : 0xffd17e, 0.13).fillCircle(x, 314, 64);
    }
    const zoneLines = this.add.graphics().setDepth(3);
    zoneLines.lineStyle(2, 0xbba67a, 0.3);
    for (const boundary of [700, 2100, 2600]) zoneLines.lineBetween(boundary, 260, boundary, 620);
    const labels = [
      [80, 'A・鐵捲門／收銀台'], [790, 'B・南北雜貨貨架'], [2135, 'C・神明廳'], [2640, 'D・生鮮冷凍庫'],
    ] as const;
    for (const [x, label] of labels) this.add.text(x, 270, label, { fontFamily: 'sans-serif', fontSize: '17px', color: '#d7c7a6', backgroundColor: '#16191dcc', padding: { x: 8, y: 5 } }).setDepth(8);
    const sign = this.add.text(82, 355, '俗俗埋\n24H 生鮮百貨', { fontFamily: 'sans-serif', fontSize: '30px', fontStyle: 'bold', color: '#f3d185', align: 'center', backgroundColor: '#542b20', padding: { x: 14, y: 9 } }).setDepth(12);
    this.add.rectangle(116, 591, 156, 68, 0x1b2026).setStrokeStyle(5, 0x91816b).setDepth(13);
    this.add.text(63, 576, 'ATM', { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#8cf0ad', backgroundColor: '#101a19', padding: { x: 12, y: 4 } }).setDepth(14);
    this.add.rectangle(8, 310, 18, 310, 0x332a25).setDepth(15);
    this.add.text(270, 308, '02:00 開工', { fontFamily: 'sans-serif', fontSize: '14px', color: '#f0d88f' }).setDepth(8);
    void sign;
  }

  private createProps(): void {
    this.add.image(550, 586, 'pot').setDisplaySize(116, 94).setDepth(18).setPipeline('Light2D');
    this.add.image(420, 498, 'calendar').setDisplaySize(92, 120).setDepth(18).setPipeline('Light2D');
    this.add.text(374, 423, '撕日曆', { fontFamily: 'sans-serif', fontSize: '16px', color: '#fff1cc', backgroundColor: '#702a24', padding: { x: 6, y: 3 } }).setDepth(19);
    this.add.image(2350, 563, 'shrine').setDisplaySize(144, 120).setDepth(15).setPipeline('Light2D');
    this.add.text(2306, 480, '神明廳抽屜', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffdfa3', backgroundColor: '#5f3027', padding: { x: 6, y: 3 } }).setDepth(18);
    this.add.image(2850, 555, 'freezer').setDisplaySize(340, 208).setDepth(14).setPipeline('Light2D');
    this.add.text(2721, 419, '零下 18°C・鮮魚冷凍櫃', { fontFamily: 'sans-serif', fontSize: '15px', color: '#d8f4f3', backgroundColor: '#16313b', padding: { x: 7, y: 3 } }).setDepth(18);
    for (let i = 0; i < SHELF_X.length; i += 1) {
      const x = SHELF_X[i]!;
      this.add.image(x, 497, 'shelf').setDisplaySize(176, 256).setDepth(12 + i).setPipeline('Light2D');
      this.add.rectangle(x, 612, 192, 16, 0x171617).setDepth(11 + i);
      this.add.text(x - 54, 352, '按 [Y] 躲入貨架陰影', { fontFamily: 'sans-serif', fontSize: '12px', color: '#e3d1a6', backgroundColor: '#15171acc', padding: { x: 4, y: 3 } }).setDepth(18);
    }
    this.clerk = this.add.image(1810, 566, 'clerk').setDisplaySize(72, 112).setDepth(12).setPipeline('Light2D');
    this.add.text(1773, 471, '阿東仔學長', { fontFamily: 'sans-serif', fontSize: '13px', color: '#f1deaa', backgroundColor: '#18201dcc', padding: { x: 4, y: 3 } }).setDepth(18);
    for (const x of BOTTLE_X) {
      this.add.image(x, 590, 'marble-bottle').setDisplaySize(31, 51).setDepth(17);
      this.add.ellipse(x, 614, 42, 9, 0x91d4d9, 0.16).setDepth(3);
    }
    this.shutter = this.add.graphics().setDepth(26);
    this.shutter.fillStyle(0x343a40, 1).fillRect(10, 325, 208, 112);
    this.shutter.lineStyle(4, 0x777a75, 1);
    for (let y = 334; y < 433; y += 16) this.shutter.lineBetween(12, y, 214, y);
    this.shutter.lineStyle(5, 0xc4aa73, 1).strokeRect(8, 322, 212, 118);
    this.add.text(266, 540, '滷味鍋陷阱', { fontFamily: 'sans-serif', fontSize: '13px', color: '#fff0c5', backgroundColor: '#4e2820', padding: { x: 5, y: 3 } }).setDepth(20);
  }

  private getDevicePrompts(): typeof PROMPTS[InputDevice] { return PROMPTS[this.inputManager.getDevice()]; }

  public getHUDState(): HUDState {
    const prompts = this.getDevicePrompts();
    const clock = this.getClockLabel();
    let objective = '';
    let prompt: string = prompts.move;
    if (this.phase === 'PHASE_0_TUTORIAL') {
      const objectives = [
        '教學 1/4：照亮收銀台旁的滷味鍋。',
        '教學 2/4：走到貨架前，按躲藏鍵縮進陰影。',
        '教學 3/4：躲好後按住憋氣 1.5 秒。',
        '教學 4/4：回收銀台撕開牆上日曆。',
      ];
      objective = objectives[this.tutorialStep] ?? objectives[3]!;
      prompt = this.tutorialStep === 0 ? prompts.aim : this.tutorialStep === 1 ? `${prompts.move}　${prompts.hide}` : this.tutorialStep === 2 ? prompts.breath : `${prompts.move}　${prompts.tear}`;
    } else if (this.phase === 'PHASE_1_CALENDAR_RULES') {
      objective = '守則已記下。等到 02:30，再去店尾清點冷凍庫。'; prompt = prompts.tear;
    } else if (this.phase === 'PHASE_2_OCTOPUS_INK_WARNING') {
      objective = this.octopusClue ? '回收銀台撕開日曆封底，確認阿東仔的身分。' : '走到最右側冷凍庫，用手電筒查看冰櫃。'; prompt = this.octopusClue ? prompts.tear : prompts.aim;
    } else if (this.phase === 'PHASE_3_STEALTH_PLASTIC_TOY_FAIL') {
      objective = this.toyCollected ? '水溝歹咪仔靠近時，按互動使用公司發的鎮宅玩具。' : '躲過鼠怪，前往神明廳抽屜拿鎮宅符紙與十字架。'; prompt = this.toyCollected ? prompts.interact : `${prompts.hide}　${prompts.breath}　${prompts.interact}`;
    } else if (this.phase === 'PHASE_4_TSMC_NVIDIA_SWORD') {
      objective = '擊敗水溝歹咪仔；閃避、格擋或把牠引到滷味鍋旁。'; prompt = `${prompts.slash}　${prompts.dodge}　${prompts.interact}`;
    } else {
      objective = '鐵捲門升起，夜班結束。';
    }
    return {
      phase: PHASE_NAMES[this.phase], objective, clock, hp: this.player.hp, maxHp: PARAMS.PLAYER.MAX_HP,
      oxygen: Math.round(this.player.oxygen), bossHp: this.boss.hp, bossMaxHp: this.boss.maxHp,
      device: this.inputManager.getDevice(), prompt, hidden: this.player.isHidden,
    };
  }

  private getClockLabel(): string {
    if (!this.timerActive) return '01:55 AM';
    const minutesPassed = Math.floor((this.shiftElapsed / (PARAMS.REAL_SECONDS_PER_GAME_HOUR * 1000)) * 60);
    const minuteOfDay = (2 * 60 + minutesPassed) % (24 * 60);
    const hour24 = Math.floor(minuteOfDay / 60);
    const minute = minuteOfDay % 60;
    const hour12 = hour24 % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} AM`;
  }

  public get calendarModalOpen(): boolean { return this.calendarOpen; }
  public closeCalendarFromUI(): void { this.closeCalendar(); }

  public openCalendar(): void {
    if (this.calendarOpen) return;
    this.calendarOpen = true;
    this.calendarPage = this.octopusClue && !this.finalPageRead ? 'final' : 'rules';
    this.game.events.emit('calendar-open', { page: this.calendarPage, rules: this.calendarPage === 'final' ? [CALENDAR_RULES[2]] : CALENDAR_RULES.slice(0, 2) });
  }

  private closeCalendar(): void {
    if (!this.calendarOpen) return;
    this.calendarOpen = false;
    this.game.events.emit('calendar-close');
    if (this.phase === 'PHASE_0_TUTORIAL') {
      this.setPhase('PHASE_1_CALENDAR_RULES');
      this.timerActive = true;
      this.phaseElapsed = 0;
      this.shiftElapsed = 0;
      this.audio.play('calendar');
      this.showDialogue('阿東仔：「撕開就算正式上工囉！凌晨兩點半去店尾點魚，其他時間冰櫃有聲音也不要理。」', 5200);
      this.inputManager.triggerRumble(...[PARAMS.HAPTICS.TUTORIAL_CHECK.duration, PARAMS.HAPTICS.TUTORIAL_CHECK.weak, PARAMS.HAPTICS.TUTORIAL_CHECK.strong]);
      return;
    }
    if (this.calendarPage === 'final' && this.octopusClue && !this.finalPageRead) {
      this.finalPageRead = true;
      this.startStealthPhase();
    }
  }

  private setPhase(phase: LevelPhase): void {
    this.phase = phase;
    this.phaseElapsed = 0;
    this.game.events.emit('phase-changed', phase);
  }

  private startStealthPhase(): void {
    if (this.phase === 'PHASE_3_STEALTH_PLASTIC_TOY_FAIL') return;
    this.setPhase('PHASE_3_STEALTH_PLASTIC_TOY_FAIL');
    this.boss.activate();
    this.clerk.setVisible(false);
    this.darkOverlay.setVisible(true).setAlpha(0.62);
    this.flashlight.setAlpha(0.96);
    this.postFX?.setNight(1);
    this.lights.setAmbientColor(0x151a28);
    this.playerLight.setRadius(430).setIntensity(1.85);
    this.audio.play('warning');
    this.showDialogue('阿東仔的脖子「喀」一聲扭轉過來。停電了！阿東仔：「見財仔，被你發現囉？做恁爸的宵夜啦！吱吱吱——！」', 6500);
  }

  private revealOctopus(): void {
    if (this.octopusClue || this.cutInActive) return;
    this.octopusClue = true;
    this.octopus.reveal();
    this.audio.play('warning');
    this.cameras.main.shake(360, 0.012);
    this.inputManager.triggerRumble(...[PARAMS.HAPTICS.RAT_CREEP_NEAR.duration, PARAMS.HAPTICS.RAT_CREEP_NEAR.weak, PARAMS.HAPTICS.RAT_CREEP_NEAR.strong]);
    this.cutInActive = true;
    this.comic.show('冷凍庫裡的阿娟姊', '八根紫紅觸手拍碎冰霜，黑墨在玻璃上寫下：\n「日曆…撕到底…外口彼個阿東仔…嘸是人！！」', 0x2a8793, () => {
      this.cutInActive = false;
      this.showDialogue('阿娟姊：「日曆…撕到底…外口彼個阿東仔…嘸是人！！伊是水溝歹咪仔！」', 5600);
    });
  }

  private startToyReveal(): void {
    if (this.toyFailed || this.cutInActive) return;
    this.toyFailed = true;
    this.cutInActive = true;
    this.audio.play('snap');
    this.inputManager.triggerRumble(...[PARAMS.HAPTICS.PLASTIC_TOY_SNAP.duration, PARAMS.HAPTICS.PLASTIC_TOY_SNAP.weak, PARAMS.HAPTICS.PLASTIC_TOY_SNAP.strong]);
    this.cameras.main.shake(PARAMS.HAPTICS.PLASTIC_TOY_SNAP.duration, 0.018);
    this.comic.show('公司採購的驅魔聖物', '十字架啪嘰一聲軟掉斷成兩截。\n【Made in China 義烏小商品批發】\n兒童派對塑膠玩具・批發價 ¥0.5・無驅魔功能', 0xc63f34, () => {
      this.showDialogue('阿財：「靠北喔！連保命符紙都是塑膠玩具？！」　阿東仔：「哈哈哈！黑心慣老闆買這啥物啦！」', 3900);
      this.time.delayedCall(1450, () => this.startSwordAwakening());
    });
  }

  private startSwordAwakening(): void {
    if (this.swordUnlocked || !this.sys.isActive()) return;
    this.cutInActive = true;
    this.audio.play('slash');
    this.cameras.main.shake(360, 0.024);
    this.inputManager.triggerRumble(...[PARAMS.HAPTICS.TSMC_SWORD_AWAKEN.duration, PARAMS.HAPTICS.TSMC_SWORD_AWAKEN.weak, PARAMS.HAPTICS.TSMC_SWORD_AWAKEN.strong]);
    const sword = this.add.image(2850, 436, 'sword').setDisplaySize(260, 116).setDepth(45).setAngle(-20);
    this.tweens.add({ targets: sword, x: this.player.x + 45, y: 525, angle: 0, duration: 450, ease: 'Cubic.Out', onComplete: () => sword.destroy() });
    this.comic.show('護國神山・算力破魔神劍', '阿娟姊甩出 RTX 5090 雙風扇劍柄與台積電 2nm 晶圓刃！\n翠綠 CUDA 電弧點亮停電的市場——', 0x5b9b3e, () => {
      this.swordUnlocked = true;
      this.player.setSword(true);
      this.phaseElapsed = 0;
      this.shiftElapsed = Math.max(this.shiftElapsed, 210_000);
      this.setPhase('PHASE_4_TSMC_NVIDIA_SWORD');
      this.boss.activate();
      this.audio.startOverclockRock();
      this.postFX?.setNight(0.42);
      this.cutInActive = false;
      this.flashlight.setAlpha(0.56);
      this.showDialogue('阿娟姊：「少年仔！接刀！這是咱台灣護國神山做的啦！」', 3200);
    });
  }

  private showDialogue(message: string, duration = 4200): void {
    this.game.events.emit('dialogue', message);
    this.dialogueTimer?.remove(false);
    this.dialogueTimer = this.time.delayedCall(duration, () => this.game.events.emit('dialogue', ''));
  }

  private onBossAttack(): void {
    if (this.player.takeDamage(PARAMS.RAT_BOSS.ATTACK_DAMAGE, this.time.now)) {
      this.audio.play('hit');
      this.cameras.main.shake(130, 0.016);
      this.noiseLevel = 1;
      this.inputManager.triggerRumble(180, 0.72, 0.72);
      if (this.player.hp <= 0) this.startMercyRevive();
    }
  }

  private startMercyRevive(): void {
    if (this.teaPause) return;
    this.teaPause = true;
    this.boss.stun(this.time.now, 2200);
    this.audio.setBreathMuffle(false);
    this.audio.play('revive');
    this.inputManager.triggerRumble(...[PARAMS.HAPTICS.GOJI_TEA_REVIVE.duration, PARAMS.HAPTICS.GOJI_TEA_REVIVE.weak, PARAMS.HAPTICS.GOJI_TEA_REVIVE.strong]);
    this.showDialogue('喝口香姊的菊花枸杞茶，清肝明目繼續加班！', 2400);
    this.time.delayedCall(1800, () => {
      if (!this.player || !this.sys.isActive()) return;
      this.player.revive();
      this.boss.x = this.player.x + (this.player.x > PARAMS.WORLD_WIDTH / 2 ? -1 : 1) * 400;
      this.boss.container.x = this.boss.x;
      this.teaPause = false;
      this.cameras.main.flash(280, 225, 243, 175);
    });
  }

  private onRumbleFallback = (raw: Event): void => {
    const event = raw as CustomEvent<{ duration: number; intensity: number }>;
    const detail = event.detail;
    if (detail) this.cameras.main.shake(detail.duration, detail.intensity);
  };

  private getAim(snapshot: InputSnapshot): { angle: number; worldX: number; worldY: number } {
    if (snapshot.aimMode === 'pointer' && this.inputManager.getDevice() === 'KEYBOARD') {
      const worldPoint = this.cameras.main.getWorldPoint(snapshot.mouseX, snapshot.mouseY);
      const dx = worldPoint.x - this.player.x;
      const dy = worldPoint.y - (this.player.y - 65);
      const angle = Math.atan2(dy, dx);
      return { angle, worldX: worldPoint.x, worldY: worldPoint.y };
    }
    const vectorLength = Math.hypot(snapshot.aimX, snapshot.aimY) || 1;
    const dx = snapshot.aimX / vectorLength;
    const dy = snapshot.aimY / vectorLength;
    return { angle: Math.atan2(dy, dx), worldX: this.player.x + dx * 320, worldY: this.player.y - 65 + dy * 320 };
  }

  private near(x: number, range: number): boolean { return Math.abs(this.player.x - x) <= range; }

  private handleTutorial(snapshot: InputSnapshot, delta: number, aim: { angle: number; worldX: number; worldY: number }): void {
    if (this.tutorialStep === 0) {
      const pointsRight = Math.cos(aim.angle) > 0.68;
      if (pointsRight && this.near(550, 220)) this.tutorialStep = 1;
    } else if (this.tutorialStep === 1) {
      const shelf = SHELF_X.find((x) => this.near(x, 125));
      if (shelf !== undefined && snapshot.pressed.hide) {
        this.player.setHidden(true);
        this.tutorialStep = 2;
        this.audio.play('interact');
        this.inputManager.triggerRumble(...[PARAMS.HAPTICS.TUTORIAL_CHECK.duration, PARAMS.HAPTICS.TUTORIAL_CHECK.weak, PARAMS.HAPTICS.TUTORIAL_CHECK.strong]);
      }
    } else if (this.tutorialStep === 2) {
      if (snapshot.actions.breath && this.player.isHidden && this.player.oxygen > 0) this.tutorialBreathMs += delta;
      else this.tutorialBreathMs = 0;
      if (this.tutorialBreathMs >= 1500) {
        this.tutorialStep = 3;
        this.player.setHidden(false);
        this.audio.play('interact');
        this.inputManager.triggerRumble(...[PARAMS.HAPTICS.TUTORIAL_CHECK.duration, PARAMS.HAPTICS.TUTORIAL_CHECK.weak, PARAMS.HAPTICS.TUTORIAL_CHECK.strong]);
      }
    } else if (this.tutorialStep === 3 && this.near(420, 115) && snapshot.pressed.tear) {
      this.openCalendar();
    }
    void aim.worldX;
  }

  private handleWorldInteractions(snapshot: InputSnapshot, now: number): void {
    if (snapshot.pressed.hide) {
      if (this.player.isHidden) {
        this.player.setHidden(false);
      } else {
        const shelf = SHELF_X.find((x) => this.near(x, 125));
        if (shelf !== undefined) {
          this.player.setHidden(true);
          this.audio.play('interact');
          this.noiseLevel = 0.03;
        }
      }
    }

    if (snapshot.pressed.tear && this.near(420, 125)) {
      if (this.phase === 'PHASE_2_OCTOPUS_INK_WARNING' && this.octopusClue) this.openCalendar();
    }

    if (snapshot.pressed.interact) {
      if (this.phase === 'PHASE_3_STEALTH_PLASTIC_TOY_FAIL' && !this.toyCollected && this.near(2350, 150)) {
        this.toyCollected = true;
        this.showDialogue('阿財拿起「鎮宅符紙與驅魔十字架」。製造商：義烏小商品批發。', 3200);
        this.audio.play('interact');
        return;
      }
      if (this.toyCollected && !this.toyFailed && Math.abs(this.boss.x - this.player.x) < 330) {
        this.startToyReveal();
        return;
      }
      if (this.phase === 'PHASE_4_TSMC_NVIDIA_SWORD' && this.potTrapReady && this.near(550, 130) && Math.abs(this.boss.x - 550) < 180) {
        this.potTrapReady = false;
        this.boss.stun(now, PARAMS.RAT_BOSS.STUN_DURATION_MS);
        this.audio.play('hit');
        this.cameras.main.shake(180, 0.02);
        this.showDialogue('滾燙滷味鍋命中！鼠怪暈眩 4.2 秒。', 2200);
        this.spawnSparks(550, 500, 16);
        return;
      }
      const pickup = BOTTLE_X.findIndex((x, index) => !this.usedBottlePickup.has(index) && this.near(x, 75));
      if (pickup >= 0) {
        this.usedBottlePickup.add(pickup);
        this.marbleCount += 1;
        this.showDialogue('撿到一瓶彈珠汽水。按互動鍵可丟出去引開鼠怪。', 2500);
        this.audio.play('interact');
        return;
      }
      if (this.marbleCount > 0 && this.phase === 'PHASE_3_STEALTH_PLASTIC_TOY_FAIL') this.throwMarble();
    }
  }

  private throwMarble(): void {
    this.marbleCount -= 1;
    this.noiseLevel = 1;
    this.noiseDecay = 1500;
    const bottle = this.add.image(this.player.x, this.player.y - 48, 'marble-bottle').setDisplaySize(32, 52).setDepth(55);
    const targetX = Math.max(120, Math.min(PARAMS.WORLD_WIDTH - 100, this.boss.x + (this.boss.x > this.player.x ? 180 : -180)));
    this.tweens.add({ targets: bottle, x: targetX, y: this.player.y - 15, angle: 420, duration: 520, ease: 'Cubic.Out', onComplete: () => {
      bottle.destroy(); this.spawnSparks(targetX, 590, 8); this.audio.play('interact'); this.boss.activate();
    } });
  }

  private handleCombat(snapshot: InputSnapshot, now: number): void {
    if (!snapshot.pressed.slash || !this.swordUnlocked || now - this.lastSlashAt < 460) return;
    this.lastSlashAt = now;
    this.audio.play('slash');
    const isParry = this.boss.state === 'telegraph' && now - this.boss.telegraphStart >= PARAMS.PLAYER.PARRY_WINDOW_MS;
    this.drawSlash();
    const separation = this.boss.x - this.player.x;
    const inArc = Math.abs(separation) <= PARAMS.PLAYER.SWORD_ARC_PX && (separation === 0 || Math.sign(separation) === this.player.facing);
    if (inArc) {
      this.hitStopUntil = now + PARAMS.PLAYER.HITSTOP_MS;
      this.boss.takeHit(PARAMS.PLAYER.SWORD_DAMAGE, now);
      this.spawnSparks(this.boss.x, 500, 25);
      this.audio.play('hit');
      this.cameras.main.shake(110, 0.023);
      this.inputManager.triggerRumble(...[PARAMS.HAPTICS.CUDA_HITSTOP_SLAM.duration, PARAMS.HAPTICS.CUDA_HITSTOP_SLAM.weak, PARAMS.HAPTICS.CUDA_HITSTOP_SLAM.strong]);
    } else if (isParry) {
      this.boss.stun(now, PARAMS.RAT_BOSS.STUN_DURATION_MS);
      this.audio.play('hit');
      this.cameras.main.shake(85, 0.015);
      this.inputManager.triggerRumble(135, 0.5, 0.7);
      this.showDialogue('格擋成功！鼠怪硬直 4.2 秒。', 1800);
    }
  }

  private drawSlash(): void {
    const graphics = this.add.graphics().setDepth(41);
    const x = this.player.x + this.player.facing * 55;
    const y = this.player.y - 66;
    graphics.lineStyle(30, 0x56ff53, 0.92);
    graphics.beginPath();
    graphics.arc(x, y, 180, this.player.facing > 0 ? -0.95 : Math.PI - 0.95, this.player.facing > 0 ? 0.95 : Math.PI + 0.95, false);
    graphics.strokePath();
    graphics.lineStyle(10, 0xd9ffad, 1);
    graphics.beginPath();
    graphics.arc(x, y, 180, this.player.facing > 0 ? -0.83 : Math.PI - 0.83, this.player.facing > 0 ? 0.83 : Math.PI + 0.83, false);
    graphics.strokePath();
    this.tweens.add({ targets: graphics, alpha: 0, scaleX: 1.18, scaleY: 1.18, duration: 190, onComplete: () => graphics.destroy() });
  }

  private spawnSparks(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i += 1) {
      const spark = this.add.image(x, y, 'spark').setDepth(50).setScale(0.45 + Math.random() * 0.8).setAngle(Math.random() * 360);
      const angle = Math.random() * Math.PI * 2;
      const distance = 35 + Math.random() * 145;
      this.tweens.add({ targets: spark, x: x + Math.cos(angle) * distance, y: y + Math.sin(angle) * distance, alpha: 0, scale: 0.08, duration: 260 + Math.random() * 300, onComplete: () => spark.destroy() });
    }
  }

  private updateTutorialAndPhase(delta: number): void {
    if (this.phase === 'PHASE_0_TUTORIAL') return;
    if (this.timerActive && !this.calendarOpen && !this.cutInActive && !this.teaPause) {
      this.shiftElapsed += delta;
      this.phaseElapsed += delta;
    }
    if (this.phase === 'PHASE_1_CALENDAR_RULES' && this.shiftElapsed >= 35_000) {
      this.setPhase('PHASE_2_OCTOPUS_INK_WARNING');
      this.showDialogue('電子鐘跳到 02:30 AM。阿東仔：「店尾冷凍庫點貨，快去快回嘿。」', 4000);
    }
    if (this.phase === 'PHASE_4_TSMC_NVIDIA_SWORD' && this.shiftElapsed >= 280_000) this.finishShift();
  }

  private updateCameraZone(): void {
    const x = this.player.x;
    const target = x < 700 ? 1.15 : x < 2100 ? 1 : x < 2600 ? 1.1 : 1.25;
    if (target !== this.zoneZoom) { this.zoneZoom = target; this.cameras.main.setZoom(target); }
  }

  private updateLighting(aimAngle: number): void {
    this.flashlight.setPosition(this.player.x + Math.cos(aimAngle) * 20, this.player.y - 66 + Math.sin(aimAngle) * 20);
    this.playerLight.setPosition(this.player.x + Math.cos(aimAngle) * 135, this.player.y - 66 + Math.sin(aimAngle) * 135);
    this.flashlight.setRotation(aimAngle);
    this.darkOverlay.setPosition(640, 360);
    this.reflection.setPosition(this.player.x, PARAMS.FLOOR_Y + 8).setFlipX(this.player.facing < 0).setAlpha(this.player.isHidden ? 0.08 : 0.18);
    if (this.phase === 'PHASE_5_SUNRISE_AND_ENDING') {
      this.postFX?.setSunrise(1);
      this.dawnOverlay.clear();
      this.dawnOverlay.fillGradientStyle(0xf6d789, 0xf6d789, 0xf7dfb0, 0xfff5d1, 0.28).fillRect(0, 0, 1280, 720);
    }
  }

  private handleTutorialActions(snapshot: InputSnapshot, delta: number, aim: { angle: number; worldX: number; worldY: number }): void {
    if (this.phase === 'PHASE_0_TUTORIAL') this.handleTutorial(snapshot, delta, aim);
  }

  update(_time: number, rawDelta: number): void {
    if (!this.player || this.endingStarted) return;
    const delta = Math.min(rawDelta, 60);
    const snapshot = this.inputManager.read();
    const now = this.time.now;
    if (snapshot.pressed.start && !this.calendarOpen && !this.cutInActive && !this.teaPause) {
      this.manuallyPaused = !this.manuallyPaused;
      this.showDialogue(this.manuallyPaused ? '夜班暫停。按 [Start / Esc] 繼續。' : '繼續上工，時薪還在算。', 2600);
    }
    if (snapshot.pressed.select && !this.calendarOpen && this.phase !== 'PHASE_0_TUTORIAL' && this.near(420, 125)) this.openCalendar();
    if (this.manuallyPaused) return;
    const aim = this.getAim(snapshot);
    const holdingBreath = snapshot.actions.breath && this.player.isHidden && this.player.oxygen > 0;
    if (holdingBreath !== this.breathAudioActive) { this.breathAudioActive = holdingBreath; this.audio.setBreathMuffle(holdingBreath); }
    if (holdingBreath && now - this.lastHeartbeatAt > 1120) {
      this.lastHeartbeatAt = now;
      this.inputManager.triggerRumble(...[PARAMS.HAPTICS.HEARTBEAT_SUB.duration, PARAMS.HAPTICS.HEARTBEAT_SUB.weak, PARAMS.HAPTICS.HEARTBEAT_SUB.strong]);
    }
    this.player.update(delta, now, holdingBreath);
    this.handleTutorialActions(snapshot, delta, aim);
    if (this.phase !== 'PHASE_0_TUTORIAL' && !this.calendarOpen && !this.cutInActive && !this.teaPause && now >= this.hitStopUntil) {
      this.updateMovement(snapshot, delta, now);
      this.handleWorldInteractions(snapshot, now);
      this.handleCombat(snapshot, now);
      this.updateBoss(delta, now, snapshot);
      if (this.phase === 'PHASE_3_STEALTH_PLASTIC_TOY_FAIL' && this.boss.active && Math.abs(this.boss.x - this.player.x) < 430 && now - this.lastCreepRumbleAt > 1500) {
        this.lastCreepRumbleAt = now;
        this.inputManager.triggerRumble(...[PARAMS.HAPTICS.RAT_CREEP_NEAR.duration, PARAMS.HAPTICS.RAT_CREEP_NEAR.weak, PARAMS.HAPTICS.RAT_CREEP_NEAR.strong]);
      }
      this.updateNoise(delta);
    }
    if (this.phase === 'PHASE_0_TUTORIAL' && !this.calendarOpen && !this.cutInActive && !this.teaPause) {
      this.updateMovement(snapshot, delta, now);
      this.handleWorldInteractions(snapshot, now);
    }
    if (!this.cutInActive && this.octopusClue === false && this.phase === 'PHASE_2_OCTOPUS_INK_WARNING' && this.near(2850, 175)) {
      const flashlightHitsFreezer = Math.cos(aim.angle) > 0.35 && Math.abs(aim.worldX - 2850) < 440;
      if (flashlightHitsFreezer) this.revealOctopus();
    }
    if (this.phase === 'PHASE_2_OCTOPUS_INK_WARNING' && this.octopusClue && this.near(420, 125) && snapshot.pressed.tear) this.openCalendar();
    this.updateTutorialAndPhase(delta);
    this.updateCameraZone();
    this.updateLighting(aim.angle);
    if (this.noiseDecay > 0) this.noiseDecay = Math.max(0, this.noiseDecay - delta);
    if (this.boss.hp <= 0 && this.phase === 'PHASE_4_TSMC_NVIDIA_SWORD') this.finishShift();
  }

  private updateMovement(snapshot: InputSnapshot, delta: number, now: number): void {
    if (this.calendarOpen || this.cutInActive || this.teaPause) return;
    const movingX = snapshot.moveX;
    if (movingX !== 0) this.player.setFacing(movingX);
    if (snapshot.pressed.dodge && !this.player.isRolling) {
      this.rollDirection = movingX !== 0 ? Math.sign(movingX) : this.player.facing;
      this.player.startRoll(now);
      this.rollUntil = now + PARAMS.PLAYER.ROLL_DURATION_MS;
      this.audio.play('dodge');
      this.noiseLevel = Math.max(this.noiseLevel, 0.65);
      this.noiseDecay = 520;
    }
    let speed: number = this.player.isHidden ? PARAMS.PLAYER.WALK_SPEED : PARAMS.PLAYER.RUN_SPEED;
    if (now < this.rollUntil) speed = PARAMS.PLAYER.ROLL_SPEED;
    const dx = this.player.isRolling ? this.rollDirection : movingX;
    const nextX = Math.max(38, Math.min(PARAMS.WORLD_WIDTH - 38, this.player.x + dx * speed * (delta / 1000)));
    if (nextX !== this.player.x) {
      this.player.setPosition(nextX);
      if (now - this.lastFootstepAt > 260) {
        this.lastFootstepAt = now;
        this.audio.play('step');
      }
      this.noiseLevel = Math.max(this.noiseLevel, this.player.isHidden && holdingBreathOrQuiet(snapshot) ? 0.02 : 0.18);
      this.noiseDecay = 300;
    }
    this.player.setPosition(this.player.x, PARAMS.FLOOR_Y);
  }

  private updateBoss(delta: number, now: number, snapshot: InputSnapshot): void {
    const target = { x: this.player.x, hidden: this.player.isHidden, holdingBreath: snapshot.actions.breath && this.player.oxygen > 0, rolling: this.player.isRolling || now < this.player.invulnerableUntil, noise: this.noiseDecay > 0 ? this.noiseLevel : 0 };
    this.boss.update(delta, now, target);
  }

  private updateNoise(delta: number): void {
    if (this.noiseDecay <= 0) this.noiseLevel = Math.max(0, this.noiseLevel - delta / 500);
  }

  private finishShift(): void {
    if (this.endingStarted) return;
    this.endingStarted = true;
    this.setPhase('PHASE_5_SUNRISE_AND_ENDING');
    this.timerActive = false;
    this.audio.stopOverclockRock();
    this.postFX?.setNight(0);
    this.postFX?.setSunrise(1);
    this.lights.setAmbientColor(0xffdfa1);
    this.playerLight.setRadius(650).setIntensity(2.2).setColor(0xffd67b);
    this.dawnOverlay.setAlpha(1);
    this.dawnOverlay.clear();
    this.dawnOverlay.fillGradientStyle(0xffe9b3, 0xffe9b3, 0xffd287, 0xfff1c7, 0.35).fillRect(0, 0, 1280, 720);
    for (let i = 0; i < 13; i += 1) {
      const startX = 380 + i * 48;
      this.dawnOverlay.lineStyle(5 + (i % 3), 0xffebad, 0.11 + (i % 2) * 0.05).lineBetween(startX, 0, startX + (i - 6) * 36, 720);
    }
    this.cameras.main.flash(900, 247, 214, 131);
    this.cameras.main.shake(650, 0.024);
    if (this.boss.container.active) {
      this.spawnSparks(this.boss.x, 500, 40);
      this.tweens.add({ targets: this.boss.container, alpha: 0, scale: 1.25, duration: 850 });
    }
    if (this.shutter?.active) this.tweens.add({ targets: this.shutter, y: -120, alpha: 0.15, duration: 950, ease: 'Cubic.Out' });
    this.scene.stop('UIOverlayScene');
    this.time.delayedCall(1100, () => { if (this.sys.isActive()) this.scene.start('DaveEndingScene'); });
  }

  shutdown(): void {
    this.audio.setBreathMuffle(false);
  }
}

function holdingBreathOrQuiet(snapshot: InputSnapshot): boolean { return snapshot.actions.breath; }
