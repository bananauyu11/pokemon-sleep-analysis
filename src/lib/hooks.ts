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

export function useIngredientSuggestions(): string[] {
  const entries = useEntries();
  const species = useSpeciesList();
  return useLiveQuery(async () => {
    const set = new Set<string>();
    for (const e of entries) {
      for (const ing of e.ingredients) if (ing) set.add(ing);
    }
    for (const s of species) {
      for (const opts of s.ingredientOptions) for (const o of opts) set.add(o);
    }
    return [...set].sort();
  }, [entries, species]) ?? [];
}
