import {
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
