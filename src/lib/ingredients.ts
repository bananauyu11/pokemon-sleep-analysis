// 食材アイコン識別用マスタ。
//
// ユーザーが提供してくれた「食材アイコン対応表」画像(docs/ingredient-icons-reference.jpg)
// から切り出したアイコン(public/ingredient-icons/)と、対応する食材名の一覧。
// 画像取込(OCR)機能で、スクリーンショット内の食材アイコンをこの一覧と
// 見た目で照合し、食材名をベストエフォートで推定するために使う。
export interface IngredientIcon {
  id: string; // アイコンファイル名(拡張子なし)
  name: string; // 食材名(表示・保存に使う正式名)
}

export const INGREDIENT_ICONS: IngredientIcon[] = [
  { id: 'leek', name: 'ふといながねぎ' },
  { id: 'mushroom', name: 'あじわいキノコ' },
  { id: 'egg', name: 'とくせんエッグ' },
  { id: 'potato', name: 'ほっこりポテト' },
  { id: 'apple', name: 'とくせんリンゴ' },
  { id: 'herb', name: 'げきからハーブ' },
  { id: 'sausage', name: 'マメミート' },
  { id: 'milk', name: 'モーモーミルク' },
  { id: 'honey', name: 'あまいミツ' },
  { id: 'oil', name: 'ピュアなオイル' },
  { id: 'ginger', name: 'あったかジンジャー' },
  { id: 'tomato', name: 'あんみんトマト' },
  { id: 'cacao', name: 'リラックスカカオ' },
  { id: 'tail', name: 'おいしいシッポ' },
  { id: 'soybean', name: 'ワカクサ大豆' },
  { id: 'corn', name: 'ワカクサコーン' },
  { id: 'coffee', name: 'めざましコーヒー' },
  { id: 'pumpkin', name: 'ずっしりカボチャ' },
  { id: 'avocado', name: 'つやつやアボカド' },
];

export function ingredientIconUrl(id: string): string {
  return `/ingredient-icons/${id}.png`;
}
