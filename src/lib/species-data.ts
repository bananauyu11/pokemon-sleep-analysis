import type { PokemonSpecies } from './types';

function species(
  id: string,
  name: string,
  specialty: PokemonSpecies['specialty'],
  berry = '',
  mainSkill = ''
): PokemonSpecies {
  return {
    id,
    name,
    specialty,
    berry,
    mainSkill,
    ingredientOptions: [[], [], []],
  };
}

/**
 * 初期シードデータ(参考値)。
 * ポケモンスリープの「とくい分野」(きのみ/食材/スキル)はポケモンごとに固定だが、
 * ここに含まれるのは確度の高い一部のみ。未登録のポケモンや誤りがある場合は
 * 「種族マスタ管理」画面から自由に追加・修正してください。
 */
export const DEFAULT_SPECIES: PokemonSpecies[] = [
  // フシギダネ系統: スキル型
  species('fushigidane', 'フシギダネ', 'skill'),
  species('fushigisou', 'フシギソウ', 'skill'),
  species('fushigibana', 'フシギバナ', 'skill'),

  // ヒトカゲ系統: スキル型
  species('hitokage', 'ヒトカゲ', 'skill'),
  species('lizardo', 'リザード', 'skill'),
  species('lizardon', 'リザードン', 'skill'),

  // ゼニガメ系統: スキル型(画像サンプルより メインスキル=食材ゲットS)
  species('zenigame', 'ゼニガメ', 'skill', '', '食材ゲットS'),
  species('kameil', 'カメール', 'skill'),
  species('kamex', 'カメックス', 'skill'),

  // ポッポ系統: きのみ型
  species('poppo', 'ポッポ', 'berry'),
  species('pigeon', 'ピジョン', 'berry'),
  species('pigeot', 'ピジョット', 'berry'),

  // コラッタ系統: きのみ型
  species('koratta', 'コラッタ', 'berry'),
  species('ratta', 'ラッタ', 'berry'),

  // キャタピー系統: きのみ型
  species('caterpie', 'キャタピー', 'berry'),
  species('trance', 'トランセル', 'berry'),
  species('butterfree', 'バタフリー', 'berry'),

  // ビードル系統: きのみ型
  species('beedle', 'ビードル', 'berry'),
  species('cocoon', 'コクーン', 'berry'),
  species('spear', 'スピアー', 'berry'),

  // ピカチュウ系統: 食材型
  species('pikachu', 'ピカチュウ', 'ingredient'),
  species('raichu', 'ライチュウ', 'ingredient'),

  // イーブイ: きのみ型
  species('eievui', 'イーブイ', 'berry'),

  // プリン系統: スキル型
  species('purin', 'プリン', 'skill'),
  species('pukurin', 'プクリン', 'skill'),

  // コダック系統: スキル型
  species('kodack', 'コダック', 'skill'),
  species('golduck', 'ゴルダック', 'skill'),

  // ケーシィ系統: スキル型
  species('casey', 'ケーシィ', 'skill'),
  species('yungerer', 'ユンゲラー', 'skill'),
  species('foodin', 'フーディン', 'skill'),

  // ヒメグマ系統: 食材型
  species('himeguma', 'ヒメグマ', 'ingredient'),
  species('ringuma', 'リングマ', 'ingredient'),

  // カイロス: 食材型
  species('kailios', 'カイロス', 'ingredient'),

  // ヘラクロス: 食材型
  species('heracros', 'ヘラクロス', 'ingredient'),

  // カビゴン: オール型 (特化なし)
  species('kabigon', 'カビゴン', 'all'),
];
