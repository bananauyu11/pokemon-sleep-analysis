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
  // 2026-09-21 チャットに貼り付けられた2枚のポッチャマ(Lv.14, SP549)のスクリーンショットから
  // 画像を直接目視して登録(同じ個体の別スクロール位置)。食材アイコンはリファレンス画像と
  // 比較して判定(スロット1・3=とくせんエッグの白い卵形、スロット2=ふといながねぎの
  // 斜めの緑ねぎ形)。出会った日が画面に表示されていたため捕まえた日として記録。
  entry({
    id: 'chat-import-pocchama-20260921',
    speciesId: 'ポッチャマ',
    speciesName: 'ポッチャマ',
    level: 14,
    nature: 'わんぱく',
    medal: 'none',
    caughtDate: '2026-09-21',
    capturedTime: '',
    subSkills: [
      { level: 10, skill: 'おてつだいスピードS' },
      { level: 25, skill: 'おてつだいスピードM' },
      { level: 50, skill: '最大所持数アップM' },
      { level: 70, skill: '最大所持数アップL' },
      { level: 80, skill: 'スキルレベルアップS' },
    ],
    ingredients: ['とくせんエッグ', 'ふといながねぎ', 'とくせんエッグ'],
    specialty: 'berry',
    berry: 'オレンのみ',
    adopted: true,
    imageFileName: '',
  }),
  // 2026-09-22 チャットに貼り付けられた2枚のネイティ(Lv.14, SP452)のスクリーンショットから
  // 画像を直接目視して登録(同じ個体の別スクロール位置。既存のネイティ2個体とはSPが
  // 異なるため別個体)。食材アイコンはリファレンス画像と比較して判定
  // (スロット1・3=とくせんエッグ、スロット2=リラックスカカオ)。
  entry({
    id: 'chat-import-neity-c-20260922',
    speciesId: 'ネイティ',
    speciesName: 'ネイティ',
    level: 14,
    nature: 'のんき',
    medal: 'none',
    caughtDate: '2026-09-22',
    capturedTime: '',
    subSkills: [
      { level: 10, skill: '食材確率アップS' },
      { level: 25, skill: '食材確率アップM' },
      { level: 50, skill: 'おてつだいスピードS' },
      { level: 70, skill: 'おてつだいスピードM' },
      { level: 80, skill: '最大所持数アップL' },
    ],
    ingredients: ['とくせんエッグ', 'リラックスカカオ', 'とくせんエッグ'],
    specialty: 'berry',
    berry: 'マゴのみ',
    adopted: true,
    imageFileName: '',
  }),
  // 2026-09-22 チャットに貼り付けられた2枚のゼニガメ(Lv.14, SP530)のスクリーンショットから
  // 画像を直接目視して登録(同じ個体の別スクロール位置)。食材アイコンは3枠とも
  // 白いボトル+青いラベルのモーモーミルクで一致。
  entry({
    id: 'chat-import-zenigame-20260922',
    speciesId: 'ゼニガメ',
    speciesName: 'ゼニガメ',
    level: 14,
    nature: 'のうてんき',
    medal: 'none',
    caughtDate: '2026-09-22',
    capturedTime: '',
    subSkills: [
      { level: 10, skill: 'おてつだいスピードM' },
      { level: 25, skill: '食材確率アップM' },
      { level: 50, skill: 'スキル確率アップS' },
      { level: 70, skill: '最大所持数アップS' },
      { level: 80, skill: 'おてつだいスピードS' },
    ],
    ingredients: ['モーモーミルク', 'モーモーミルク', 'モーモーミルク'],
    specialty: 'ingredient',
    berry: 'オレンのみ',
    adopted: true,
    imageFileName: '',
  }),
  // 2026-09-22 チャットに貼り付けられたミュウツー(Lv.29, SP1320)のスクリーンショットから
  // 画像を直接目視して登録。食材スロット1・3は当初「淡い黄褐色の房状」の見た目からは
  // ジンジャーかワカクサ大豆か確信が持てず未入力としていたが、2026-09-24にユーザーから
  // 提供されたwikiの表データによりミュウツーの食材候補が
  // (スロット1候補=ワカクサ大豆、スロット2候補=ワカクサコーン、スロット3候補=ほっこりポテト)
  // と確定(ポケモンマスタにも登録済み)。スロット1・3は画像上同一の見た目だったため、
  // 候補のうち共通して該当しうるワカクサ大豆と判断して入力。きのみ・性格・捕まえた日は
  // 画面に映っていなかったため未入力。
  entry({
    id: 'chat-import-mewtwo-20260922',
    speciesId: 'ミュウツー',
    speciesName: 'ミュウツー',
    level: 29,
    nature: '',
    medal: 'none',
    caughtDate: '',
    capturedTime: '',
    subSkills: [
      { level: 10, skill: '最大所持数アップS' },
      { level: 25, skill: 'おてつだいスピードS' },
      { level: 50, skill: '最大所持数アップL' },
      { level: 70, skill: '食材確率アップS' },
      { level: 80, skill: 'スキル確率アップM' },
    ],
    ingredients: ['ワカクサ大豆', 'ワカクサコーン', 'ワカクサ大豆'],
    specialty: 'skill',
    berry: '',
    adopted: true,
    imageFileName: '',
  }),
  // 2026-09-24 チャットに貼り付けられた2枚のミュウツー(Lv.26, SP1295、前回登録した
  // Lv.29個体とはSP/Lvが異なる別個体)のスクリーンショットから画像を直接目視して登録。
  // 食材スロット1・3は前回と同じ「淡い黄褐色の房状」の見た目だったが、ユーザー提供の
  // wikiデータによりミュウツーの食材候補
  // (スロット1候補=ワカクサ大豆、スロット2候補=ワカクサコーン、スロット3候補=ほっこりポテト)
  // が確定したことで、ワカクサ大豆と判断して入力(前回の個体と同様)。
  // 捕まえた日はユーザー指定により2026-09-24。
  entry({
    id: 'chat-import-mewtwo-2-20260924',
    speciesId: 'ミュウツー',
    speciesName: 'ミュウツー',
    level: 26,
    nature: 'のうてんき',
    medal: 'none',
    caughtDate: '2026-09-24',
    capturedTime: '',
    subSkills: [
      { level: 10, skill: '最大所持数アップM' },
      { level: 25, skill: 'おてつだいスピードS' },
      { level: 50, skill: '最大所持数アップS' },
      { level: 70, skill: 'おてつだいスピードM' },
      { level: 80, skill: 'スキル確率アップS' },
    ],
    ingredients: ['ワカクサ大豆', 'ワカクサコーン', 'ワカクサ大豆'],
    specialty: 'skill',
    berry: '',
    adopted: true,
    imageFileName: '',
  }),
  // 2026-09-23 チャットに貼り付けられた2枚のネイティ(Lv.14, SP509、既存の3個体とは
  // SPが異なるため別個体)のスクリーンショットから画像を直接目視して登録。食材アイコンは
  // リファレンス画像と比較して判定(スロット1・3=とくせんエッグ、スロット2=リラックスカカオ)。
  entry({
    id: 'chat-import-neity-d-20260923',
    speciesId: 'ネイティ',
    speciesName: 'ネイティ',
    level: 14,
    nature: 'しんちょう',
    medal: 'none',
    caughtDate: '2026-09-23',
    capturedTime: '',
    subSkills: [
      { level: 10, skill: 'リサーチEXPボーナス' },
      { level: 25, skill: 'スキルレベルアップS' },
      { level: 50, skill: '睡眠EXPボーナス' },
      { level: 70, skill: '食材確率アップS' },
      { level: 80, skill: 'おてつだいボーナス' },
    ],
    ingredients: ['とくせんエッグ', 'リラックスカカオ', 'とくせんエッグ'],
    specialty: 'berry',
    berry: 'マゴのみ',
    adopted: true,
    imageFileName: '',
  }),
];
