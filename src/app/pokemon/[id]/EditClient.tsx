'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import EntryForm from '@/components/EntryForm';
import { db } from '@/lib/db';

export default function EditClient({ id }: { id: string }) {
  const entry = useLiveQuery(() => db.entries.get(id).then((e) => e ?? null), [id]);

  if (entry === undefined) {
    return <p className="text-sm text-black/50">読み込み中...</p>;
  }
  if (entry === null) {
    return <p className="text-sm text-black/50">記録が見つかりませんでした。</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-brand-night-dark">
        {entry.speciesName || 'ポケモン'} を編集
      </h1>
      <EntryForm
        key={entry.id}
        initial={entry}
        onSave={async (updated) => {
          await db.entries.put(updated);
        }}
        onDelete={async () => {
          await db.entries.delete(entry.id);
        }}
        saveLabel="更新する"
      />
    </div>
  );
}
