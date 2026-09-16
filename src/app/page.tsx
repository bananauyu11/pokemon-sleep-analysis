'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useEntries, useSubSkillNames } from '@/lib/hooks';
import {
  GROUP_DEFS,
  computeAdoptionCountsByMonth,
  computeAdoptionCountsByYear,
  computeAdoptionStreakStats,
  computePatternStats,
  computeSubSkillStats,
  type GroupBy,
} from '@/lib/analysis';
import GroupedBarChart from '@/components/charts/GroupedBarChart';
import {
  MEDAL_LABELS,
  MEDAL_ORDER,
  SPECIALTY_LABELS,
  type MedalRank,
  type SpecialtyType,
} from '@/lib/types';

type ValueMode = 'count' | 'percent';

export default function DashboardPage() {
  const entries = useEntries();
  const subSkillNames = useSubSkillNames();

  const [groupBy, setGroupBy] = useState<GroupBy>('medal');
  const [mode, setMode] = useState<ValueMode>('count');
  const [specialtyFilter, setSpecialtyFilter] = useState<SpecialtyType | 'all'>('all');
  const [medalFilter, setMedalFilter] = useState<MedalRank | 'all'>('all');

  const filteredEntries = useMemo(
    () =>
      entries.filter((e) => {
        if (specialtyFilter !== 'all' && e.specialty !== specialtyFilter) return false;
        if (medalFilter !== 'all' && e.medal !== medalFilter) return false;
        return true;
      }),
    [entries, specialtyFilter, medalFilter]
  );

  const { rows, groupTotals } = useMemo(
    () => computeSubSkillStats(filteredEntries, subSkillNames, groupBy),
    [filteredEntries, subSkillNames, groupBy]
  );

  const groups = GROUP_DEFS[groupBy];

  const chartData = useMemo(
    () =>
      rows.map((r) => {
        const row: Record<string, string | number> = { skill: r.skill };
        for (const g of groups) {
          row[g.key] = mode === 'count' ? r.counts[g.key] ?? 0 : r.percents[g.key] ?? 0;
        }
        return row;
      }),
    [rows, groups, mode]
  );

  const patternStats = useMemo(() => computePatternStats(filteredEntries), [
    filteredEntries,
  ]);
  const patternChartData = useMemo(
    () =>
      patternStats.map((p) => ({
        pattern: p.pattern,
        件数: mode === 'count' ? p.count : p.percent,
      })),
    [patternStats, mode]
  );

  const adoptionByYear = useMemo(
    () => computeAdoptionCountsByYear(filteredEntries),
    [filteredEntries]
  );
  const adoptionByYearChartData = useMemo(
    () => adoptionByYear.map((r) => ({ label: r.label, 件数: r.count })),
    [adoptionByYear]
  );
  const adoptionByMonth = useMemo(
    () => computeAdoptionCountsByMonth(filteredEntries),
    [filteredEntries]
  );
  const adoptionByMonthChartData = useMemo(
    () => adoptionByMonth.map((r) => ({ label: r.label, 件数: r.count })),
    [adoptionByMonth]
  );

  // フィルタとは無関係に、全記録から見た採用の間隔なので entries(全件)を使う
  const streakStats = useMemo(() => computeAdoptionStreakStats(entries), [entries]);

  if (entries.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <p className="text-lg font-bold text-brand-night-dark">まだ記録がありません</p>
        <p className="text-sm text-black/50">
          「手動追加」でポケモンを登録するか、「取込」からスクリーンショットやCSVを読み込んでください。
        </p>
        <div className="mt-2 flex gap-2">
          <Link href="/pokemon/new" className="btn-accent">
            手動追加する
          </Link>
          <Link href="/import" className="btn-ghost">
            取込画面へ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-3">
        {streakStats.daysSinceLastAdopted !== null && (
          <div className="card flex flex-1 min-w-[140px] flex-col gap-1 p-3">
            <span className="text-xs text-black/40">前回の採用から</span>
            <span className="text-lg font-bold text-brand-night-dark">
              {streakStats.daysSinceLastAdopted}日
            </span>
          </div>
        )}
        <div className="card flex flex-1 min-w-[140px] flex-col gap-1 p-3">
          <span className="text-xs text-black/40">最長記録</span>
          <span className="text-lg font-bold text-brand-night-dark">
            {streakStats.longestGapDays}日
          </span>
        </div>
      </div>

      <div className="card flex flex-col gap-3 p-4">
        <h2 className="text-sm font-bold text-brand-night-dark">分析の絞り込み</h2>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm">
            グループ化:
            <select
              className="field-select w-auto"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            >
              <option value="medal">メダル状況</option>
              <option value="specialty">きのみ/食材/スキル</option>
              <option value="none">なし(合計のみ)</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            表示:
            <select
              className="field-select w-auto"
              value={mode}
              onChange={(e) => setMode(e.target.value as ValueMode)}
            >
              <option value="count">回数</option>
              <option value="percent">割合(%)</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            タイプで絞り込み:
            <select
              className="field-select w-auto"
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value as SpecialtyType | 'all')}
            >
              <option value="all">すべて</option>
              {(Object.keys(SPECIALTY_LABELS) as SpecialtyType[]).map((s) => (
                <option key={s} value={s}>
                  {SPECIALTY_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            メダルで絞り込み:
            <select
              className="field-select w-auto"
              value={medalFilter}
              onChange={(e) => setMedalFilter(e.target.value as MedalRank | 'all')}
            >
              <option value="all">すべて</option>
              {MEDAL_ORDER.map((m) => (
                <option key={m} value={m}>
                  {MEDAL_LABELS[m]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-xs text-black/40">
          対象: {filteredEntries.length}件
          {groupBy !== 'none' &&
            ` / グループ内訳: ${groups
              .map((g) => `${g.label} ${groupTotals[g.key] ?? 0}件`)
              .join(', ')}`}
        </p>
      </div>

      <div className="card p-4">
        <h2 className="mb-3 text-sm font-bold text-brand-night-dark">
          サブスキル別 {mode === 'count' ? '出現回数' : '保有割合'}
        </h2>
        <GroupedBarChart
          data={chartData}
          groups={groups}
          categoryKey="skill"
          valueSuffix={mode === 'percent' ? '%' : ''}
        />
      </div>

      <div className="card p-4">
        <h2 className="mb-3 text-sm font-bold text-brand-night-dark">
          食材配列パターン ({mode === 'count' ? '件数' : '割合(%)'})
        </h2>
        <GroupedBarChart
          data={patternChartData}
          groups={[{ key: '件数', label: '件数', color: '#46c2a4' }]}
          categoryKey="pattern"
          valueSuffix={mode === 'percent' ? '%' : ''}
          height={200}
        />
      </div>

      <div className="card p-4">
        <h2 className="mb-3 text-sm font-bold text-brand-night-dark">
          採用件数(年次) ※未採用(博士に送った)を除く、捕まえた日が未入力のものは対象外
        </h2>
        <GroupedBarChart
          data={adoptionByYearChartData}
          groups={[{ key: '件数', label: '件数', color: '#2f2761' }]}
          categoryKey="label"
          height={Math.max(160, adoptionByYearChartData.length * 40 + 60)}
        />
      </div>

      <div className="card p-4">
        <h2 className="mb-3 text-sm font-bold text-brand-night-dark">
          採用件数(月次) ※未採用(博士に送った)を除く、捕まえた日が未入力のものは対象外
        </h2>
        <GroupedBarChart
          data={adoptionByMonthChartData}
          groups={[{ key: '件数', label: '件数', color: '#46c2a4' }]}
          categoryKey="label"
          height={Math.max(200, adoptionByMonthChartData.length * 32 + 60)}
        />
      </div>
    </div>
  );
}
