import type { IngredientPattern, PokemonSpecies } from './types';

/**
 * 選択された3つの食材名から配置パターンを自動計算する。
 *
 * パターンは「その食材が種族の何番目のスロットの候補か」で決まる
 * (スロット1の候補=A、スロット2の候補=B、スロット3の候補=C)。
 * 食材の抽選は手前のスロットの候補も引き継ぐため(スロット2にはAかBが、
 * スロット3にはA・B・Cのいずれかが出ることがある)、実際に起こり得るのは
 * 次の6パターンのみ:
 *   AAA(全てA)、AAB(1,2がA・3がB)、AAC(1,2がA・3がC)、
 *   ABA(1,3がA・2がB)、ABB(2,3がB)、ABC(全て異なる)。
 *
 * ポケモンマスタでスロットごとの候補食材名が判明していないと判定できないため、
 * 種族が未指定、または各食材がどのスロットの候補とも一致しない場合は
 * 空文字(判定不能)を返す。未入力のスロットがある場合も同様。
 */
export function computeIngredientPattern(
  ingredients: [string, string, string],
  species?: Pick<PokemonSpecies, 'ingredientOptions'> | null
): IngredientPattern {
  const [a, b, c] = ingredients;
  if (!a || !b || !c) return '';
  if (!species) return '';
  const tiers = species.ingredientOptions;

  function tierLetter(name: string): string | null {
    const idx = [0, 1, 2].findIndex((i) => tiers[i]?.includes(name));
    return idx >= 0 ? 'ABC'[idx] : null;
  }

  const letters = [tierLetter(a), tierLetter(b), tierLetter(c)];
  if (letters.some((l) => l === null)) return '';
  return letters.join('') as IngredientPattern;
}
