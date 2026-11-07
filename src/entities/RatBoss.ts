import { PARAMS } from '../config/GameConstants';

export type BossState = 'sleeping' | 'patrol' | 'chase' | 'telegraph' | 'stunned' | 'dead';

export interface BossTarget {
  x: number;
  hidden: boolean;
  holdingBreath: boolean;
  rolling: boolean;
  noise: number;
}

export class RatBoss {
  public x = 1860;
  public hp: number = PARAMS.RAT_BOSS.MAX_HP;
  public maxHp: number = PARAMS.RAT_BOSS.MAX_HP;
  public state: BossState = 'sleeping';
  public active = false;
  public telegraphStart = 0;
  public stunnedUntil = 0;
  public facing = -1;
  public container: Phaser.GameObjects.Container;
  private sprite: Phaser.GameObjects.Image;
  private warning: Phaser.GameObjects.Graphics;
  private onAttack: () => void;
  private lastAttack = 0;

  constructor(private scene: Phaser.Scene, onAttack: () => void) {
    this.onAttack = onAttack;
    this.container = scene.add.container(this.x, 568).setDepth(22);
    this.sprite = scene.add.image(0, -64, 'rat-boss').setDisplaySize(180, 165).setPipeline('Light2D');
    this.warning = scene.add.graphics();
    this.container.add([this.warning, this.sprite]);
    this.container.setVisible(false);
  }

  public activate(): void { this.active = true; this.state = 'chase'; this.container.setVisible(true); }

  public update(delta: number, now: number, target: BossTarget): void {
    this.warning.clear();
    if (!this.active || this.state === 'dead') return;
    if (this.hp <= 0) { this.state = 'dead'; this.container.setVisible(false); return; }
    if (now < this.stunnedUntil) {
      this.state = 'stunned';
      this.sprite.setTint(0x87ff63);
      this.sprite.rotation = Math.sin(now * 0.03) * 0.08;
      return;
    }
    this.sprite.clearTint();
    this.sprite.rotation = 0;
    if (this.state === 'stunned') this.state = 'chase';

    const distance = Math.abs(target.x - this.x);
    const canSee = !target.hidden || !target.holdingBreath;
    const noisy = target.noise > 0.35 && distance < PARAMS.RAT_BOSS.NOISE_DETECT_RADIUS;
    if (distance < PARAMS.RAT_BOSS.SIGHT_DETECT_RADIUS && canSee || noisy) this.state = 'chase';
    if (distance > PARAMS.RAT_BOSS.SIGHT_DETECT_RADIUS + 180) this.state = 'patrol';

    if (this.state === 'telegraph') {
      const elapsed = now - this.telegraphStart;
      const pulse = elapsed > PARAMS.RAT_BOSS.ATTACK_WINDUP_MS * 0.62 ? 0xff4338 : 0xffd45a;
      this.warning.fillStyle(pulse, 0.22 + Math.sin(now * 0.018) * 0.08).fillCircle(0, -65, 124);
      this.warning.lineStyle(8, pulse, 0.95).strokeCircle(0, -65, 108 + Math.sin(now * 0.012) * 8);
      if (elapsed >= PARAMS.RAT_BOSS.ATTACK_WINDUP_MS) {
        if (distance < 118 && !target.rolling && !(target.hidden && target.holdingBreath)) this.onAttack();
        this.lastAttack = now;
        this.state = 'chase';
      }
      return;
    }

    if (this.state === 'chase') {
      this.facing = target.x >= this.x ? 1 : -1;
      this.x += this.facing * Math.min(distance, (PARAMS.RAT_BOSS.CHASE_SPEED * delta) / 1000);
      this.container.x = this.x;
      this.sprite.setFlipX(this.facing < 0);
      if (distance < 96 && now - this.lastAttack > 1800) {
        this.state = 'telegraph';
        this.telegraphStart = now;
      }
    } else {
      this.x += Math.sin(now * 0.00045) * ((PARAMS.RAT_BOSS.PATROL_SPEED * delta) / 3000);
      this.container.x = this.x;
    }
    this.sprite.setScale(1 + Math.sin(now * 0.005) * 0.035, 1 - Math.sin(now * 0.005) * 0.025);
  }

  public stun(now: number, duration: number = PARAMS.RAT_BOSS.STUN_DURATION_MS): void {
    this.stunnedUntil = now + duration;
    this.state = 'stunned';
  }

  public takeHit(amount: number, now: number): void {
    this.hp = Math.max(0, this.hp - amount);
    this.stun(now);
    this.scene.tweens.add({ targets: this.container, x: this.x - this.facing * 75, duration: 160, yoyo: true, onUpdate: () => { this.x = this.container.x; } });
  }

  public destroy(): void { this.container.destroy(true); }
}
