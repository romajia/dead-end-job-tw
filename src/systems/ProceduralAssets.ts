function canvasTexture(scene: Phaser.Scene, key: string, width: number, height: number, draw: (context: CanvasRenderingContext2D) => void): void {
  const texture = scene.textures.createCanvas(key, width, height);
  if (!texture) throw new Error(`Unable to allocate procedural texture: ${key}`);
  const context = texture.getContext();
  context.imageSmoothingEnabled = false;
  draw(context);
  texture.refresh();
}

function attachNormalMap(scene: Phaser.Scene, key: string): void {
  const texture = scene.textures.get(key);
  const source = texture.getSourceImage() as HTMLCanvasElement;
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = source.width;
  normalCanvas.height = source.height;
  const context = normalCanvas.getContext('2d');
  if (!context) throw new Error(`Unable to create normal map for ${key}`);
  context.imageSmoothingEnabled = false;
  context.fillStyle = 'rgb(128,128,255)';
  context.fillRect(0, 0, normalCanvas.width, normalCanvas.height);
  context.strokeStyle = 'rgb(137,119,250)';
  context.lineWidth = Math.max(2, Math.floor(Math.min(normalCanvas.width, normalCanvas.height) / 42));
  const step = Math.max(12, Math.floor(normalCanvas.width / 8));
  for (let x = step; x < normalCanvas.width; x += step) {
    context.beginPath(); context.moveTo(x, 0); context.lineTo(x - step / 3, normalCanvas.height); context.stroke();
  }
  context.strokeStyle = 'rgb(118,137,250)';
  for (let y = step; y < normalCanvas.height; y += step) {
    context.beginPath(); context.moveTo(0, y); context.lineTo(normalCanvas.width, y + step / 5); context.stroke();
  }
  texture.setDataSource(normalCanvas);
}

function rect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string): void {
  context.fillStyle = color;
  context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
}

