import Dexie, { type EntityTable } from 'dexie';
import type { PokemonEntry, PokemonSpecies } from './types';
import { DEFAULT_SPECIES } from './species-data';
import { DEFAULT_SUBSKILLS } from './subskills';
import { CHAT_IMPORTED_ENTRIES } from './chat-imports';
import { computeIngredientPattern } from './ingredient-pattern';

export interface SubSkillMasterRow {
  id: string; // = name (ユニークキー)
  name: string;
}

export interface AppliedImportRow {
  id: string; // = 取り込んだ PokemonEntry.id
}

class PokeSleepDB extends Dexie {
  entries!: EntityTable<PokemonEntry, 'id'>;
  species!: EntityTable<PokemonSpecies, 'id'>;
  subskillMaster!: EntityTable<SubSkillMasterRow, 'id'>;
  appliedImports!: EntityTable<AppliedImportRow, 'id'>;

  constructor() {
    super('pokesleep-analysis');
    this.version(1).stores({
      entries: 'id, speciesId, speciesName, medal, specialty, caughtDate, level',
      species: 'id, name, specialty',
      subskillMaster: 'id, name',
    });
    this.version(2).stores({
      entries: 'id, speciesId, speciesName, medal, specialty, caughtDate, level',
      species: 'id, name, specialty',
      subskillMaster: 'id, name',
      appliedImports: 'id',
    });
  }
}

export const db = new PokeSleepDB();

let seeded = false;

/**
 * ポケモンマスタ・サブスキル一覧はアプリ内に編集画面を持たず、コード
 * (species-data.ts / subskills.ts)側で管理する運用のため、起動のたびに
 * 常にコード内の最新内容で上書き同期する(ユーザーの記録データ=entriesは
 * 上書き同期の対象外)。
 * あわせて、チャットで登録依頼のあった記録(chat-imports.ts)を
 * 未適用のものだけ1回限りentriesに追加する(詳細はapplyChatImports参照)。
 */
export async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  seeded = true;

  await db.transaction('rw', db.species, db.subskillMaster, async () => {
    await db.species.clear();
    await db.species.bulkAdd(DEFAULT_SPECIES);

    await db.subskillMaster.clear();
    await db.subskillMaster.bulkAdd(
      DEFAULT_SUBSKILLS.map((name) => ({ id: name, name }))
    );
  });

  await applyChatImports();
  await recomputeIngredientPatterns();
}

/**
 * 画像OCRがうまく読み取れず、チャットに貼り付けられた画像をClaudeが
 * 直接目視して登録した記録(chat-imports.ts)を反映する。
 *
 * entries はユーザー自身の記録データなので、ポケモンマスタのように毎回
 * 上書きはしない。代わりに、appliedImports テーブルで「どのIDを
 * 既に取り込み済みか」を記録しておき、まだ未適用のものだけを1回だけ
 * 追加する。これにより、一度追加した後にユーザーが記録一覧から削除しても
 * (entries から消えても)再度追加されることはない。
 */
async function applyChatImports(): Promise<void> {
  if (CHAT_IMPORTED_ENTRIES.length === 0) return;

  await db.transaction('rw', db.entries, db.appliedImports, async () => {
    for (const importedEntry of CHAT_IMPORTED_ENTRIES) {
      const already = await db.appliedImports.get(importedEntry.id);
      if (already) continue;
      await db.entries.add(importedEntry);
      await db.appliedImports.add({ id: importedEntry.id });
    }
  });
}

/**
 * 食材配置パターン(ingredientPattern)の判定ロジックが変わった場合に、
 * 既存の記録データにも最新のロジックを反映するため、起動のたびに
 * ポケモンマスタの最新内容で再計算し、値が変わっていれば更新する
 * (食材そのものは変更しない。パターンの表示のみを最新化する)。
 */
async function recomputeIngredientPatterns(): Promise<void> {
  const speciesByName = new Map(DEFAULT_SPECIES.map((s) => [s.name, s]));
  const entries = await db.entries.toArray();

  await db.transaction('rw', db.entries, async () => {
    for (const e of entries) {
      const species = speciesByName.get(e.speciesName);
      const pattern = computeIngredientPattern(e.ingredients, species);
      if (pattern !== e.ingredientPattern) {
        await db.entries.update(e.id, { ingredientPattern: pattern });
      }
    }
  });
}
