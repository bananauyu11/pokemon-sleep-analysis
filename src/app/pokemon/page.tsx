'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useEntries } from '@/lib/hooks';
import { MedalBadge, SpecialtyBadge } from '@/components/Badges';
import { MEDAL_LABELS, MEDAL_ORDER, SPECIALTY_LABELS, type MedalRank, type SpecialtyType } from '@/lib/types';
import { entriesToCsv } from '@/lib/csv';

export default function PokemonListPage() {
  const entries = useEntries();
  const [q, setQ] = useState('');
  const [medalFilter, setMedalFilter] = useState<MedalRank | 'all'>('all');
  const [specialtyFilter, setSpecialtyFilter] = useState<SpecialtyType | 'all'>('all');

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (medalFilter !== 'all' && e.medal !== medalFilter) return false;
      if (specialtyFilter !== 'all' && e.specialty !== specialtyFilter) return false;
      if (q && !e.speciesName.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [entries, medalFilter, specialtyFilter, q]);

  function handleExport() {
    const csv = entriesToCsv(entries);
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pokesleep-records-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-brand-night-dark">記録一覧 ({entries.length}件)</h1>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={handleExport}>
            CSVエクスポート
          </button>
        </div>
      </div>

      <div className="card flex flex-wrap gap-3 p-4">
        <input
          className="field-input max-w-xs"
          placeholder="名前で検索"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="field-select w-auto"
          value={medalFilter}
          onChange={(e) => setMedalFilter(e.target.value as MedalRank | 'all')}
        >
          <option value="all">メダル: すべて</option>
          {MEDAL_ORDER.map((m) => (
            <option key={m} value={m}>
              メダル: {MEDAL_LABELS[m]}
            </option>
          ))}
        </select>
        <select
          className="field-select w-auto"
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value as SpecialtyType | 'all')}
        >
          <option value="all">タイプ: すべて</option>
          {(Object.keys(SPECIALTY_LABELS) as SpecialtyType[]).map((k) => (
            <option key={k} value={k}>
              タイプ: {SPECIALTY_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="card p-8 text-center text-sm text-black/40">
          記録がありません。「取込」から登録してください。
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <Link
              key={e.id}
              href={`/pokemon/${e.id}`}
              className="card flex flex-col gap-2 p-4 transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-brand-night-dark">
                  {e.speciesName || '(名前未設定)'}
                </span>
                <span className="text-xs text-black/40">Lv.{e.level}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <SpecialtyBadge specialty={e.specialty} />
                <MedalBadge medal={e.medal} />
                {e.ingredientPattern && (
                  <span className="chip bg-brand-accent/15 text-brand-accent-dark">
                    {e.ingredientPattern}
                  </span>
                )}
              </div>
              <div className="text-xs text-black/50">
                {e.subSkills.filter((s) => s.skill).length > 0
                  ? e.subSkills
                      .filter((s) => s.skill)
                      .map((s) => `Lv${s.level}:${s.skill}`)
                      .join(' / ')
                  : 'サブスキル未記録'}
              </div>
              <div className="text-xs text-black/40">
                {e.caughtDate || '捕獲日未記録'} {e.nature && `・${e.nature}`}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
