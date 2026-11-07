export class ComicCutIn {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) { this.scene = scene; }

  public show(title: string, body: string, accent: number, onComplete: () => void): void {
    const scene = this.scene;
    const width = 1280;
    const height = 720;
    const container = scene.add.container(0, 0).setDepth(4000).setScrollFactor(0);
    const dim = scene.add.rectangle(width / 2, height / 2, width, height, 0x05060b, 0.88);
    const panel = scene.add.graphics();
    panel.fillStyle(accent, 1);
    panel.fillPoints([{ x: -120, y: 205 }, { x: 1120, y: 80 }, { x: 1420, y: 500 }, { x: 150, y: 630 }], true);
    panel.lineStyle(12, 0xfff0c9, 1);
    panel.strokePoints([{ x: -120, y: 205 }, { x: 1120, y: 80 }, { x: 1420, y: 500 }, { x: 150, y: 630 }], true);
    const speedLines = scene.add.graphics();
    speedLines.lineStyle(4, 0xfaf3dc, 0.58);
    for (let i = 0; i < 15; i += 1) speedLines.lineBetween(60 + i * 88, 60, 30 + i * 88, 175);
    const badge = scene.add.rectangle(180, 262, 116, 116, 0x17171a).setStrokeStyle(6, 0xf8e5b8);
    const accentMark = scene.add.text(180, 257, '!!', { fontFamily: 'sans-serif', fontSize: '68px', fontStyle: 'bold', color: '#ffffff', stroke: '#101018', strokeThickness: 8 }).setOrigin(0.5);
    const headline = scene.add.text(310, 222, title, { fontFamily: 'sans-serif', fontSize: '38px', fontStyle: 'bold', color: '#fff5d9', stroke: '#251419', strokeThickness: 7, wordWrap: { width: 840 } });
    const copy = scene.add.text(310, 322, body, { fontFamily: 'sans-serif', fontSize: '25px', color: '#fff8e8', stroke: '#18131a', strokeThickness: 5, lineSpacing: 8, wordWrap: { width: 840 } });
    const hint = scene.add.text(1110, 620, '按任意鍵繼續', { fontFamily: 'sans-serif', fontSize: '16px', color: '#fff0c9', backgroundColor: '#17171dcc', padding: { x: 12, y: 7 } }).setOrigin(1, 0.5);
    container.add([dim, panel, speedLines, badge, accentMark, headline, copy, hint]);
    container.setAlpha(0).setScale(0.94, 1.08);
    scene.tweens.add({ targets: container, alpha: 1, scaleX: 1, scaleY: 1, duration: 260, ease: 'Back.Out' });
    let completed = false;
    const finish = (): void => {
      if (completed) return;
      completed = true;
      scene.tweens.add({ targets: container, alpha: 0, duration: 220, onComplete: () => { container.destroy(true); onComplete(); } });
    };
    scene.time.delayedCall(2450, finish);
    const finishOnInput = (event: KeyboardEvent): void => {
      if (event.code === 'Space' || event.code === 'Enter' || event.code.startsWith('Gamepad')) finish();
    };
    window.addEventListener('keydown', finishOnInput, { once: true });
    scene.input.once('pointerdown', finish);
  }
}
