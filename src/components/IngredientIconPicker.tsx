'use client';

import { INGREDIENT_ICONS, ingredientIconUrl } from '@/lib/ingredients';

interface IngredientIconPickerProps {
  /** 自動判別で一番近いと判定された候補(参考表示のみ、確定はしない) */
  hintName?: string | null;
  onSelect: (name: string) => void;
}

/**
 * 19種類の食材アイコンを一覧表示し、クリックで選択できるピッカー。
 * 画像だけからの自動判定は精度が低いため、最終的な判断はユーザーの
 * 目視に委ねる前提のUI。
 */
export default function IngredientIconPicker({
  hintName,
  onSelect,
}: IngredientIconPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-1 rounded-lg border border-black/10 bg-white p-2 sm:grid-cols-10">
      {INGREDIENT_ICONS.map((ing) => (
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
  );
}
