import {
  isAdopted,
  MEDAL_LABELS,
  MEDAL_ORDER,
  SPECIALTY_LABELS,
  type MedalRank,
  type PokemonEntry,
  type SpecialtyType,
} from './types';

export type GroupBy = 'none' | 'medal' | 'specialty';

export interface GroupDef {
  key: string;
  label: string;
  color: string;
}

const MEDAL_COLOR: Record<MedalRank, string> = {
  none: '#9ca3af',
  bronze: '#c07a3e',
  silver: '#9aa3b0',
  gold: '#e5b93a',
};

const SPECIALTY_COLOR: Record<SpecialtyType, string> = {
  berry: '#ef7d7d',
  ingredient: '#6fa8f5',
  skill: '#b98af0',
  all: '#8b8b9a',
};

export const GROUP_DEFS: Record<GroupBy, GroupDef[]> = {
  none: [{ key: 'total', label: '件数', color: '#2f2761' }],
  medal: MEDAL_ORDER.map((m) => ({
    key: m,
    label: MEDAL_LABELS[m],
    color: MEDAL_COLOR[m],
  })),
  specialty: (['berry', 'ingredient', 'skill', 'all'] as SpecialtyType[]).map((s) => ({
    key: s,
    label: SPECIALTY_LABELS[s],
    color: SPECIALTY_COLOR[s],
  })),
};

function groupKeyOf(entry: PokemonEntry, groupBy: GroupBy): string {
  if (groupBy === 'medal') return entry.medal;
  if (groupBy === 'specialty') return entry.specialty;
  return 'total';
}

export interface SubSkillStatRow {
  skill: string;
  total: number;
  counts: Record<string, number>;
  percents: Record<string, number>;
}

/**
 * サブスキルごとの出現回数・割合を集計する。
 * 割合は「そのグループの対象ポケモン数のうち、そのサブスキルを保有していた割合」。
 */
export function computeSubSkillStats(
  entries: PokemonEntry[],
  subSkillUniverse: string[],
  groupBy: GroupBy
): { rows: SubSkillStatRow[]; groupTotals: Record<string, number> } {
  const groupTotals: Record<string, number> = {};
  for (const e of entries) {
    const gk = groupKeyOf(e, groupBy);
    groupTotals[gk] = (groupTotals[gk] ?? 0) + 1;
  }

  const skillNames = new Set(subSkillUniverse);
  for (const e of entries) {
    for (const s of e.subSkills) if (s.skill) skillNames.add(s.skill);
  }

  const table = new Map<string, Record<string, number>>();
  for (const name of skillNames) table.set(name, {});

  for (const e of entries) {
    const gk = groupKeyOf(e, groupBy);
    for (const s of e.subSkills) {
      if (!s.skill) continue;
      const rec = table.get(s.skill) ?? {};
      rec[gk] = (rec[gk] ?? 0) + 1;
      table.set(s.skill, rec);
    }
  }

  const rows: SubSkillStatRow[] = [...table.entries()]
    .map(([skill, counts]) => {
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const percents: Record<string, number> = {};
      for (const gk of Object.keys(groupTotals)) {
        const denom = groupTotals[gk] || 1;
        percents[gk] = Math.round(((counts[gk] ?? 0) / denom) * 1000) / 10;
      }
      return { skill, total, counts, percents };
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);

  return { rows, groupTotals };
}

export interface PatternStatRow {
  pattern: string;
  count: number;
  percent: number;
}

export function computePatternStats(entries: PokemonEntry[]): PatternStatRow[] {
  const withPattern = entries.filter((e) => e.ingredientPattern);
  const counts = new Map<string, number>();
  for (const e of withPattern) {
    counts.set(e.ingredientPattern, (counts.get(e.ingredientPattern) ?? 0) + 1);
  }
  const total = withPattern.length || 1;
  return [...counts.entries()]
    .map(([pattern, count]) => ({
      pattern,
      count,
      percent: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);
}

export interface DateCountRow {
  label: string; // 年次なら 'YYYY'、月次なら 'YYYY-MM'
  count: number;
}

/**
 * 採用(博士に送っていない)ポケモンの件数を、捕まえた日(caughtDate)の
 * 年/年月ごとに集計する。捕まえた日が未入力の記録は集計対象外。
 */
function computeAdoptionCounts(
  entries: PokemonEntry[],
  labelOf: (caughtDate: string) => string | null
): DateCountRow[] {
  const counts = new Map<string, number>();
  for (const e of entries) {
    if (!isAdopted(e)) continue;
    const label = labelOf(e.caughtDate);
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));
}

export function computeAdoptionCountsByYear(entries: PokemonEntry[]): DateCountRow[] {
  return computeAdoptionCounts(entries, (caughtDate) =>
    /^\d{4}-\d{2}-\d{2}$/.test(caughtDate) ? caughtDate.slice(0, 4) : null
  );
}

export function computeAdoptionCountsByMonth(entries: PokemonEntry[]): DateCountRow[] {
  return computeAdoptionCounts(entries, (caughtDate) =>
    /^\d{4}-\d{2}-\d{2}$/.test(caughtDate) ? caughtDate.slice(0, 7) : null
  );
}

// これまでの最長記録の初期値。アプリで記録を取り始める前からの
// 実際の記録(過去に54日間、新しい採用個体が見つからなかったことがある)を
// 元にした値。記録データから計算した最長日数がこれを上回った場合のみ更新する。
const INITIAL_LONGEST_ADOPTION_GAP_DAYS = 54;

function parseDateOnly(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function diffInDays(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

export interface AdoptionStreakStats {
  // 最後に採用個体を見つけた日から本日までの経過日数。
  // 記録が無い場合、または最後に見つけた日が本日の場合はnull。
  daysSinceLastAdopted: number | null;
  // これまでの最長記録(採用個体と次の採用個体の間隔のうち最大のもの)。
  // 記録データから計算した値と INITIAL_LONGEST_ADOPTION_GAP_DAYS の大きい方。
  longestGapDays: number;
}

/**
 * 「採用」ポケモンを最後に見つけてからの経過日数と、これまでの最長記録
 * (採用個体を見つける間隔として最も長かった日数)を計算する。
 * 捕まえた日(caughtDate)が入力されている採用済み記録のみが対象。
 */
export function computeAdoptionStreakStats(
  entries: PokemonEntry[],
  today: Date = new Date()
): AdoptionStreakStats {
  const dates = entries
    .filter((e) => isAdopted(e))
    .map((e) => parseDateOnly(e.caughtDate))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  let longestGapDays = INITIAL_LONGEST_ADOPTION_GAP_DAYS;
  for (let i = 1; i < dates.length; i++) {
    const gap = diffInDays(dates[i - 1], dates[i]);
    if (gap > longestGapDays) longestGapDays = gap;
  }

  if (dates.length === 0) {
    return { daysSinceLastAdopted: null, longestGapDays };
  }

  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const lastDate = dates[dates.length - 1];
  const daysSinceLastAdopted = diffInDays(lastDate, todayOnly);
  if (daysSinceLastAdopted > longestGapDays) longestGapDays = daysSinceLastAdopted;

  return {
    daysSinceLastAdopted: daysSinceLastAdopted > 0 ? daysSinceLastAdopted : null,
    longestGapDays,
  };
}
