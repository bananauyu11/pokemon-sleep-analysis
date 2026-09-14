// ポケモンスリープ分析アプリの型定義

// 'all'(オール型)は2025年4月にダークライなどごく一部の特別なポケモン
// 向けに追加された、きのみ/食材/スキルすべての強みを併せ持つとくい分野。
// カビゴンなど大半のポケモンには該当しない点に注意。
export type SpecialtyType = 'berry' | 'ingredient' | 'skill' | 'all';

export const SPECIALTY_LABELS: Record<SpecialtyType, string> = {
  berry: 'きのみ',
  ingredient: '食材',
  skill: 'スキル',
  all: 'オール',
};

export type MedalRank = 'none' | 'bronze' | 'silver' | 'gold';

export const MEDAL_LABELS: Record<MedalRank, string> = {
  none: 'なし',
  bronze: '銅',
  silver: '銀',
  gold: '金',
};

export const MEDAL_ORDER: MedalRank[] = ['none', 'bronze', 'silver', 'gold'];

// サブスキル解放レベル(ポケモンスリープ仕様: Lv10/25/50/70/80の5枠)。
// 2026年6月25日 Ver.3.6.0アップデートでLv75→Lv70、Lv100→Lv80に変更された。
export const SUBSKILL_LEVELS = [10, 25, 50, 70, 80] as const;
export type SubSkillLevel = (typeof SUBSKILL_LEVELS)[number];

export interface SubSkillEntry {
  level: SubSkillLevel;
  skill: string; // サブスキル名 (未取得なら空文字)
}

// 食材配置パターン (3スロット中、同一食材が何個重複するかの形)
export type IngredientPattern = 'AAA' | 'AAB' | 'ABC' | '';

export interface PokemonSpecies {
  id: string; // slug (ローマ字などユニークID)
  name: string; // 表示名 (例: ゼニガメ)
  specialty: SpecialtyType;
  berry: string; // きのみ名
  mainSkill: string; // メインスキル名
  // 各食材スロット(1,2,3)の候補食材名。判明していないものは空配列でよい。
  ingredientOptions: [string[], string[], string[]];
}

export interface PokemonEntry {
  id: string;
  speciesId: string; // PokemonSpecies.id への参照 (未登録種の場合は '' もありうる)
  speciesName: string; // 冗長だが表示・CSV安定性のために保持
  nickname: string;
  level: number;
  nature: string; // 性格
  medal: MedalRank;
  caughtDate: string; // 捕獲日 (YYYY-MM-DD)
  capturedTime: string; // 画像から読み取った時刻 (HH:mm)
  subSkills: SubSkillEntry[]; // 長さ5固定 (levels 10/25/50/75/100)
  ingredients: [string, string, string]; // 選択した食材(スロット1-3)
  ingredientPattern: IngredientPattern; // 自動計算
  specialty: SpecialtyType; // 記録時点の種族データから複製
  berry: string;
  mainSkill: string;
  imageFileName: string; // 取込元画像ファイル名(参考情報)
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export function emptySubSkills(): SubSkillEntry[] {
  return SUBSKILL_LEVELS.map((level) => ({ level, skill: '' }));
}

export function createEmptyEntry(): PokemonEntry {
  const now = new Date().toISOString();
  return {
    id: '',
    speciesId: '',
    speciesName: '',
    nickname: '',
    level: 1,
    nature: '',
    medal: 'none',
    caughtDate: '',
    capturedTime: '',
    subSkills: emptySubSkills(),
    ingredients: ['', '', ''],
    ingredientPattern: '',
    specialty: 'berry',
    berry: '',
    mainSkill: '',
    imageFileName: '',
    notes: '',
    createdAt: now,
    updatedAt: now,
  };
}
