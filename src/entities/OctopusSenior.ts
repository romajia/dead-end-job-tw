export class OctopusSenior {
  public x = 2850;
  public revealed = false;
  public container: Phaser.GameObjects.Container;
  private sprite: Phaser.GameObjects.Image;
  private ink: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(this.x, 560).setDepth(16);
    this.sprite = scene.add.image(0, -55, 'octopus-senior').setDisplaySize(200, 180).setPipeline('Light2D');
    this.ink = scene.add.graphics();
    this.container.add([this.ink, this.sprite]);
  }

  public reveal(): void {
    if (this.revealed) return;
    this.revealed = true;
    this.container.setVisible(true);
    this.sceneAnimation();
  }

  private sceneAnimation(): void {
    this.container.setScale(0.7);
    this.container.alpha = 0.5;
    this.container.scene.tweens.add({ targets: this.container, scale: 1, alpha: 1, duration: 330, ease: 'Back.Out' });
    this.ink.lineStyle(13, 0x090b12, 0.95);
    for (let i = 0; i < 6; i += 1) {
      const x = -80 + i * 31;
      const bend = x + (i % 2 ? 15 : -17);
      this.ink.lineBetween(x, -4, x - 16, 18);
      this.ink.lineBetween(x - 16, 18, x + 22, 38);
      this.ink.lineBetween(x + 22, 38, bend, 64);
    }
  }

  public destroy(): void { this.container.destroy(true); }
}
