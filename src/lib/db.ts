import Dexie, { type EntityTable } from 'dexie';
import type { PokemonEntry, PokemonSpecies } from './types';
import { DEFAULT_SPECIES } from './species-data';
import { DEFAULT_SUBSKILLS } from './subskills';

export interface SubSkillMasterRow {
  id: string; // = name (ユニークキー)
  name: string;
}

class PokeSleepDB extends Dexie {
  entries!: EntityTable<PokemonEntry, 'id'>;
  species!: EntityTable<PokemonSpecies, 'id'>;
  subskillMaster!: EntityTable<SubSkillMasterRow, 'id'>;

  constructor() {
    super('pokesleep-analysis');
    this.version(1).stores({
      entries: 'id, speciesId, speciesName, medal, specialty, caughtDate, level',
      species: 'id, name, specialty',
      subskillMaster: 'id, name',
    });
  }
}

export const db = new PokeSleepDB();

let seeded = false;

/**
 * 種族マスタ・サブスキル一覧はアプリ内に編集画面を持たず、コード
 * (species-data.ts / subskills.ts)側で管理する運用のため、起動のたびに
 * 常にコード内の最新内容で上書き同期する(ユーザーの記録データ=entriesは
 * 対象外で、ここでは触らない)。
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
}
