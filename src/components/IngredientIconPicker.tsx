'use client';

import { INGREDIENT_ICONS, ingredientIconUrl } from '@/lib/ingredients';

interface IngredientIconPickerProps {
  /** 自動判別で一番近いと判定された候補(参考表示のみ、確定はしない) */
  hintName?: string | null;
  /**
   * 種族マスタで判明している、このスロットであり得る食材名の一覧。
   * 指定があれば表示する一覧をこれらに絞り込む(未指定・空の場合は
   * 19種類すべてを表示する)。
   */
  candidateNames?: string[];
  onSelect: (name: string) => void;
}

/**
 * 食材アイコンを一覧表示し、クリックで選択できるピッカー。
 * `candidateNames` が指定されていれば、そのポケモンであり得る食材だけに
 * 絞り込んで表示する(判明していなければ19種類全体を表示)。
 * 画像だけからの自動判定は精度が低いため、最終的な判断はユーザーの
 * 目視に委ねる前提のUI。
 */
export default function IngredientIconPicker({
  hintName,
  candidateNames,
  onSelect,
}: IngredientIconPickerProps) {
  const icons =
    candidateNames && candidateNames.length > 0
      ? INGREDIENT_ICONS.filter((ing) => candidateNames.includes(ing.name))
      : INGREDIENT_ICONS;
  const narrowed = icons.length < INGREDIENT_ICONS.length;

  return (
    <div>
      {narrowed && (
        <p className="mb-1 text-[11px] text-black/40">
          このポケモンであり得る食材({icons.length}種類)に絞り込んで表示しています。
        </p>
      )}
      <div className="grid grid-cols-6 gap-1 rounded-lg border border-black/10 bg-white p-2 sm:grid-cols-10">
        {icons.map((ing) => (
          <button
            key={ing.id}
            type="button"
            title={ing.name}
            onClick={() => onSelect(ing.name)}
            className={`flex flex-col items-center rounded-md p-0.5 transition hover:bg-brand-accent/20 ${
              hintName === ing.name ? 'ring-2 ring-brand-accent' : ''
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- small static icon set, next/image overhead not worth it */}
            <img src={ingredientIconUrl(ing.id)} alt={ing.name} className="h-8 w-8" />
          </button>
        ))}
      </div>
    </div>
  );
}
