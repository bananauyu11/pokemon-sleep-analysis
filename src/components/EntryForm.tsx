'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  isAdopted,
  MEDAL_LABELS,
  MEDAL_ORDER,
  SPECIALTY_LABELS,
  SUBSKILL_LEVELS,
  type MedalRank,
  type PokemonEntry,
  type SpecialtyType,
} from '@/lib/types';
import { NATURES } from '@/lib/natures';
import { computeIngredientPattern } from '@/lib/ingredient-pattern';
import { useIngredientSuggestions, useSpeciesList, useSubSkillNames } from '@/lib/hooks';
import { ingredientCandidatesForSlot } from '@/lib/species-data';
import type { IconCropResult } from '@/lib/icon-match';
import IngredientIconPicker from './IngredientIconPicker';

interface EntryFormProps {
  initial: PokemonEntry;
  onSave: (entry: PokemonEntry) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  saveLabel?: string;
  /** 画像取込から渡される、食材スロットごとの切り出し画像(あれば表示) */
  ingredientCrops?: (IconCropResult | null)[];
}

export default function EntryForm({
  initial,
  onSave,
  onDelete,
  saveLabel = '保存する',
  ingredientCrops,
}: EntryFormProps) {
  const router = useRouter();
  const speciesList = useSpeciesList();
  const subSkillNames = useSubSkillNames();
  const ingredientSuggestions = useIngredientSuggestions();

  const [entry, setEntry] = useState<PokemonEntry>(initial);
  const [saving, setSaving] = useState(false);
  const [openPickerSlot, setOpenPickerSlot] = useState<number | null>(null);

  const matchedSpecies = useMemo(
    () => speciesList.find((s) => s.name === entry.speciesName),
    [speciesList, entry.speciesName]
  );

  const pattern = useMemo(
    () => computeIngredientPattern(entry.ingredients),
    [entry.ingredients]
  );

  // スロットごとの入力候補: 選択中のポケモン(種族マスタ)で判明している
  // 候補を優先的に表示し、それ以外の候補(他のポケモンで使われている食材名)も
  // 補足として続ける。食材の抽選は手前のスロットの候補も引き継ぐため
  // (例: 3番目のスロットには1・2番目の食材も出ることがある)、
  // 候補はスロット0〜iの和集合で計算する。
  function slotIngredientSuggestions(i: 0 | 1 | 2): string[] {
    const known = ingredientCandidatesForSlot(matchedSpecies, i);
    const rest = ingredientSuggestions.filter((s) => !known.includes(s));
    return [...known, ...rest];
  }

  function handleSpeciesChange(name: string) {
    const found = speciesList.find((s) => s.name === name);
    setEntry((prev) => ({
      ...prev,
      speciesName: name,
      speciesId: found?.id ?? '',
      specialty: found?.specialty ?? prev.specialty,
      berry: found?.berry || prev.berry,
      // 食材はスロットごとに複数候補からランダムに決まる(個体差がある)ため、
      // ここでは自動入力しない。種族マスタの候補はあくまで入力補助
      // (オートコンプリート)として使う。
    }));
  }

  function updateSubSkill(level: number, skill: string) {
    setEntry((prev) => ({
      ...prev,
      subSkills: prev.subSkills.map((s) => (s.level === level ? { ...s, skill } : s)),
    }));
  }

  function updateIngredient(index: 0 | 1 | 2, value: string) {
    setEntry((prev) => {
      const next = [...prev.ingredients] as [string, string, string];
      next[index] = value;
      return { ...prev, ingredients: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const now = new Date().toISOString();
      await onSave({
        ...entry,
        ingredientPattern: pattern,
        updatedAt: now,
      });
      router.push('/pokemon');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-6 p-5">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">ポケモンの名前</label>
          <input
            list="species-names"
            className="field-input"
            value={entry.speciesName}
            onChange={(e) => handleSpeciesChange(e.target.value)}
            placeholder="例: ゼニガメ"
            required
          />
          <datalist id="species-names">
            {speciesList.map((s) => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>
          {!matchedSpecies && entry.speciesName && (
            <p className="mt-1 text-xs text-amber-600">
              種族マスタ未登録のため自動入力されません。タイプ・きのみ・食材は下記で手動入力してください。
            </p>
          )}
        </div>

        <div>
          <label className="field-label">レベル</label>
          <input
            type="number"
            min={1}
            max={100}
            className="field-input"
            value={entry.level}
            onChange={(e) =>
              setEntry((p) => ({ ...p, level: Number(e.target.value) || 1 }))
            }
            required
          />
        </div>

        <div>
          <label className="field-label">タイプ(きのみ/食材/スキル)</label>
          <select
            className="field-select"
            value={entry.specialty}
            onChange={(e) =>
              setEntry((p) => ({ ...p, specialty: e.target.value as SpecialtyType }))
            }
          >
            {(Object.keys(SPECIALTY_LABELS) as SpecialtyType[]).map((k) => (
              <option key={k} value={k}>
                {SPECIALTY_LABELS[k]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-black/40">
            種族マスタに登録済みなら名前から自動入力されます。
          </p>
        </div>

        <div>
          <label className="field-label">きのみ</label>
          <input
            className="field-input"
            value={entry.berry}
            onChange={(e) => setEntry((p) => ({ ...p, berry: e.target.value }))}
            placeholder="例: きんのみ"
          />
        </div>

        <div>
          <label className="field-label">性格</label>
          <select
            className="field-select"
            value={entry.nature}
            onChange={(e) => setEntry((p) => ({ ...p, nature: e.target.value }))}
          >
            <option value="">未設定</option>
            {NATURES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label">メダル状況</label>
          <select
            className="field-select"
            value={entry.medal}
            onChange={(e) =>
              setEntry((p) => ({ ...p, medal: e.target.value as MedalRank }))
            }
          >
            {MEDAL_ORDER.map((m) => (
              <option key={m} value={m}>
                {MEDAL_LABELS[m]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label">採用状況</label>
          <div className="flex items-center gap-4 pt-2 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="adopted"
                checked={isAdopted(entry)}
                onChange={() => setEntry((p) => ({ ...p, adopted: true }))}
              />
              採用
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="adopted"
                checked={!isAdopted(entry)}
                onChange={() => setEntry((p) => ({ ...p, adopted: false }))}
              />
              未採用(博士に送った)
            </label>
          </div>
        </div>

        <div>
          <label className="field-label">捕まえた日</label>
          <input
            type="date"
            className="field-input"
            value={entry.caughtDate}
            onChange={(e) => setEntry((p) => ({ ...p, caughtDate: e.target.value }))}
          />
        </div>

        <div>
          <label className="field-label">画像上の時刻(任意)</label>
          <input
            type="time"
            className="field-input"
            value={entry.capturedTime}
            onChange={(e) => setEntry((p) => ({ ...p, capturedTime: e.target.value }))}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-bold text-brand-night-dark">
          サブスキル(レベル解放時に取得したもの)
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SUBSKILL_LEVELS.map((level) => {
            const current =
              entry.subSkills.find((s) => s.level === level)?.skill ?? '';
            return (
              <div key={level}>
                <label className="field-label">Lv.{level}</label>
                <select
                  className="field-select"
                  value={current}
                  onChange={(e) => updateSubSkill(level, e.target.value)}
                >
                  <option value="">未取得</option>
                  {subSkillNames.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-brand-night-dark">
          食材配列
          {pattern && <span className="chip bg-brand-accent/20 text-brand-accent-dark">パターン: {pattern}</span>}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {([0, 1, 2] as const).map((i) => {
            const known = ingredientCandidatesForSlot(matchedSpecies, i);
            const crop = ingredientCrops?.[i];
            return (
              <div key={i}>
                <label className="field-label">食材{i + 1}</label>
                {crop && (
                  <div className="mb-1 flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element -- small cropped preview from canvas dataURL */}
                    <img
                      src={crop.previewUrl}
                      alt={`食材${i + 1}の切り出し画像`}
                      className="h-14 w-14 rounded-lg border border-black/10 object-cover"
                    />
                    <button
                      type="button"
                      className="btn-ghost px-2 py-1 text-xs"
                      onClick={() =>
                        setOpenPickerSlot((prev) => (prev === i ? null : i))
                      }
                    >
                      {openPickerSlot === i ? '閉じる' : 'アイコンから選ぶ'}
                    </button>
                  </div>
                )}
                {crop && openPickerSlot === i && (
                  <div className="mb-2">
                    <IngredientIconPicker
                      hintName={crop.best?.name}
                      candidateNames={known}
                      onSelect={(name) => {
                        updateIngredient(i, name);
                        setOpenPickerSlot(null);
                      }}
                    />
                    <p className="mt-1 text-[11px] text-black/40">
                      自動判定は精度が低いため参考程度です。上の切り出し画像を見て、実際のアイコンと同じものを選んでください。
                    </p>
                  </div>
                )}
                <input
                  list={`ingredient-names-${i}`}
                  className="field-input"
                  value={entry.ingredients[i]}
                  onChange={(e) => updateIngredient(i, e.target.value)}
                  placeholder="食材名"
                />
                <datalist id={`ingredient-names-${i}`}>
                  {slotIngredientSuggestions(i).map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
                {known.length > 0 && (
                  <p className="mt-1 text-[11px] text-black/40">候補: {known.join(' / ')}</p>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-black/40">
          同じ食材が3つ→AAA、2つ→AAB、すべて異なる→ABC を自動判定します。
        </p>
      </section>

      {entry.imageFileName && (
        <p className="text-xs text-black/40">元画像: {entry.imageFileName}</p>
      )}

      <div className="flex items-center justify-between gap-2">
        {onDelete ? (
          <button
            type="button"
            className="btn-danger"
            onClick={async () => {
              if (confirm('この記録を削除しますか?')) {
                await onDelete();
                router.push('/pokemon');
              }
            }}
          >
            削除
          </button>
        ) : (
          <span />
        )}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? '保存中...' : saveLabel}
        </button>
      </div>
    </form>
  );
}
