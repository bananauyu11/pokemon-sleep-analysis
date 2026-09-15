'use client';

import { useState } from 'react';
import { db } from '@/lib/db';
import { parseEntriesCsv } from '@/lib/csv';
import { useSpeciesList } from '@/lib/hooks';
import type { PokemonEntry } from '@/lib/types';

export default function CsvImportSection() {
  const speciesList = useSpeciesList();
  const [preview, setPreview] = useState<PokemonEntry[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [done, setDone] = useState(false);

  async function handleFile(file: File) {
    setDone(false);
    setFileName(file.name);
    const text = await file.text();
    const { entries, errors } = parseEntriesCsv(text, speciesList);
    setPreview(entries);
    setErrors(errors);
  }

  async function handleImport() {
    await db.entries.bulkPut(preview);
    setDone(true);
    setPreview([]);
  }

  return (
    <div className="card flex flex-col gap-3 p-5">
      <h2 className="text-base font-bold text-brand-night-dark">CSV取込</h2>
      <p className="text-xs text-black/50">
        「記録一覧」からエクスポートしたCSV、または同じ列構成のCSVファイルを取り込めます。
        同じidの行は上書き更新されます。
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        className="text-sm"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      {fileName && (
        <p className="text-xs text-black/40">
          {fileName}: {preview.length}件を検出
        </p>
      )}
      {errors.length > 0 && (
        <ul className="list-disc pl-5 text-xs text-red-600">
          {errors.slice(0, 10).map((er, i) => (
            <li key={i}>{er}</li>
          ))}
        </ul>
      )}
      {preview.length > 0 && (
        <button className="btn-accent w-fit" onClick={handleImport}>
          {preview.length}件を取り込む
        </button>
      )}
      {done && <p className="text-sm text-brand-mint">取り込みが完了しました。</p>}
    </div>
  );
}
