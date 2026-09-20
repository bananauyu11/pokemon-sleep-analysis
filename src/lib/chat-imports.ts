import { computeIngredientPattern } from './ingredient-pattern';
import { DEFAULT_SPECIES } from './species-data';
import type { PokemonEntry } from './types';

/**
 * 画像OCRでは正しく読み取れなかった(またはユーザーが直接チャットに
 * 貼り付けた)スクリーンショットについて、Claudeが画像を直接目視して
 * 読み取った内容をここに記録として追加する。
 *
 * ここに追加したエントリは、アプリ起動時に一度だけ(まだ登録されていなければ)
 * db.entries に自動追加される(src/lib/db.ts の applyChatImports 参照)。
 * 一度追加された後にユーザーが削除しても、appliedImports テーブルに
 * 適用済み記録が残るため再度追加されることはない。
 *
 * id は固定値にすること(重複登録防止のキーになるため)。
 */
function entry(partial: Omit<PokemonEntry, 'ingredientPattern' | 'createdAt' | 'updatedAt'>): PokemonEntry {
  const now = new Date().toISOString();
  const species = DEFAULT_SPECIES.find((s) => s.name === partial.speciesName);
  return {
    ...partial,
    ingredientPattern: computeIngredientPattern(partial.ingredients, species),
    createdAt: now,
    updatedAt: now,
  };
}

