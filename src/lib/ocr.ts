'use client';

// 画像からのOCR抽出(ベストエフォート)。
// ゲーム内スクリーンショットは装飾されたUIのため認識精度は完全ではない。
// 抽出結果は必ずフォームで確認・修正できるようにする前提の設計。

import { SUBSKILL_LEVELS } from './types';

export interface OcrExtraction {
  rawText: string;
  time: string; // HH:mm 形式(見つからなければ空)
  level: number | null;
  speciesGuess: string; // マスタ内で一番近そうな名前
  // Lv(10/25/50/70/80) -> サブスキル名。そのレベルを判定できなかった場合は
  // キー自体が存在しない(誤ったレベルに割り当てるより、空欄の方が安全なため)。
  subSkillGuesses: Record<number, string>;
  mainSkillGuess: string; // 「メインスキル」ラベル直後のテキスト(推測)
}

export interface OcrBbox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OcrLine {
  text: string;
  bbox: OcrBbox;
}

export interface OcrRun {
  text: string;
  lines: OcrLine[];
}

/**
 * OCR前処理: グレースケール化 + コントラスト強調。
 * ロック中(未解放)のサブスキル名のような薄いグレー文字は、元画像のまま
 * だと認識に失敗しやすいため、事前にコントラストを強めて判読しやすくする。
 * 失敗した場合は元のファイルをそのまま使う(ベストエフォート)。
 */
async function preprocessForOcr(file: Blob): Promise<Blob | HTMLCanvasElement> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const contrast = 1.6;
    const intercept = 128 * (1 - contrast);
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const v = Math.min(255, Math.max(0, gray * contrast + intercept));
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  } catch {
    return file;
  }
}

/**
 * 画像をOCRし、全文テキストに加えて行ごとの位置情報(バウンディングボックス)も取得する。
 * ポケモンスリープのサブスキル欄は2列グリッドで表示されるため、単純にテキストの
 * 出現順だけでは画面上の並び(レベル解放順)と一致しないことがある。位置情報を
 * 使って行→列の順に並べ替えるために取得する。
 */
export async function runOcr(
  file: Blob,
  onProgress?: (progress: number) => void
): Promise<OcrRun> {
  const Tesseract = await import('tesseract.js');
  const worker = await Tesseract.createWorker('jpn', 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    },
  });
  try {
    const ocrInput = await preprocessForOcr(file);
    const { data } = await worker.recognize(ocrInput, {}, { blocks: true });
    const lines: OcrLine[] = [];
    for (const block of data.blocks ?? []) {
      for (const para of block.paragraphs ?? []) {
        for (const line of para.lines ?? []) {
          if (line.text.trim()) lines.push({ text: line.text, bbox: line.bbox });
        }
      }
    }
    return { text: data.text ?? '', lines };
  } finally {
    await worker.terminate();
  }
}

function normalize(s: string): string {
  return s
    .replace(/\s+/g, '')
    .replace(/[.．。]/g, '')
    .toLowerCase();
}

/** 簡易レーベンシュタイン距離 */
function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

// サブスキル名などの末尾についたランク文字(S/M/L)。曖昧一致の対象外にする
// (「食材確率アップS」と「食材確率アップM」のように末尾1文字だけが違う名前は、
// 通常の編集距離の許容範囲内に収まってしまい取り違える恐れがあるため)。
const RANK_SUFFIX = /[SML]$/;

/**
 * haystack 中に candidate に近い部分文字列が含まれるか(許容誤差つき)。
 * 誤検出を避けるため、候補文字列に対する編集距離の「比率」で判定する
 * (文字数に対して十分近い場合のみ一致とみなす。短い候補ほど厳しくする)。
 * candidate の末尾がランク文字(S/M/L)の場合は、そこだけは完全一致を必須にする
 * (例: 「食材確率アップS」と「食材確率アップM」を取り違えない)。
 */
