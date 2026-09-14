'use client';

import { useState } from 'react';
import { db } from '@/lib/db';
import { extractFields, runOcr, type OcrExtraction } from '@/lib/ocr';
import { useSpeciesList, useSubSkillNames } from '@/lib/hooks';
import { createEmptyEntry, type PokemonEntry } from '@/lib/types';
import EntryForm from '@/components/EntryForm';

type Status = 'idle' | 'processing' | 'done' | 'error';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export default function ImageImportSection() {
  const speciesList = useSpeciesList();
  const subSkillNames = useSubSkillNames();
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [extraction, setExtraction] = useState<OcrExtraction | null>(null);
  const [draft, setDraft] = useState<PokemonEntry | null>(null);
  const [preview, setPreview] = useState<string>('');

  async function handleFile(file: File) {
    setStatus('processing');
    setProgress(0);
    setExtraction(null);
    setDraft(null);
    setPreview(URL.createObjectURL(file));

    try {
      const text = await runOcr(file, setProgress);
      const result = extractFields(
        text,
        speciesList.map((s) => s.name),
        subSkillNames
      );
      setExtraction(result);

      const matched = speciesList.find((s) => s.name === result.speciesGuess);
      const entry = createEmptyEntry();
      entry.id = crypto.randomUUID();
      entry.caughtDate = todayStr();
      entry.speciesName = result.speciesGuess;
      entry.speciesId = matched?.id ?? '';
      entry.specialty = matched?.specialty ?? entry.specialty;
      entry.berry = matched?.berry ?? '';
      entry.mainSkill = result.mainSkillGuess || matched?.mainSkill || '';
      entry.level = result.level ?? 1;
      entry.capturedTime = result.time;
      entry.imageFileName = file.name;
      setDraft(entry);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  return (
    <div className="card flex flex-col gap-4 p-5">
      <h2 className="text-base font-bold text-brand-night-dark">画像取込(OCR)</h2>
      <p className="text-xs text-black/50">
        ゲーム画面のスクリーンショットから時刻・名前・レベル・メインスキルなどを自動抽出します。
        文字認識は完全ではないため、必ず内容を確認してから登録してください。きのみ・食材の種類はOCRでは取得できないため手動で選択してください。
      </p>
      <input
        type="file"
        accept="image/*"
        className="text-sm"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element -- blob: object URL preview, not a static/remote asset
        <img
          src={preview}
          alt="アップロード画像プレビュー"
          className="max-h-64 w-auto rounded-lg border border-black/10 object-contain"
        />
      )}

      {status === 'processing' && (
        <div className="flex items-center gap-2 text-sm text-black/50">
          <span className="h-2 w-2 animate-pulse rounded-full bg-brand-accent" />
          文字認識中... {Math.round(progress * 100)}%
        </div>
      )}

      {status === 'error' && (
        <p className="text-sm text-red-600">
          画像の解析に失敗しました。別の画像で試すか、手動で追加してください。
        </p>
      )}

      {extraction && (
        <div className="rounded-lg bg-black/5 p-3 text-xs text-black/60">
          <p>推定した名前: {extraction.speciesGuess || '(不明)'}</p>
          <p>推定レベル: {extraction.level ?? '(不明)'}</p>
          <p>推定時刻: {extraction.time || '(不明)'}</p>
          <p>推定メインスキル: {extraction.mainSkillGuess || '(不明)'}</p>
          <p>
            サブスキル候補:{' '}
            {extraction.subSkillGuesses.length > 0
              ? extraction.subSkillGuesses.join(' / ')
              : '(検出なし・下のフォームで手動選択してください)'}
          </p>
          <p className="mt-2 text-black/40">
            きのみ・食材・時刻・スキル名はアイコンや装飾フォントのため認識精度が低いことがあります。
            下の「OCRが読み取った全文」を見ながら、フォームを手動で修正してください。
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-brand-night-dark/70">
              OCRが読み取った全文(デバッグ用)
            </summary>
            <pre className="mt-1 max-h-56 overflow-auto whitespace-pre-wrap rounded bg-white p-2 text-[11px] text-black/70">
              {extraction.rawText || '(テキストを検出できませんでした)'}
            </pre>
          </details>
        </div>
      )}

      {draft && (
        <div className="border-t border-black/10 pt-4">
          <h3 className="mb-2 text-sm font-bold text-brand-night-dark">
            内容を確認して登録
          </h3>
          <EntryForm
            key={draft.id}
            initial={draft}
            saveLabel="この内容で登録する"
            onSave={async (entry) => {
              await db.entries.add(entry);
              setDraft(null);
              setExtraction(null);
              setPreview('');
              setStatus('idle');
            }}
          />
        </div>
      )}
    </div>
  );
}
