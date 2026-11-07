import { PARAMS } from '../config/GameConstants';

export class Player {
  public x: number;
  public y: number;
  public hp: number = PARAMS.PLAYER.MAX_HP;
  public oxygen: number = PARAMS.PLAYER.MAX_OXYGEN;
  public isHidden = false;
  public isRolling = false;
  public hasSword = false;
  public alive = true;
  public facing = 1;
  public invulnerableUntil = 0;
  public lastDamageAt = 0;
  public container: Phaser.GameObjects.Container;
  private sprite: Phaser.GameObjects.Image;
  private sword: Phaser.GameObjects.Image;
  private breathTime = 0;

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.x = x;
    this.y = y;
    this.container = scene.add.container(x, y).setDepth(20);
    this.sprite = scene.add.image(0, -52, 'player').setOrigin(0.5, 0.5).setDisplaySize(72, 112).setPipeline('Light2D');
    this.sword = scene.add.image(18, -50, 'sword').setOrigin(0.08, 0.5).setDisplaySize(190, 86).setVisible(false);
    this.container.add([this.sprite, this.sword]);
  }

  public setPosition(x: number, y = this.y): void {
    this.x = x;
    this.y = y;
    this.container.setPosition(x, y);
  }

  public setFacing(direction: number): void {
    if (direction === 0) return;
    this.facing = direction > 0 ? 1 : -1;
    this.container.setScale(this.facing, 1);
  }

  public setHidden(hidden: boolean): void {
    this.isHidden = hidden;
    this.sprite.setAlpha(hidden ? 0.42 : 1);
    this.container.setDepth(hidden ? 9 : 20);
  }

  public setSword(equipped: boolean): void {
    this.hasSword = equipped;
    this.sword.setVisible(equipped);
  }

  public update(delta: number, now: number, holdingBreath: boolean): void {
    this.breathTime += delta;
    const pulse = Math.sin(this.breathTime * 0.004) * 0.025;
    this.sprite.setScale(1 - pulse * 0.55, 1 + pulse);
    if (holdingBreath && this.isHidden) this.oxygen = Math.max(0, this.oxygen - (PARAMS.PLAYER.OXYGEN_DRAIN_PER_SEC * delta) / 1000);
    else this.oxygen = Math.min(PARAMS.PLAYER.MAX_OXYGEN, this.oxygen + (PARAMS.PLAYER.OXYGEN_REGEN_PER_SEC * delta) / 1000);
    if (this.isRolling && now >= this.invulnerableUntil) this.isRolling = false;
    if (now >= this.invulnerableUntil && !this.alive) this.alive = true;
  }

  public startRoll(now: number): void {
    this.isRolling = true;
    this.invulnerableUntil = now + PARAMS.PLAYER.ROLL_INVULNERABLE_MS;
    this.container.setAlpha(0.55);
    this.scene.time.delayedCall(PARAMS.PLAYER.ROLL_DURATION_MS, () => { if (this.container.active) this.container.setAlpha(this.isHidden ? 0.42 : 1); });
  }

  public takeDamage(amount: number, now: number): boolean {
    if (now < this.invulnerableUntil || now - this.lastDamageAt < 420) return false;
    this.lastDamageAt = now;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableUntil = now + 500;
    this.scene.tweens.add({ targets: this.container, alpha: 0.36, yoyo: true, repeat: 2, duration: 55 });
    return true;
  }

  public revive(): void {
    this.hp = PARAMS.PLAYER.MAX_HP;
    this.oxygen = PARAMS.PLAYER.MAX_OXYGEN;
    this.alive = true;
    this.isRolling = false;
    this.setHidden(false);
  }

  public destroy(): void { this.container.destroy(true); }
}
