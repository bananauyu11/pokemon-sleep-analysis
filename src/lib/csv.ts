import Papa from 'papaparse';
import type { MedalRank, PokemonEntry, SpecialtyType } from './types';
import { SUBSKILL_LEVELS, emptySubSkills } from './types';
import { computeIngredientPattern } from './ingredient-pattern';

export const ENTRY_CSV_HEADERS = [
  'id',
  'speciesName',
  'nickname',
  'level',
  'specialty',
  'berry',
  'mainSkill',
  'nature',
  'medal',
  'caughtDate',
  'capturedTime',
  ...SUBSKILL_LEVELS.map((lv) => `subSkillLv${lv}`),
  'ingredient1',
  'ingredient2',
  'ingredient3',
  'ingredientPattern',
  'imageFileName',
  'notes',
] as const;

function toCsvRow(e: PokemonEntry): Record<string, string> {
  const row: Record<string, string> = {
    id: e.id,
    speciesName: e.speciesName,
    nickname: e.nickname,
    level: String(e.level),
    specialty: e.specialty,
    berry: e.berry,
    mainSkill: e.mainSkill,
    nature: e.nature,
    medal: e.medal,
    caughtDate: e.caughtDate,
    capturedTime: e.capturedTime,
    ingredient1: e.ingredients[0] ?? '',
    ingredient2: e.ingredients[1] ?? '',
    ingredient3: e.ingredients[2] ?? '',
    ingredientPattern: e.ingredientPattern,
    imageFileName: e.imageFileName,
    notes: e.notes,
  };
  for (const lv of SUBSKILL_LEVELS) {
    const found = e.subSkills.find((s) => s.level === lv);
    row[`subSkillLv${lv}`] = found?.skill ?? '';
  }
  return row;
}

export function entriesToCsv(entries: PokemonEntry[]): string {
  const rows = entries.map(toCsvRow);
  return Papa.unparse({ fields: [...ENTRY_CSV_HEADERS], data: rows });
}

const MEDAL_VALUES: MedalRank[] = ['none', 'bronze', 'silver', 'gold'];
const SPECIALTY_VALUES: SpecialtyType[] = ['berry', 'ingredient', 'skill', 'all'];

function coerceMedal(v: string | undefined): MedalRank {
  const s = (v ?? '').trim();
  if ((MEDAL_VALUES as string[]).includes(s)) return s as MedalRank;
  const map: Record<string, MedalRank> = {
    なし: 'none',
    銅: 'bronze',
    銀: 'silver',
    金: 'gold',
  };
  return map[s] ?? 'none';
}

function coerceSpecialty(v: string | undefined): SpecialtyType {
  const s = (v ?? '').trim().replace(/型$/, '');
  if ((SPECIALTY_VALUES as string[]).includes(s)) return s as SpecialtyType;
  const map: Record<string, SpecialtyType> = {
    きのみ: 'berry',
    食材: 'ingredient',
    スキル: 'skill',
    オール: 'all',
    オールラウンド: 'all',
  };
  return map[s] ?? 'berry';
}

export interface CsvParseResult {
  entries: PokemonEntry[];
  errors: string[];
}

/**
 * ポケモン記録のCSVを取り込み、PokemonEntry配列に変換する。
 * ヘッダー名は entriesToCsv が出力する形式(または相当する日本語表記)を想定。
 */
export function parseEntriesCsv(csvText: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const errors: string[] = parsed.errors.map(
    (e) => `行${(e.row ?? 0) + 2}: ${e.message}`
  );

  const entries: PokemonEntry[] = parsed.data.map((row, idx) => {
    const now = new Date().toISOString();
    const ingredients: [string, string, string] = [
      (row.ingredient1 ?? '').trim(),
      (row.ingredient2 ?? '').trim(),
      (row.ingredient3 ?? '').trim(),
    ];
    const subSkills = emptySubSkills().map((s) => ({
      ...s,
      skill: (row[`subSkillLv${s.level}`] ?? '').trim(),
    }));

    const level = Number.parseInt(row.level ?? '', 10);
    if (!row.speciesName) {
      errors.push(`CSV行${idx + 2}: speciesNameが空です`);
    }

    return {
      id: row.id?.trim() || crypto.randomUUID(),
      speciesId: '',
      speciesName: (row.speciesName ?? '').trim(),
      nickname: (row.nickname ?? '').trim(),
      level: Number.isFinite(level) && level > 0 ? level : 1,
      nature: (row.nature ?? '').trim(),
      medal: coerceMedal(row.medal),
      caughtDate: (row.caughtDate ?? '').trim(),
      capturedTime: (row.capturedTime ?? '').trim(),
      subSkills,
      ingredients,
      ingredientPattern:
        (row.ingredientPattern as PokemonEntry['ingredientPattern']) ||
        computeIngredientPattern(ingredients),
      specialty: coerceSpecialty(row.specialty),
      berry: (row.berry ?? '').trim(),
      mainSkill: (row.mainSkill ?? '').trim(),
      imageFileName: (row.imageFileName ?? '').trim(),
      notes: (row.notes ?? '').trim(),
      createdAt: now,
      updatedAt: now,
    };
  });

  return { entries, errors };
}