function fuzzyIncludes(haystack: string, candidate: string): boolean {
  const nCandidate = normalize(candidate);
  if (nCandidate.length < 2) return false;
  const nHay = normalize(haystack);
  if (nHay.includes(nCandidate)) return true;
  if (nCandidate.length < 4) return false; // 短い名前は誤検出しやすいので完全一致のみ許可

  const rankMatch = candidate.match(RANK_SUFFIX);
  const requiredSuffix = rankMatch ? rankMatch[0].toLowerCase() : null;

  const windowSize = nCandidate.length;
  const maxRatio = 0.2; // 候補文字数の20%までの差異のみ許容
  const maxDist = Math.floor(nCandidate.length * maxRatio);
  if (maxDist < 1) return false;

  for (let i = 0; i <= nHay.length - windowSize; i++) {
    const slice = nHay.slice(i, i + windowSize);
    if (requiredSuffix && slice[slice.length - 1] !== requiredSuffix) continue;
    if (levenshtein(slice, nCandidate) <= maxDist) return true;
  }
  return false;
}

/**
 * 種族名は誤判定の影響が大きい(誤ったポケモンを登録してしまう)ため、
 * 曖昧一致は使わず、正規化した完全一致(部分文字列一致)のみを採用する。
 * 一致しない場合は無理に推測せず空文字を返す。
 */
function exactIncludes(haystack: string, candidate: string): boolean {
  const nCandidate = normalize(candidate);
  if (nCandidate.length < 2) return false;
  return normalize(haystack).includes(nCandidate);
}

interface MatchedLine {
  name: string;
  bbox: OcrBbox;
}

/**
 * 位置情報つきの行から、同じ「行(横並び)」とみなせるものをグループ化する。
 * ポケモンスリープのサブスキル欄は2列グリッドのため、Y座標がほぼ同じ
 * (行の高さの半分未満の差)ものは同じ行、そうでなければ別の行として扱う。
 * 各行の中はX座標(左→右)で並べる。
 */
function sortByGridPosition(matches: MatchedLine[]): string[] {
  if (matches.length === 0) return [];
  const sorted = [...matches].sort((a, b) => a.bbox.y0 - b.bbox.y0);
  const rows: MatchedLine[][] = [];
  for (const m of sorted) {
    const lineHeight = Math.max(1, m.bbox.y1 - m.bbox.y0);
    const currentRow = rows[rows.length - 1];
    if (currentRow && Math.abs(m.bbox.y0 - currentRow[0].bbox.y0) < lineHeight * 0.6) {
      currentRow.push(m);
    } else {
      rows.push([m]);
    }
  }
  return rows.flatMap((row) => row.sort((a, b) => a.bbox.x0 - b.bbox.x0).map((m) => m.name));
}

/** 指定した文字列を含む行のバウンディングボックスを返す(見つからなければnull)。 */
export function findLabelLineBbox(lines: OcrLine[], label: string): OcrBbox | null {
  for (const line of lines) {
    if (line.text.replace(/\s+/g, '').includes(label)) return line.bbox;
  }
  return null;
}

const SUBSKILL_LEVEL_SET = new Set<number>(SUBSKILL_LEVELS);
const LEVEL_BADGE_RE = /Lv\.?\s*(\d{1,3})/i;

interface LevelBadge {
  level: number;
  bbox: OcrBbox;
}

/**
 * サブスキル名とレベル(Lv10/25/50/70/80)の対応を推定する。
 *
 * ポケモンスリープのサブスキル欄は、ロック中(未解放)の枠には対象レベルが
 * 「🔒Lv.25」のようにバッジ表示される。このバッジのレベル数値は直接的で
 * 信頼できる情報なので、名前が読み取れた行の近くにバッジがあれば、その
 * レベルにそのまま対応付ける。これにより、他の枠の文字が読み取れずに
 * 欠けていても、読み取れた枠だけは正しいレベルに割り当てられる
 * (単純に検出順でLv10から詰めていく方式だと、欠けが発生した時に
 * ズレて誤ったレベルに割り当ててしまう問題があった)。
 *
 * バッジが見つからない名前(＝解放済みでロック表示のないサブスキル)は、
 * ゲーム仕様上必ずLv10側から連続して解放されるため、まだ埋まっていない
 * レベルのうち小さい方から、画面上の並び順(上から下、同じ行は左から右)
 * に割り当てる。
 *
 * どちらの方法でも対応が付かなかったレベルは、結果にキーを含めない
 * (誤ったレベルに割り当てるより空欄の方が安全なため)。
 */