export const CHAT_IMPORTED_ENTRIES: PokemonEntry[] = [
  // 2026-09-15 チャットに貼り付けられたヒノアラシ(Lv.14)のスクリーンショットから、
  // OCRでは正しく読み取れなかったため、画像を直接目視して登録。
  entry({
    id: 'chat-import-hinoarashi-20260915-1313',
    speciesId: 'ヒノアラシ',
    speciesName: 'ヒノアラシ',
    level: 14,
    nature: '',
    medal: 'none',
    caughtDate: '',
    capturedTime: '13:13',
    subSkills: [
      { level: 10, skill: 'スキルレベルアップS' },
      { level: 25, skill: '食材確率アップM' },
      { level: 50, skill: 'スキル確率アップS' },
      { level: 70, skill: '最大所持数アップS' },
      { level: 80, skill: '最大所持数アップM' },
    ],
    ingredients: ['あったかジンジャー', 'げきからハーブ', 'ピュアなオイル'],
    specialty: 'berry',
    berry: 'ヒメリのみ',
    adopted: true,
    imageFileName: '',
  }),
  // 2026-09-15 チャットに貼り付けられたコイル(Lv.14)のスクリーンショットから、
  // 画像を直接目視して登録。
  entry({
    id: 'chat-import-koiru-20260915-0718',
    speciesId: 'コイル',
    speciesName: 'コイル',
    level: 14,
    nature: '',
    medal: 'none',
    caughtDate: '',
    capturedTime: '07:18',
    subSkills: [
      { level: 10, skill: '最大所持数アップL' },
      { level: 25, skill: 'スキル確率アップM' },
      { level: 50, skill: 'リサーチEXPボーナス' },
      { level: 70, skill: 'おてつだいボーナス' },
      { level: 80, skill: '食材確率アップS' },
    ],
    ingredients: ['ピュアなオイル', 'げきからハーブ', 'げきからハーブ'],
    specialty: 'skill',
    berry: 'ベリブのみ',
    adopted: true,
    imageFileName: '',
  }),
  // 2026-09-17 チャットに貼り付けられたヨーギラス(Lv.13)のスクリーンショットから、
  // 画像を直接目視して登録。食材アイコンはリファレンス画像と比較して判定
  // (スロット1・2はジンジャーの根っこ状の形、スロット3は大豆の房+緑の芽が
  // 見えることから区別した)。
  entry({
    id: 'chat-import-yogirasu-20260917',
    speciesId: 'ヨーギラス',
    speciesName: 'ヨーギラス',
    level: 13,
    nature: '',
    medal: 'none',
    caughtDate: '',
    capturedTime: '',
    subSkills: [
      { level: 10, skill: 'げんき回復ボーナス' },
      { level: 25, skill: '食材確率アップM' },
      { level: 50, skill: '食材確率アップS' },
      { level: 70, skill: 'スキルレベルアップS' },
      { level: 80, skill: 'スキル確率アップS' },
    ],
    ingredients: ['あったかジンジャー', 'あったかジンジャー', 'ワカクサ大豆'],
    specialty: 'ingredient',
    berry: 'オボンのみ',
    adopted: true,
    imageFileName: '',
  }),
  // 2026-09-19 チャットに貼り付けられた2枚のネイティのスクリーンショットは、
  // サブスキルの内容が食い違っている(同じ個体なら解放済みのLv10サブスキルが
  // 変わることはない)ため、別々の2個体と判断してそれぞれ登録した。
  // 1個体目(Lv.14, SP479)。食材アイコンは画像上部が見切れており判定不能のため未入力。
  entry({
    id: 'chat-import-neity-a-20260919',
    speciesId: 'ネイティ',
    speciesName: 'ネイティ',
    level: 14,
    nature: '',
    medal: 'none',
    caughtDate: '',
    capturedTime: '',
    subSkills: [
      { level: 10, skill: 'おてつだいボーナス' },
      { level: 25, skill: 'おてつだいスピードS' },
      { level: 50, skill: '食材確率アップS' },
      { level: 70, skill: '最大所持数アップS' },
      { level: 80, skill: 'おてつだいスピードM' },
    ],
    ingredients: ['', '', ''],
    specialty: 'berry',
    berry: 'マゴのみ',
    adopted: true,
    imageFileName: '',
  }),
  // 2個体目(Lv.15, SP512)。食材アイコンはリファレンス画像と比較して判定
  // (スロット1・3はとくせんエッグの白い卵形、スロット2はリラックスカカオの
  // 茶色い涙形+緑の葉で区別)。
  entry({
    id: 'chat-import-neity-b-20260919',
    speciesId: 'ネイティ',
    speciesName: 'ネイティ',
    level: 15,
    nature: '',
    medal: 'none',
    caughtDate: '',
    capturedTime: '',
    subSkills: [
      { level: 10, skill: 'げんき回復ボーナス' },
      { level: 25, skill: 'スキル確率アップS' },
      { level: 50, skill: '最大所持数アップL' },
      { level: 70, skill: 'スキルレベルアップM' },
      { level: 80, skill: 'おてつだいスピードS' },
    ],
    ingredients: ['とくせんエッグ', 'リラックスカカオ', 'とくせんエッグ'],
    specialty: 'berry',
    berry: 'マゴのみ',
    adopted: true,
    imageFileName: '',
  }),
  // 2026-09-20 チャットに貼り付けられた2枚のムンナ(Lv.14, SP504)のスクリーンショットから
  // 画像を直接目視して登録(同じ個体の別スクロール位置)。食材アイコンは3枠とも
  // 白いボトルに青いラベルのモーモーミルクで一致。
  entry({
    id: 'chat-import-munna-20260920',
    speciesId: 'ムンナ',
    speciesName: 'ムンナ',
    level: 14,
    nature: 'きまぐれ',
    medal: 'none',
    caughtDate: '',
    capturedTime: '',
    subSkills: [
      { level: 10, skill: 'スキルレベルアップM' },
      { level: 25, skill: '食材確率アップS' },
      { level: 50, skill: '最大所持数アップL' },
      { level: 70, skill: '最大所持数アップS' },
      { level: 80, skill: 'げんき回復ボーナス' },
    ],
    ingredients: ['モーモーミルク', 'モーモーミルク', 'モーモーミルク'],
    specialty: 'berry',
    berry: 'マゴのみ',
    adopted: true,
    imageFileName: '',
  }),
];