export function generateProceduralAssets(scene: Phaser.Scene): void {
  canvasTexture(scene, 'player', 72, 112, (ctx) => {
    rect(ctx, 21, 8, 30, 28, '#d7a878'); rect(ctx, 20, 5, 32, 10, '#24212b'); rect(ctx, 18, 14, 7, 12, '#24212b');
    rect(ctx, 25, 19, 4, 4, '#19161b'); rect(ctx, 44, 19, 4, 4, '#19161b'); rect(ctx, 30, 29, 14, 4, '#633b31');
    rect(ctx, 18, 38, 36, 38, '#306c57'); rect(ctx, 13, 42, 7, 31, '#d7a878'); rect(ctx, 52, 42, 7, 31, '#d7a878');
    rect(ctx, 25, 39, 22, 7, '#edc56e'); rect(ctx, 23, 76, 11, 27, '#32384c'); rect(ctx, 38, 76, 11, 27, '#32384c');
    rect(ctx, 19, 102, 17, 7, '#201e24'); rect(ctx, 37, 102, 18, 7, '#201e24');
    rect(ctx, 54, 49, 12, 4, '#fff1b3'); rect(ctx, 64, 46, 4, 10, '#a3d2dd');
  });

  canvasTexture(scene, 'clerk', 72, 112, (ctx) => {
    rect(ctx, 21, 8, 30, 28, '#e3b891'); rect(ctx, 20, 5, 32, 10, '#231b20'); rect(ctx, 18, 14, 7, 12, '#231b20');
    rect(ctx, 25, 18, 4, 4, '#171519'); rect(ctx, 44, 18, 4, 4, '#171519'); rect(ctx, 30, 29, 15, 4, '#7a302b');
    rect(ctx, 18, 38, 36, 39, '#d5d1b4'); rect(ctx, 22, 44, 28, 8, '#45706a'); rect(ctx, 14, 42, 7, 31, '#e3b891'); rect(ctx, 52, 42, 7, 31, '#e3b891');
    rect(ctx, 25, 77, 11, 26, '#42352f'); rect(ctx, 38, 77, 11, 26, '#42352f'); rect(ctx, 19, 102, 17, 7, '#211e21'); rect(ctx, 37, 102, 18, 7, '#211e21');
    rect(ctx, 35, 56, 4, 4, '#a84234'); rect(ctx, 34, 64, 5, 7, '#1a1d21');
  });

  canvasTexture(scene, 'rat-boss', 192, 176, (ctx) => {
    ctx.fillStyle = '#17161b'; ctx.beginPath(); ctx.ellipse(90, 112, 76, 50, -0.08, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#29232b'; ctx.beginPath(); ctx.ellipse(132, 80, 51, 44, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7b5661'; ctx.beginPath(); ctx.ellipse(110, 39, 23, 29, -0.25, 0, Math.PI * 2); ctx.ellipse(159, 42, 22, 30, 0.22, 0, Math.PI * 2); ctx.fill();
    rect(ctx, 104, 18, 12, 17, '#c28491'); rect(ctx, 153, 20, 12, 17, '#c28491');
    ctx.fillStyle = '#ff5048'; ctx.shadowColor = '#ff3322'; ctx.shadowBlur = 17; ctx.fillRect(121, 73, 10, 7); ctx.fillRect(151, 73, 10, 7); ctx.shadowBlur = 0;
    ctx.fillStyle = '#d6c4ae'; ctx.beginPath(); ctx.moveTo(138, 98); ctx.lineTo(127, 118); ctx.lineTo(150, 118); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#794858'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(32, 115); ctx.bezierCurveTo(6, 124, 11, 154, 1, 164); ctx.stroke();
    for (let i = 0; i < 9; i += 1) { const x = 31 + (i % 3) * 22; const y = 117 + Math.floor(i / 3) * 15; ctx.fillStyle = i % 2 ? '#bfc2a9' : '#82717d'; ctx.beginPath(); ctx.arc(x, y, 11, 0, Math.PI * 2); ctx.fill(); }
    rect(ctx, 60, 146, 24, 10, '#34222b'); rect(ctx, 103, 145, 27, 10, '#34222b');
  });

  canvasTexture(scene, 'octopus-senior', 200, 180, (ctx) => {
    rect(ctx, 74, 9, 54, 65, '#f1d4bc'); rect(ctx, 68, 5, 66, 17, '#251e26');
    rect(ctx, 82, 34, 8, 6, '#251b1c'); rect(ctx, 111, 34, 8, 6, '#251b1c'); rect(ctx, 95, 52, 17, 4, '#8f4752');
    rect(ctx, 65, 73, 75, 40, '#306c57'); rect(ctx, 69, 82, 70, 7, '#d9ac64');
    ctx.strokeStyle = '#973d68'; ctx.lineWidth = 12; ctx.lineCap = 'round';
    for (let i = 0; i < 8; i += 1) {
      const startX = 76 + i * 8; const endX = 15 + (i % 4) * 54; const endY = 135 + Math.floor(i / 4) * 22;
      ctx.beginPath(); ctx.moveTo(startX, 106); ctx.bezierCurveTo(startX - 20, 128, endX + 18, endY - 10, endX, endY); ctx.stroke();
      ctx.fillStyle = '#efb9c9'; for (let dot = 0; dot < 3; dot += 1) ctx.beginPath(), ctx.arc(endX + 8 + dot * 5, endY - 4, 2.5, 0, Math.PI * 2), ctx.fill();
    }
    ctx.fillStyle = '#8bddf1'; ctx.fillRect(3, 31, 194, 5); ctx.fillRect(3, 132, 194, 4);
  });

  canvasTexture(scene, 'shelf', 220, 320, (ctx) => {
    rect(ctx, 15, 18, 190, 278, '#493329'); rect(ctx, 25, 30, 170, 12, '#8f6b49'); rect(ctx, 25, 105, 170, 12, '#8f6b49'); rect(ctx, 25, 182, 170, 12, '#8f6b49'); rect(ctx, 25, 258, 170, 12, '#8f6b49');
    rect(ctx, 18, 14, 12, 286, '#b38458'); rect(ctx, 190, 14, 12, 286, '#b38458');
    const colors = ['#bd7655', '#89a36e', '#cfad67', '#69868b', '#9a665b'];
    for (let row = 0; row < 3; row += 1) for (let col = 0; col < 5; col += 1) { const x = 34 + col * 31; const y = 58 + row * 76; rect(ctx, x, y, 22, 42 + ((row + col) % 2) * 7, colors[(row * 2 + col) % colors.length]!); rect(ctx, x + 3, y + 5, 15, 4, '#f0d5a4'); }
    rect(ctx, 0, 298, 220, 22, '#201c1b');
  });

  canvasTexture(scene, 'freezer', 340, 208, (ctx) => {
    rect(ctx, 7, 52, 326, 136, '#667d83'); rect(ctx, 15, 61, 310, 112, '#a8d5d8'); rect(ctx, 23, 70, 294, 97, '#17313b');
    const ice = ctx.createLinearGradient(20, 50, 320, 190); ice.addColorStop(0, '#d4f4edaa'); ice.addColorStop(0.5, '#9bd9e188'); ice.addColorStop(1, '#effaf2aa'); ctx.fillStyle = ice; ctx.fillRect(18, 60, 304, 112);
    ctx.strokeStyle = '#d3fbf6'; ctx.lineWidth = 4; ctx.strokeRect(13, 56, 314, 120);
    for (let i = 0; i < 11; i += 1) { ctx.fillStyle = i % 2 ? '#d9ffff88' : '#b9f7ff55'; ctx.beginPath(); ctx.ellipse(45 + i * 24, 91 + (i % 3) * 18, 14, 5, -0.3, 0, Math.PI * 2); ctx.fill(); }
    rect(ctx, 10, 185, 320, 13, '#252b31'); rect(ctx, 18, 50, 304, 9, '#c6ebee');
  });

  canvasTexture(scene, 'calendar', 116, 150, (ctx) => {
    rect(ctx, 8, 8, 100, 134, '#c9493c'); rect(ctx, 16, 15, 84, 116, '#f2dfb5'); rect(ctx, 25, 25, 66, 24, '#b23b30');
    ctx.fillStyle = '#fff0cf'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('農民曆', 58, 42);
    for (let i = 0; i < 5; i += 1) { rect(ctx, 24, 58 + i * 13, 66, 2, '#b88660'); for (let j = 0; j < 5; j += 1) if ((i + j) % 2 === 0) rect(ctx, 27 + j * 12, 62 + i * 13, 4, 4, '#a64134'); }
    rect(ctx, 52, 1, 12, 9, '#f8d99a');
  });

  canvasTexture(scene, 'shrine', 144, 120, (ctx) => {
    rect(ctx, 8, 25, 128, 82, '#5c3024'); rect(ctx, 16, 16, 112, 17, '#b65c35'); rect(ctx, 21, 38, 102, 58, '#271b1c');
    rect(ctx, 54, 42, 36, 42, '#9e5830'); rect(ctx, 59, 48, 26, 32, '#f1cd77');
    ctx.fillStyle = '#e6ad4e'; ctx.beginPath(); ctx.arc(72, 60, 11, 0, Math.PI * 2); ctx.fill(); rect(ctx, 70, 60, 4, 16, '#943928');
    rect(ctx, 0, 105, 144, 12, '#332421');
  });

  canvasTexture(scene, 'pot', 116, 94, (ctx) => {
    rect(ctx, 10, 31, 96, 49, '#46302a'); rect(ctx, 5, 26, 106, 12, '#a56443'); rect(ctx, 18, 37, 80, 33, '#a8422b');
    ctx.fillStyle = '#e09b4d'; ctx.beginPath(); ctx.ellipse(58, 34, 40, 8, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 4; i += 1) { ctx.fillStyle = '#f4d187'; ctx.beginPath(); ctx.arc(37 + i * 14, 31, 4, 0, Math.PI * 2); ctx.fill(); }
    rect(ctx, 14, 78, 22, 7, '#291e1c'); rect(ctx, 83, 78, 22, 7, '#291e1c');
  });

  canvasTexture(scene, 'sword', 290, 130, (ctx) => {
    ctx.shadowColor = '#78ff4b'; ctx.shadowBlur = 20; ctx.fillStyle = '#a4ff54';
    ctx.beginPath(); ctx.moveTo(14, 68); ctx.lineTo(221, 47); ctx.lineTo(281, 63); ctx.lineTo(222, 80); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#e3f9b0'; ctx.beginPath(); ctx.moveTo(34, 66); ctx.lineTo(219, 54); ctx.lineTo(250, 63); ctx.lineTo(218, 72); ctx.closePath(); ctx.fill();
    rect(ctx, 8, 57, 56, 18, '#303946'); rect(ctx, 4, 53, 14, 26, '#b7c5c8');
    ctx.fillStyle = '#10161e'; ctx.beginPath(); ctx.arc(27, 66, 12, 0, Math.PI * 2); ctx.arc(47, 66, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6cdf73'; ctx.beginPath(); ctx.arc(27, 66, 6, 0, Math.PI * 2); ctx.arc(47, 66, 6, 0, Math.PI * 2); ctx.fill();
    rect(ctx, 0, 58, 42, 16, '#d7a554');
  });

  canvasTexture(scene, 'marble-bottle', 44, 72, (ctx) => {
    rect(ctx, 16, 4, 12, 10, '#e8d8a1'); rect(ctx, 10, 14, 24, 47, '#58aabc'); rect(ctx, 13, 19, 18, 34, '#b7eff0'); rect(ctx, 17, 18, 8, 4, '#f5e7bd'); rect(ctx, 18, 60, 8, 8, '#3d7484');
  });

  canvasTexture(scene, 'flashlight-cone', 760, 360, (ctx) => {
    const gradient = ctx.createLinearGradient(0, 180, 740, 180);
    gradient.addColorStop(0, 'rgba(255,241,181,.25)'); gradient.addColorStop(.28, 'rgba(255,235,165,.17)'); gradient.addColorStop(1, 'rgba(255,226,120,0)');
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.moveTo(0, 180); ctx.lineTo(760, 8); ctx.lineTo(760, 352); ctx.closePath(); ctx.fill();
    const glow = ctx.createRadialGradient(35, 180, 8, 60, 180, 140); glow.addColorStop(0, 'rgba(255,255,210,.5)'); glow.addColorStop(1, 'rgba(255,255,180,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, 200, 360);
  });

  canvasTexture(scene, 'parallax-far', 1280, 720, (ctx) => {
    rect(ctx, 0, 0, 1280, 720, '#15191f'); rect(ctx, 0, 86, 1280, 46, '#34353a'); rect(ctx, 0, 137, 1280, 12, '#77706a');
    for (let i = 0; i < 8; i += 1) { const x = 40 + i * 170; rect(ctx, x, 40, 100, 9, '#6a7074'); rect(ctx, x + 20, 46, 8, 54, '#53575a'); }
    for (let i = 0; i < 5; i += 1) { const x = 130 + i * 275; ctx.fillStyle = '#d9573d'; ctx.shadowColor = '#ff4d33'; ctx.shadowBlur = 20; ctx.fillRect(x, 175, 24, 50); ctx.shadowBlur = 0; rect(ctx, x - 8, 168, 40, 8, '#69433a'); }
    rect(ctx, 0, 560, 1280, 160, '#282b30');
  });

  canvasTexture(scene, 'parallax-mid', 1280, 720, (ctx) => {
    rect(ctx, 0, 0, 1280, 720, '#1b2024');
    for (let i = 0; i < 13; i += 1) {
      const x = i * 105; const height = 120 + (i % 4) * 30; const y = 600 - height;
      rect(ctx, x + 4, y, 94, height, i % 2 ? '#40352e' : '#584431'); rect(ctx, x + 11, y + 12, 78, 5, '#b48752');
      for (let n = 0; n < 3; n += 1) rect(ctx, x + 15 + n * 23, y + 29 + (n % 2) * 23, 18, 24, ['#b07c59', '#798c63', '#a5945e'][n]!);
    }
    rect(ctx, 0, 600, 1280, 120, '#2e2d2d');
  });

  canvasTexture(scene, 'parallax-front', 1280, 720, (ctx) => {
    ctx.strokeStyle = '#b74b3b'; ctx.lineWidth = 5;
    for (let i = 0; i < 12; i += 1) { const x = i * 117 + 36; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 12, 80 + (i % 4) * 32); ctx.stroke(); rect(ctx, x + 6, 78 + (i % 4) * 32, 62, 20, '#dfc47d'); ctx.fillStyle = '#644a36'; ctx.font = '9px sans-serif'; ctx.fillText('俗俗埋特價', x + 9, 92 + (i % 4) * 32); }
  });

  canvasTexture(scene, 'floor-normal', 256, 256, (ctx) => {
    rect(ctx, 0, 0, 256, 256, 'rgb(128,128,255)');
    for (let i = 0; i < 24; i += 1) { const x = (i * 71) % 256; const y = (i * 109) % 256; rect(ctx, x, y, 20 + i % 9, 2, `rgb(${120 + i % 17},${128 + (i * 3) % 15},255)`); }
  });

  canvasTexture(scene, 'floor-surface', 256, 100, (ctx) => {
    rect(ctx, 0, 0, 256, 100, '#343638');
    for (let y = 8; y < 100; y += 22) {
      rect(ctx, 0, y, 256, 2, '#575450');
      for (let x = (y % 3) * 27; x < 256; x += 70) rect(ctx, x, y + 3, 1, 15, '#4a4947');
    }
    ctx.fillStyle = '#8bb8b955'; ctx.beginPath(); ctx.ellipse(42, 37, 37, 4, -0.1, 0, Math.PI * 2); ctx.ellipse(188, 74, 48, 5, 0.04, 0, Math.PI * 2); ctx.fill();
  });

  canvasTexture(scene, 'dust', 12, 12, (ctx) => { ctx.fillStyle = '#fff1c3'; ctx.beginPath(); ctx.arc(6, 6, 4, 0, Math.PI * 2); ctx.fill(); });
  canvasTexture(scene, 'spark', 18, 18, (ctx) => { ctx.fillStyle = '#9cff67'; ctx.fillRect(7, 0, 4, 18); ctx.fillRect(0, 7, 18, 4); ctx.fillStyle = '#e9ffbf'; ctx.fillRect(6, 6, 6, 6); });

  for (const key of ['player', 'clerk', 'rat-boss', 'octopus-senior', 'shelf', 'freezer', 'calendar', 'shrine', 'pot', 'parallax-far', 'parallax-mid', 'floor-surface']) attachNormalMap(scene, key);
}

export function drawPixelBackdrop(scene: Phaser.Scene): void {
  const floor = scene.add.graphics().setDepth(2);
  floor.fillStyle(0x383638, 1).fillRect(0, 620, 3200, 100);
  floor.fillStyle(0x514848, 1).fillRect(0, 620, 3200, 7);
  floor.lineStyle(2, 0x5c5651, 0.55);
  for (let x = 0; x < 3200; x += 80) { floor.lineBetween(x, 622, x + 44, 720); floor.lineBetween(x + 40, 620, x + 12, 720); }
  floor.fillStyle(0x98a2ac, 0.08).fillEllipse(540, 646, 300, 20).fillEllipse(1480, 648, 540, 22).fillEllipse(2820, 648, 330, 26);
  scene.add.tileSprite(1600, 670, 3200, 100, 'floor-surface').setOrigin(0.5).setDepth(4).setPipeline('Light2D');
  const wall = scene.add.graphics().setDepth(1);
  wall.fillGradientStyle(0x343238, 0x24262b, 0x1a2026, 0x343238, 1).fillRect(0, 235, 3200, 385);
  wall.lineStyle(3, 0x786c58, 0.45).lineBetween(0, 610, 3200, 610);
  for (const x of [700, 2100, 2600]) { wall.lineStyle(3, 0x81715f, 0.5).lineBetween(x, 205, x, 620); }
}

export const ASSET_KEYS = { player: 'player', rat: 'rat-boss', octopus: 'octopus-senior', shelf: 'shelf', freezer: 'freezer', calendar: 'calendar', shrine: 'shrine', pot: 'pot', sword: 'sword', bottle: 'marble-bottle', flashlight: 'flashlight-cone', far: 'parallax-far', mid: 'parallax-mid', front: 'parallax-front', dust: 'dust', spark: 'spark' } as const;
