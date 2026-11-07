# 窮徒莫入：一路好走人力銀行

以 Phaser 3、TypeScript、Vite 製作的繁體中文橫向像素生存遊戲。第 1 夜流程可從據點一路遊玩至結算，圖片、材質、光影、粒子與音效均由程式即時生成，不需要下載任何美術或音效素材。

## 啟動

需安裝 Node.js 與 pnpm。在此資料夾執行：

```powershell
pnpm install; pnpm dev
```

開發伺服器會顯示本機網址。若電腦使用 npm，也可先執行 `npm install`，再以 `npm run dev` 啟動。Production bundle 使用 `pnpm build` 建立於 `dist/`。

## 專案結構

```text
dead-end-job-tw/
├── index.html
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
└── src/
    ├── main.ts
    ├── config/
    │   └── GameConstants.ts
    ├── systems/
    │   ├── AudioManager.ts
    │   ├── ComicCutIn.ts
    │   ├── InputManager.ts
    │   ├── PostFXPipeline.ts
    │   ├── ProceduralAssets.ts
    │   └── SaveManager.ts
    ├── entities/
    │   ├── OctopusSenior.ts
    │   ├── Player.ts
    │   └── RatBoss.ts
    └── scenes/
        ├── BootScene.ts
        ├── DaveEndingScene.ts
        ├── Level1Scene.ts
        └── UIOverlayScene.ts
```

## 操作

| 動作 | 鍵盤／滑鼠 | Xbox 標準手把 | 觸控 |
| --- | --- | --- | --- |
| 移動 | A/D 或方向鍵 | 左搖桿／十字鍵 | 左側虛擬搖桿 |
| 照手電筒 | 滑鼠游標 | 右搖桿 | 右側光束盤 |
| 調查／互動 | E | A | ✋ |
| 算力斬 | Space 或滑鼠左鍵 | X | ⚔️ |
| 翻滾 | Shift | B | 💨 |
| 躲藏 | W | Y 或 LB | 📦 |
| 憋氣 | C 或滑鼠右鍵 | LT 或 RT | 長按 🫁 |
| 撕日曆 | R 或在遊戲畫面向下滑 | RB | 👇 或向下滑 |
| 暫停／繼續 | Esc | Start | — |
| 查看日曆 | Tab | Select | 日曆互動後下滑 |

手把輸入每個動畫影格輪詢；雙搖桿使用徑向死區 `0.15`。接上手把後，按鍵提示切換為手把圖示，並顯示連線狀態。瀏覽器不支援雙馬達震動時，使用鏡頭震動與 HUD 脈衝提示。

## 第 1 夜流程

1. 01:55 AM 安全教學：照滷味鍋、躲進貨架、憋氣 1.5 秒、撕開日曆。
2. 讀取兩條夜班規則，等到 02:30 AM 前往最右側冷凍庫；照亮阿娟姊後觸發漫畫特寫。
3. 回收銀台讀取封底真相，進入停電潛行；在神明廳取得塑膠鎮宅玩具，引出水溝歹咪仔。
4. 觸發玩具翻車與算力神劍覺醒，使用寬幅劍氣、翻滾、格擋或滷味鍋擊敗鼠怪。HP 歸零時，菊花枸杞茶會在 1.8 秒後滿血救援。
5. 領取 NT$784 薪水，阿豹哥抽走 NT$700，留下 NT$84 並塞入一罐魔爪提神飲。完成後可存檔返回據點。

## 技術內容

- Phaser 3.90 WebGL，1280×720、FIT/CENTER_BOTH、pixel art 與整數像素座標。
- 程序化角色、場景、Normal Map、四層視差、濕地板倒影、Light2D、雷達色差與破曉效果。
- 原生 Web Audio 合成冷凍櫃低鳴、低頻環境聲、憋氣低通與 135 BPM 戰鬥節奏；濾波上限 1500 Hz。
- localStorage 儲存口袋錢、物品、完成關卡與解鎖夜數。
- 直向手機會顯示橫放提示；所有遊戲畫面素材均由程式繪製。

`unlockedLevel` 與存檔已預留 7 夜進度。這份版本實作完整第 1 夜，第 2–7 夜仍在企劃階段。
