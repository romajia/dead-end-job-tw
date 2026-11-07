export interface SaveData {
  version: 1;
  unlockedLevel: number;
  pocketMoney: number;
  inventory: string[];
  completedNights: number[];
  teaCharges: number;
}

const STORAGE_KEY = 'qiongtu-morub-save-v1';
const DEFAULT_SAVE: SaveData = {
  version: 1,
  unlockedLevel: 1,
  pocketMoney: 0,
  inventory: ['菊花枸杞茶'],
  completedNights: [],
  teaCharges: -1,
};

export class SaveManager {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_SAVE);
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return {
        version: 1,
        unlockedLevel: Math.max(1, Math.min(7, Number(parsed.unlockedLevel) || 1)),
        pocketMoney: Math.max(0, Number(parsed.pocketMoney) || 0),
        inventory: Array.isArray(parsed.inventory) ? parsed.inventory.filter((item): item is string => typeof item === 'string') : [...DEFAULT_SAVE.inventory],
        completedNights: Array.isArray(parsed.completedNights) ? parsed.completedNights.filter((night): night is number => Number.isInteger(night) && night >= 1 && night <= 7) : [],
        teaCharges: typeof parsed.teaCharges === 'number' ? parsed.teaCharges : -1,
      };
    } catch {
      return structuredClone(DEFAULT_SAVE);
    }
  }

  public get dataSnapshot(): SaveData { return structuredClone(this.data); }

  public save(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch { /* Storage may be disabled in private browsing. */ }
  }

  public completeNightOne(): SaveData {
    this.data.pocketMoney += 84;
    this.data.unlockedLevel = Math.max(this.data.unlockedLevel, 2);
    this.data.completedNights = Array.from(new Set([...this.data.completedNights, 1]));
    if (!this.data.inventory.includes('魔爪提神飲')) this.data.inventory.push('魔爪提神飲');
    this.save();
    return this.dataSnapshot;
  }

  public reset(): void {
    this.data = structuredClone(DEFAULT_SAVE);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be disabled in private browsing. */ }
  }
}
