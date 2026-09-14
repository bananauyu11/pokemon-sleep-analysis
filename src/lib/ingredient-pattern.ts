import type { IngredientPattern } from './types';

/**
 * 選択された3つの食材名から配置パターン(AAA/AAB/ABC)を自動計算する。
 * 同じ食材が3つ揃えば AAA、2つ揃えば AAB、全て異なれば ABC。
 * 未入力のスロットがあれば計算不能として空文字を返す。
 */
export function computeIngredientPattern(
  ingredients: [string, string, string]
): IngredientPattern {
  const [a, b, c] = ingredients;
  if (!a || !b || !c) return '';

  const counts = new Map<string, number>();
  for (const ing of [a, b, c]) {
    counts.set(ing, (counts.get(ing) ?? 0) + 1);
  }
  const sizes = [...counts.values()].sort((x, y) => y - x);

  if (sizes[0] === 3) return 'AAA';
  if (sizes[0] === 2) return 'AAB';
  return 'ABC';
}
