import type { PokemonSpecies } from './types';

function species(
  id: string,
  name: string,
  specialty: PokemonSpecies['specialty'],
  opts: {
    berry?: string;
    mainSkill?: string;
    ingredients?: [string[], string[], string[]];
  } = {}
): PokemonSpecies {
  return {
    id,
    name,
    specialty,
    berry: opts.berry ?? '',
    mainSkill: opts.mainSkill ?? '',
    ingredientOptions: opts.ingredients ?? [[], [], []],
  };
}

/**
 * 初期シードデータ。
 *
 * ポケモンスリープの「とくい分野」(きのみ/食材/スキル)はポケモンごとに固定。
 * ここでは Web検索で確認できた範囲の情報を反映しているが、このセッションは
 * ネットワークポリシーによりwikiページを直接取得(スクレイピング)できず、
 * 検索結果の要約からの情報収集に限られるため、全ポケモン・全項目を
 * 網羅できているわけではない。以下は現時点で裏取りできた/できなかった内容の内訳:
 *
 * - 検索で「とくい」を確認できたもの: フシギダネ系統・ヒトカゲ系統・ゼニガメ系統
 *   (いずれも食材型)、ピカチュウ系統(きのみ型)、キャタピー(きのみ型)、
 *   カイロス(食材型)、ヘラクロス(スキル型)
 * - 検索で強く示唆されたが断定はできなかったもの: コダック系統(スキル型)
 * - 検索で裏取りできず、未確認のまま残しているもの: 上記以外(ポッポ系統・
 *   コラッタ系統・ビードル系統・イーブイ・プリン系統・ケーシィ系統・
 *   ヒメグマ系統など)。誤っている可能性があるため要確認。
 *
 * より正確・網羅的なデータが必要な場合は、wikiの表をこの画面(種族マスタ管理)
 * からCSVで一括取込することを推奨。誤りや未登録のポケモンがあれば
 * 「種族マスタ管理」画面から自由に追加・修正してください。
 */
export const DEFAULT_SPECIES: PokemonSpecies[] = [
  // フシギダネ系統: 食材型(Web検索で確認。食材例: あまいミツ)
  species('fushigidane', 'フシギダネ', 'ingredient', {
    mainSkill: '食材ゲットS',
    ingredients: [['あまいミツ'], [], []],
  }),
  species('fushigisou', 'フシギソウ', 'ingredient'),
  species('fushigibana', 'フシギバナ', 'ingredient'),

  // ヒトカゲ系統: 食材型(Web検索で確認。食材例: マメミート、あたたかジンジャー(Lv30))
  species('hitokage', 'ヒトカゲ', 'ingredient', {
    ingredients: [['マメミート'], ['あたたかジンジャー'], []],
  }),
  species('lizardo', 'リザード', 'ingredient'),
  species('lizardon', 'リザードン', 'ingredient'),

  // ゼニガメ系統: 食材型(Web検索で確認。食材例: モーモーミルク、リラックスカカオ(Lv30))
  // メインスキルは画像サンプルより「食材ゲットS」
  species('zenigame', 'ゼニガメ', 'ingredient', {
    mainSkill: '食材ゲットS',
    ingredients: [['モーモーミルク'], ['リラックスカカオ'], []],
  }),
  species('kameil', 'カメール', 'ingredient'),
  species('kamex', 'カメックス', 'ingredient'),

  // ポッポ系統: きのみ型(未確認・要検証)
  species('poppo', 'ポッポ', 'berry'),
  species('pigeon', 'ピジョン', 'berry'),
  species('pigeot', 'ピジョット', 'berry'),

  // コラッタ系統: きのみ型(未確認・要検証)
  species('koratta', 'コラッタ', 'berry'),
  species('ratta', 'ラッタ', 'berry'),

  // キャタピー系統: きのみ型(Web検索で確認。メインスキルは「食材ゲット」系)
  species('caterpie', 'キャタピー', 'berry'),
  species('trance', 'トランセル', 'berry'),
  species('butterfree', 'バタフリー', 'berry'),

  // ビードル系統: きのみ型(未確認・要検証)
  species('beedle', 'ビードル', 'berry'),
  species('cocoon', 'コクーン', 'berry'),
  species('spear', 'スピアー', 'berry'),

  // ピカチュウ系統: きのみ型(Web検索で確認。好物のきのみ=ウブのみ、メインスキル=食材ゲットS)
  // 食材例: とくせんリンゴ、あたたかジンジャー(Lv30/60)
  species('pikachu', 'ピカチュウ', 'berry', {
    berry: 'ウブのみ',
    mainSkill: '食材ゲットS',
    ingredients: [['とくせんリンゴ'], ['あたたかジンジャー'], []],
  }),
  species('raichu', 'ライチュウ', 'berry'),

  // イーブイ: きのみ型(未確認・要検証)
  species('eievui', 'イーブイ', 'berry'),

  // プリン系統: スキル型(未確認・要検証)
  species('purin', 'プリン', 'skill'),
  species('pukurin', 'プクリン', 'skill'),

  // コダック系統: スキル型(Web検索で示唆。メインスキル「エナジーチャージS」の発動率が高いとの情報)
  species('kodack', 'コダック', 'skill', { mainSkill: 'エナジーチャージS' }),
  species('golduck', 'ゴルダック', 'skill'),

  // ケーシィ系統: スキル型(未確認・要検証)
  species('casey', 'ケーシィ', 'skill'),
  species('yungerer', 'ユンゲラー', 'skill'),
  species('foodin', 'フーディン', 'skill'),

  // ヒメグマ系統: 食材型(未確認・要検証)
  species('himeguma', 'ヒメグマ', 'ingredient'),
  species('ringuma', 'リングマ', 'ingredient'),

  // カイロス: 食材型(Web検索で確認)
  species('kailios', 'カイロス', 'ingredient'),

  // ヘラクロス: スキル型(Web検索で確認。食材例: キノコ)
  species('heracros', 'ヘラクロス', 'skill', {
    ingredients: [['キノコ'], [], []],
  }),

  // カビゴン: オール型(おてつだいをせず全ポケモンから食材/きのみが集まる特殊枠)
  species('kabigon', 'カビゴン', 'all'),
];
