// サブスキルのデフォルト一覧。
//
// ユーザーがポケモンスリープ攻略・検証Wiki「サブスキル」ページの表を
// 直接コピー&ペーストして提供してくれた内容(金色/青色/白色のレア度別
// 一覧)に基づく、確定情報。全17種類で全数のはず。
//
// レア度: 金色 > 青色 > 白色。ランクアップ可能なサブスキルはS<M<Lの順に
// 性能が上がる(「サブスキルのたね」で解放済みスキルをランクアップ可能)が、
// 全てのサブスキルがLまで存在するわけではない
// (例: 最大所持数アップはS/M/Lの3段階だが、食材確率アップ/スキル確率アップ/
// おてつだいスピードはS/Mの2段階まで、きのみの数はSのみの単一ランク)。
//
// 誤りや今後のアップデートによる追加があれば「種族マスタ管理」画面から
// 自由に追加・編集してください。
export type SubSkillTier = 'gold' | 'blue' | 'white';

export const SUBSKILL_TIER_LABELS: Record<SubSkillTier, string> = {
  gold: '金',
  blue: '青',
  white: '白',
};

const GOLD_SUBSKILLS = [
  '睡眠EXPボーナス',
  'おてつだいボーナス',
  'げんき回復ボーナス',
  'ゆめのかけらボーナス',
  'リサーチEXPボーナス',
  'きのみの数S',
  'スキルレベルアップM',
];

const BLUE_SUBSKILLS = [
  'スキルレベルアップS',
  '最大所持数アップL',
  '最大所持数アップM',
  'おてつだいスピードM',
  '食材確率アップM',
  'スキル確率アップM',
];

const WHITE_SUBSKILLS = [
  '最大所持数アップS',
  'おてつだいスピードS',
  '食材確率アップS',
  'スキル確率アップS',
];

export const DEFAULT_SUBSKILLS: string[] = [
  ...GOLD_SUBSKILLS,
  ...BLUE_SUBSKILLS,
  ...WHITE_SUBSKILLS,
];

const SUBSKILL_TIER_BY_NAME: Record<string, SubSkillTier> = {};
for (const name of GOLD_SUBSKILLS) SUBSKILL_TIER_BY_NAME[name] = 'gold';
for (const name of BLUE_SUBSKILLS) SUBSKILL_TIER_BY_NAME[name] = 'blue';
for (const name of WHITE_SUBSKILLS) SUBSKILL_TIER_BY_NAME[name] = 'white';

/** サブスキル名からレア度(金/青/白)を返す。未知の名前ならnull。 */
export function subSkillTierOf(name: string): SubSkillTier | null {
  return SUBSKILL_TIER_BY_NAME[name] ?? null;
}
