export const PARAMS = {
  TITLE: '窮徒莫入：一路好走人力銀行',
  LEVEL_TITLE: '第 1 夜：都市怪談—深夜福利社',
  STORE_NAME: '俗俗埋 24H 生鮮百貨',
  HOURLY_WAGE: 196,
  SHIFT_HOURS: 4,
  GROSS_PAY: 784,
  GANGSTER_DEDUCTION: 700,
  NET_PAY: 84,
  WORLD_WIDTH: 3200,
  WORLD_HEIGHT: 720,
  FLOOR_Y: 620,
  REAL_SECONDS_PER_GAME_HOUR: 70,
  PLAYER: {
    WALK_SPEED: 245,
    RUN_SPEED: 365,
    ROLL_SPEED: 530,
    ROLL_DURATION_MS: 340,
    ROLL_INVULNERABLE_MS: 480,
    MAX_HP: 100,
    MAX_OXYGEN: 100,
    OXYGEN_DRAIN_PER_SEC: 16,
    OXYGEN_REGEN_PER_SEC: 32,
    FLASHLIGHT_RADIUS: 360,
    FLASHLIGHT_ANGLE_DEG: 56,
    SWORD_DAMAGE: 50,
    SWORD_ARC_PX: 230,
    PARRY_WINDOW_MS: 400,
    HITSTOP_MS: 90,
  },
  RAT_BOSS: {
    PATROL_SPEED: 110,
    SUSPICIOUS_SPEED: 165,
    CHASE_SPEED: 230,
    NOISE_DETECT_RADIUS: 240,
    SIGHT_DETECT_RADIUS: 340,
    ATTACK_WINDUP_MS: 1050,
    ATTACK_DAMAGE: 20,
    STUN_DURATION_MS: 4200,
    MAX_HP: 300,
  },
  HAPTICS: {
    TUTORIAL_CHECK: { duration: 70, weak: 0.5, strong: 0.2 },
    RAT_CREEP_NEAR: { duration: 95, weak: 0.4, strong: 0.2 },
    HEARTBEAT_SUB: { duration: 105, weak: 0.2, strong: 0.65 },
    PLASTIC_TOY_SNAP: { duration: 160, weak: 0.85, strong: 0.1 },
    TSMC_SWORD_AWAKEN: { duration: 340, weak: 1, strong: 0.85 },
    CUDA_HITSTOP_SLAM: { duration: 240, weak: 1, strong: 1 },
    GOJI_TEA_REVIVE: { duration: 200, weak: 0.6, strong: 0.5 },
    ATM_DISPENSE_784: { duration: 45, weak: 0.65, strong: 0.2 },
    GANGSTER_SNATCH_700: { duration: 250, weak: 0.2, strong: 1 },
    FINAL_STAMP_BOOM: { duration: 420, weak: 1, strong: 1 },
  },
} as const;

export type LevelPhase =
  | 'PHASE_0_TUTORIAL'
  | 'PHASE_1_CALENDAR_RULES'
  | 'PHASE_2_OCTOPUS_INK_WARNING'
  | 'PHASE_3_STEALTH_PLASTIC_TOY_FAIL'
  | 'PHASE_4_TSMC_NVIDIA_SWORD'
  | 'PHASE_5_SUNRISE_AND_ENDING';

export const PHASE_NAMES: Record<LevelPhase, string> = {
  PHASE_0_TUTORIAL: '安全教學・01:55 AM',
  PHASE_1_CALENDAR_RULES: '撕開日曆・02:00 AM',
  PHASE_2_OCTOPUS_INK_WARNING: '冷凍庫點貨・02:30 AM',
  PHASE_3_STEALTH_PLASTIC_TOY_FAIL: '停電潛行・03:30 AM',
  PHASE_4_TSMC_NVIDIA_SWORD: '算力反擊・05:00 AM',
  PHASE_5_SUNRISE_AND_ENDING: '破曉結算・06:00 AM',
};

export const PROMPTS = {
  GAMEPAD: { move: '[L-Stick / D-Pad] 移動', aim: '[R-Stick] 照明', interact: '[A] 調查', slash: '[X] 算力斬', dodge: '[B] 翻滾', hide: '[Y / LB] 躲藏', breath: '按住 [LT / RT] 憋氣', tear: '[RB] 撕日曆' },
  KEYBOARD: { move: '[A/D] 移動', aim: '[滑鼠] 照明', interact: '[E] 調查', slash: '[Space] 算力斬', dodge: '[Shift] 翻滾', hide: '[W] 躲藏', breath: '按住 [右鍵 / C] 憋氣', tear: '[R] 撕日曆' },
  TOUCH: { move: '[搖桿] 移動', aim: '[光束盤] 照明', interact: '[點擊] 調查', slash: '[⚔️] 算力斬', dodge: '[💨] 翻滾', hide: '[📦] 躲藏', breath: '長按 [🫁] 憋氣', tear: '[下滑撕開] 撕日曆' },
} as const;

export const CALENDAR_RULES = [
  '守則一（11 月 7 日）：凌晨 02:30 必須進店尾「生鮮冷凍庫」清點海鮮。其餘時間就算聽到冷凍庫傳來拍打聲或哭喊，絕對不可打開庫門！',
  '守則二（11 月 8 日）：若店內出現不乾淨的髒東西，請去神明廳抽屜拿公司採購的「鎮宅符紙與驅魔十字架」鎮壓。',
  '封底夾層（真相）：本店時薪才 196 元，老闆怎麼可能請兩個人領雙份薪水？！如果店裡有第二個店員跟你講話……牠是水溝裡的歹咪仔變的！快去神明廳拿武器！！',
] as const;
