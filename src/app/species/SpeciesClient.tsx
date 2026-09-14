'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/db';
import { useSpeciesList, useSubSkillNames } from '@/lib/hooks';
import { SPECIALTY_LABELS, type PokemonSpecies, type SpecialtyType } from '@/lib/types';
import { parseSpeciesCsv, speciesToCsv } from '@/lib/csv';
import { DEFAULT_SPECIES } from '@/lib/species-data';

function slugify(name: string): string {
  return `sp-${name}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function SpeciesClient() {
  const speciesList = useSpeciesList();
  const subSkillNames = useSubSkillNames();
  const searchParams = useSearchParams();
  const prefillName = searchParams.get('add') ?? '';

  const [newSpecies, setNewSpecies] = useState<Partial<PokemonSpecies>>({
    name: prefillName,
    specialty: 'berry',
    berry: '',
    mainSkill: '',
  });
  const [newSkill, setNewSkill] = useState('');
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

  const sortedSpecies = useMemo(
    () => [...speciesList].sort((a, b) => a.name.localeCompare(b.name, 'ja')),
    [speciesList]
  );

  async function addSpecies() {
    if (!newSpecies.name) return;
    const sp: PokemonSpecies = {
      id: slugify(newSpecies.name),
      name: newSpecies.name,
      specialty: (newSpecies.specialty as SpecialtyType) ?? 'berry',
      berry: newSpecies.berry ?? '',
      mainSkill: newSpecies.mainSkill ?? '',
      ingredientOptions: [[], [], []],
    };
    await db.species.add(sp);
    setNewSpecies({ name: '', specialty: 'berry', berry: '', mainSkill: '' });
  }

  async function updateSpecies(sp: PokemonSpecies, patch: Partial<PokemonSpecies>) {
    await db.species.put({ ...sp, ...patch });
  }

  async function deleteSpecies(id: string) {
    if (confirm('この種族データを削除しますか?(既存の記録は影響を受けません)')) {
      await db.species.delete(id);
    }
  }

  async function addSkill() {
    if (!newSkill.trim()) return;
    await db.subskillMaster.put({ id: newSkill.trim(), name: newSkill.trim() });
    setNewSkill('');
  }

  async function deleteSkill(name: string) {
    await db.subskillMaster.delete(name);
  }

  function handleExportSpecies() {
    const csv = speciesToCsv(sortedSpecies);
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pokesleep-species.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportSpecies(file: File) {
    const text = await file.text();
    const { species, errors } = parseSpeciesCsv(text);
    setCsvErrors(errors);
    if (species.length > 0) {
      await db.species.bulkPut(species);
    }
  }

  async function handleResetToDefaults() {
    if (
      confirm(
        `アプリ内蔵の最新データ(${DEFAULT_SPECIES.length}種)を反映します。同じ名前の種族は上書きされます。手動で追加・編集した独自のポケモンはそのまま残ります。続けますか?`
      )
    ) {
      await db.species.bulkPut(DEFAULT_SPECIES);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold text-brand-night-dark">種族マスタ管理</h1>
        <p className="mt-1 text-xs text-black/50">
          ポケモンごとの「きのみ/食材/スキル」タイプ・きのみ・メインスキル・食材は、
          ポケモンスリープ攻略・検証Wikiの情報をもとに登録しています(全247種)。
          誤りやアップデートによる変更があればここで修正してください。
        </p>
      </div>

      <div className="card flex flex-col gap-3 p-4">
        <h2 className="text-sm font-bold text-brand-night-dark">種族を追加</h2>
        <div className="flex flex-wrap gap-2">
          <input
            className="field-input max-w-[10rem]"
            placeholder="名前"
            value={newSpecies.name ?? ''}
            onChange={(e) => setNewSpecies((p) => ({ ...p, name: e.target.value }))}
          />
          <select
            className="field-select w-auto"
            value={newSpecies.specialty ?? 'berry'}
            onChange={(e) =>
              setNewSpecies((p) => ({ ...p, specialty: e.target.value as SpecialtyType }))
            }
          >
            {(Object.keys(SPECIALTY_LABELS) as SpecialtyType[]).map((k) => (
              <option key={k} value={k}>
                {SPECIALTY_LABELS[k]}
              </option>
            ))}
          </select>
          <input
            className="field-input max-w-[8rem]"
            placeholder="きのみ"
            value={newSpecies.berry ?? ''}
            onChange={(e) => setNewSpecies((p) => ({ ...p, berry: e.target.value }))}
          />
          <input
            className="field-input max-w-[10rem]"
            placeholder="メインスキル"
            value={newSpecies.mainSkill ?? ''}
            onChange={(e) => setNewSpecies((p) => ({ ...p, mainSkill: e.target.value }))}
          />
          <button className="btn-accent" onClick={addSpecies}>
            追加
          </button>
        </div>
      </div>

      <div className="card overflow-x-auto p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-brand-night-dark">
            登録済み種族 ({sortedSpecies.length}件)
          </h2>
          <div className="flex gap-2">
            <button className="btn-accent" onClick={handleResetToDefaults}>
              最新データを反映
            </button>
            <button className="btn-ghost" onClick={handleExportSpecies}>
              CSV出力
            </button>
            <label className="btn-ghost cursor-pointer">
              CSV取込
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImportSpecies(f);
                }}
              />
            </label>
          </div>
        </div>
        {csvErrors.length > 0 && (
          <ul className="mb-2 list-disc pl-5 text-xs text-red-600">
            {csvErrors.slice(0, 5).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs text-black/40">
              <th className="py-2 pr-2">名前</th>
              <th className="py-2 pr-2">タイプ</th>
              <th className="py-2 pr-2">きのみ</th>
              <th className="py-2 pr-2">メインスキル</th>
              <th className="py-2 pr-2" />
            </tr>
          </thead>
          <tbody>
            {sortedSpecies.map((sp) => (
              <tr key={sp.id} className="border-b border-black/5">
                <td className="py-1.5 pr-2 font-medium">{sp.name}</td>
                <td className="py-1.5 pr-2">
                  <select
                    className="field-select w-auto py-1"
                    value={sp.specialty}
                    onChange={(e) =>
                      updateSpecies(sp, { specialty: e.target.value as SpecialtyType })
                    }
                  >
                    {(Object.keys(SPECIALTY_LABELS) as SpecialtyType[]).map((k) => (
                      <option key={k} value={k}>
                        {SPECIALTY_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    className="field-input py-1"
                    defaultValue={sp.berry}
                    onBlur={(e) => updateSpecies(sp, { berry: e.target.value })}
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    className="field-input py-1"
                    defaultValue={sp.mainSkill}
                    onBlur={(e) => updateSpecies(sp, { mainSkill: e.target.value })}
                  />
                </td>
                <td className="py-1.5 text-right">
                  <button
                    className="text-xs text-red-500 hover:underline"
                    onClick={() => deleteSpecies(sp.id)}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card flex flex-col gap-3 p-4">
        <h2 className="text-sm font-bold text-brand-night-dark">サブスキル一覧</h2>
        <div className="flex gap-2">
          <input
            className="field-input max-w-xs"
            placeholder="新しいサブスキル名"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
          />
          <button className="btn-accent" onClick={addSkill}>
            追加
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {subSkillNames.map((name) => (
            <span key={name} className="chip flex items-center gap-1.5 bg-black/5">
              {name}
              <button
                className="text-black/40 hover:text-red-500"
                onClick={() => deleteSkill(name)}
                aria-label={`${name}を削除`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
