'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEntries } from '@/lib/hooks';
import { MedalBadge, SpecialtyBadge } from '@/components/Badges';
import {
  MEDAL_LABELS,
  MEDAL_ORDER,
  SPECIALTY_LABELS,
  SUBSKILL_LEVELS,
  type MedalRank,
  type PokemonEntry,
  type SpecialtyType,
} from '@/lib/types';
import { entriesToCsv } from '@/lib/csv';

function subSkillAt(entry: PokemonEntry, level: number): string {
  return entry.subSkills.find((s) => s.level === level)?.skill ?? '';
}

export default function PokemonListPage() {
  const entries = useEntries();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [medalFilter, setMedalFilter] = useState<MedalRank | 'all'>('all');
  const [specialtyFilter, setSpecialtyFilter] = useState<SpecialtyType | 'all'>('all');

  const filtered = useMemo(() => {
    return entries
      .filter((e) => {
        if (medalFilter !== 'all' && e.medal !== medalFilter) return false;
        if (specialtyFilter !== 'all' && e.specialty !== specialtyFilter) return false;
        if (q && !e.speciesName.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        // 捕まえた日の降順(新しい順)。未入力は末尾にまとめる。
        if (!a.caughtDate && !b.caughtDate) return 0;
        if (!a.caughtDate) return 1;
        if (!b.caughtDate) return -1;
        return b.caughtDate.localeCompare(a.caughtDate);
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
        <p className="card p-8 text-center text-sm text-black/40">記録がありません。</p>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[1180px] border-collapse text-sm">
            <thead>
              <tr className="sticky top-0 z-10 bg-brand-night text-left text-xs text-white/80">
                <th className="whitespace-nowrap px-3 py-2 font-medium">#</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">名前</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Lv</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">タイプ</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">メダル</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">パターン</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Lv10</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Lv25</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Lv50</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Lv70</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">Lv80</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">食材1</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">食材2</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">食材3</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">性格</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">採用</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">捕まえた日</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr
                  key={e.id}
                  onClick={() => router.push(`/pokemon/${e.id}`)}
                  className={`cursor-pointer border-t border-black/5 transition hover:bg-brand-accent/10 ${
                    i % 2 === 1 ? 'bg-black/[0.02]' : ''
                  }`}
                >
                  <td className="whitespace-nowrap px-3 py-2 text-black/40">{i + 1}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-bold text-brand-night-dark">
                    {e.speciesName || '(名前未設定)'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{e.level}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <SpecialtyBadge specialty={e.specialty} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <MedalBadge medal={e.medal} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {e.ingredientPattern && (
                      <span className="chip bg-brand-accent/15 text-brand-accent-dark">
                        {e.ingredientPattern}
                      </span>
                    )}
                  </td>
                  {SUBSKILL_LEVELS.map((lv) => (
                    <td key={lv} className="whitespace-nowrap px-3 py-2 text-black/70">
                      {subSkillAt(e, lv) || '-'}
                    </td>
                  ))}
                  {([0, 1, 2] as const).map((idx) => (
                    <td key={idx} className="whitespace-nowrap px-3 py-2 text-black/70">
                      {e.ingredients[idx] || '-'}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-2 text-black/70">{e.nature || '-'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-black/70">
                    {e.adopted === false ? '未採用' : '採用'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-black/70">
                    {e.caughtDate || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
