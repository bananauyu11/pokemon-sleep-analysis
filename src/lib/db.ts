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

/** 初回起動時にマスタデータをシードする(既にデータがあれば何もしない) */
export async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  seeded = true;

  const speciesCount = await db.species.count();
  if (speciesCount === 0) {
    await db.species.bulkAdd(DEFAULT_SPECIES);
  }

  const skillCount = await db.subskillMaster.count();
  if (skillCount === 0) {
    await db.subskillMaster.bulkAdd(
      DEFAULT_SUBSKILLS.map((name) => ({ id: name, name }))
    );
  }
}
