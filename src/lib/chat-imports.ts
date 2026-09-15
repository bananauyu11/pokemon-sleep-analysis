import { computeIngredientPattern } from './ingredient-pattern';
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
  return {
    ...partial,
    ingredientPattern: computeIngredientPattern(partial.ingredients),
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
    imageFileName: '',
  }),
];
