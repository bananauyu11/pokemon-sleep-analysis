'use client';

import EntryForm from '@/components/EntryForm';
import { db } from '@/lib/db';
import { createEmptyEntry } from '@/lib/types';
import { useMemo } from 'react';

function todayStr(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function NewPokemonPage() {
  const initial = useMemo(() => {
    const e = createEmptyEntry();
    e.id = crypto.randomUUID();
    e.caughtDate = todayStr();
    return e;
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-brand-night-dark">ポケモンを手動追加</h1>
      <EntryForm
        initial={initial}
        onSave={async (entry) => {
          await db.entries.add(entry);
        }}
        saveLabel="登録する"
      />
    </div>
  );
}