function detectSubSkillsByLevel(
  lines: OcrLine[],
  subSkillNames: string[]
): Record<number, string> {
  const nameLines: MatchedLine[] = [];
  const badgeLines: LevelBadge[] = [];

  for (const line of lines) {
    for (const name of subSkillNames) {
      if (fuzzyIncludes(line.text, name)) {
        nameLines.push({ name, bbox: line.bbox });
        break; // 1行につき1候補まで
      }
    }
    const badgeMatch = line.text.match(LEVEL_BADGE_RE);
    if (badgeMatch) {
      const lvl = Number.parseInt(badgeMatch[1], 10);
      if (SUBSKILL_LEVEL_SET.has(lvl)) {
        badgeLines.push({ level: lvl, bbox: line.bbox });
      }
    }
  }

  const result: Record<number, string> = {};
  if (nameLines.length === 0) return result;

  // 名前の行ごとに、同じ「行(横並び)」とみなせる範囲内で一番近いバッジを探す。
  const unmatchedNames: MatchedLine[] = [];
  for (const n of nameLines) {
    const lineHeight = Math.max(1, n.bbox.y1 - n.bbox.y0);
    let best: LevelBadge | null = null;
    let bestDist = Infinity;
    for (const b of badgeLines) {
      if (result[b.level] !== undefined) continue; // 既に対応付け済みのレベルは除外
      const sameRow = Math.abs(b.bbox.y0 - n.bbox.y0) < lineHeight * 1.2;
      if (!sameRow) continue;
      const dist = Math.hypot(
        (b.bbox.x0 + b.bbox.x1) / 2 - (n.bbox.x0 + n.bbox.x1) / 2,
        b.bbox.y0 - n.bbox.y0
      );
      if (dist < bestDist) {
        bestDist = dist;
        best = b;
      }
    }
    if (best) {
      result[best.level] = n.name;
    } else {
      unmatchedNames.push(n);
    }
  }

  // バッジと対応付かなかった名前(解放済み)は、まだ埋まっていないレベルの
  // うち小さい方から、画面上の並び順に割り当てる。
  const remainingLevels = SUBSKILL_LEVELS.filter((lv) => result[lv] === undefined);
  const orderedUnmatched = sortByGridPosition(unmatchedNames);
  for (let i = 0; i < orderedUnmatched.length && i < remainingLevels.length; i++) {
    result[remainingLevels[i]] = orderedUnmatched[i];
  }

  return result;
}

export function extractFields(
  run: OcrRun,
  speciesNames: string[],
  subSkillNames: string[]
): OcrExtraction {
  const rawText = run.text;

  const timeMatch = rawText.match(/([01]?\d|2[0-3])[:：]([0-5]\d)/);
  const time = timeMatch ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` : '';

  const levelMatch = rawText.match(/Lv\.?\s*(\d{1,3})/i);
  const level = levelMatch ? Number.parseInt(levelMatch[1], 10) : null;

  let speciesGuess = '';
  for (const name of speciesNames) {
    if (exactIncludes(rawText, name) && name.length > speciesGuess.length) {
      speciesGuess = name;
    }
  }

  // ロック中(未解放)の枠に表示される「Lv.XX」バッジを手がかりに、
  // 読み取れたサブスキル名を正しいレベルへ対応付ける(詳細は
  // detectSubSkillsByLevel のコメントを参照)。
  const subSkillGuesses = detectSubSkillsByLevel(run.lines, subSkillNames);

  let mainSkillGuess = '';
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const idx = lines.findIndex((l) => l.includes('メインスキル'));
  if (idx >= 0) {
    for (let i = idx + 1; i < Math.min(lines.length, idx + 3); i++) {
      const candidate = lines[i].replace(/Lv\.?\s*\d+/i, '').trim();
      if (candidate && !candidate.includes('サブスキル')) {
        mainSkillGuess = candidate;
        break;
      }
    }
  }

  return {
    rawText,
    time,
    level,
    speciesGuess,
    subSkillGuesses,
    mainSkillGuess,
  };
}
