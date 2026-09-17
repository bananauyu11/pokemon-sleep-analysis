'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { PokemonEntry, PokemonSpecies } from './types';

export function useEntries(): PokemonEntry[] {
  return (
    useLiveQuery(() => db.entries.orderBy('caughtDate').reverse().toArray(), []) ?? []
  );
}

export function useSpeciesList(): PokemonSpecies[] {
  return (
    useLiveQuery(
      () => db.species.orderBy('name').toArray(),
      []
    ) ?? []
  );
}

export function useSubSkillNames(): string[] {
  const rows = useLiveQuery(() => db.subskillMaster.orderBy('name').toArray(), []);
  return (rows ?? []).map((r) => r.name);
}
