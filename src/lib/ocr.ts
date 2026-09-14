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
  // 段落(Tesseractのparagraph)単位でまとめたテキスト。ゲームの装飾フォントは
  // 文字間が広く、1つのサブスキル名が複数の「行」に分割して認識されてしまう
  // ことがあり、その場合は行単位の一致判定だけでは名前全体を拾えない。
  // 段落は複数の行をまとめたものなので、行が分割されていても名前全体が
  // 含まれている可能性が高く、行での一致判定の補完(フォールバック)に使う。
  paragraphs: OcrLine[];
}

/**
 * OCR前処理: グレースケール化 + ガンマ補正による暗部強調。
 *
 * ロック中(未解放)のサブスキル名のような薄いグレー文字は、元画像のまま
 * だと認識に失敗しやすい。ただし、中心値(128)を基準にした単純な線形の
 * コントラスト強調は、文字も背景もどちらも明るい(白背景に薄いグレー文字、
 * のような)ケースでは両方が白側に張り付いてしまい、かえって差が縮む
 * (実測で悪化を確認した)。そのため、明るい側をあまり動かさず暗い側を
 * より暗く寄せるガンマ補正(v' = 255*(v/255)^gamma, gamma>1)を使う。
 * 失敗した場合はnullを返す(呼び出し側は元画像のみで処理を続行する)。
 */
async function enhanceForOcr(file: Blob): Promise<HTMLCanvasElement | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const gamma = 1.6;
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const v = 255 * Math.pow(gray / 255, gamma);
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  } catch {
    return null;
  }
}

interface TesseractLikePage {
  text?: string;
  blocks?: Array<{
    paragraphs?: Array<{
      lines?: Array<{ text: string; bbox: OcrBbox }>;
    }>;
  }> | null;
}

function flattenLines(data: TesseractLikePage): OcrLine[] {
  const lines: OcrLine[] = [];
  for (const block of data.blocks ?? []) {
    for (const para of block.paragraphs ?? []) {
      for (const line of para.lines ?? []) {
        if (line.text.trim()) lines.push({ text: line.text, bbox: line.bbox });
      }
    }
  }
  return lines;
}

/** 段落単位で、含まれる行のテキストを連結し、バウンディングボックスを結合する。 */
function flattenParagraphs(data: TesseractLikePage): OcrLine[] {
  const paragraphs: OcrLine[] = [];
  for (const block of data.blocks ?? []) {
    for (const para of block.paragraphs ?? []) {
      const paraLines = (para.lines ?? []).filter((l) => l.text.trim());
      if (paraLines.length === 0) continue;
      const text = paraLines.map((l) => l.text).join('');
      const bbox: OcrBbox = {
        x0: Math.min(...paraLines.map((l) => l.bbox.x0)),
        y0: Math.min(...paraLines.map((l) => l.bbox.y0)),
        x1: Math.max(...paraLines.map((l) => l.bbox.x1)),
        y1: Math.max(...paraLines.map((l) => l.bbox.y1)),
      };
      paragraphs.push({ text, bbox });
    }
  }
  return paragraphs;
}

/** ほぼ同じ位置・同じ文字列の行を1つにまとめる(複数パスの結果を統合する際の重複除去)。 */
function dedupeLines(lines: OcrLine[]): OcrLine[] {
  const result: OcrLine[] = [];
  outer: for (const line of lines) {
    const cx = (line.bbox.x0 + line.bbox.x1) / 2;
    const cy = (line.bbox.y0 + line.bbox.y1) / 2;
    for (const existing of result) {
      const ecx = (existing.bbox.x0 + existing.bbox.x1) / 2;
      const ecy = (existing.bbox.y0 + existing.bbox.y1) / 2;
      if (
        normalize(existing.text) === normalize(line.text) &&
        Math.abs(cx - ecx) < 20 &&
        Math.abs(cy - ecy) < 20
      ) {
        continue outer;
      }
    }
    result.push(line);
  }
  return result;
}

/**
 * 画像をOCRし、全文テキストに加えて行ごとの位置情報(バウンディングボックス)も取得する。
 * ポケモンスリープのサブスキル欄は2列グリッドで表示されるため、単純にテキストの
 * 出現順だけでは画面上の並び(レベル解放順)と一致しないことがある。位置情報を
 * 使って行→列の順に並べ替えるために取得する。
 *
 * 元画像とガンマ補正で暗部を強調した画像の2パスで認識し、結果を統合する。
 * どちらか一方でしか読み取れない文字(例: 元画像では潰れて見える薄いグレー文字が
 * 補正後は読めるようになる、逆に補正で潰れた文字は元画像側で読める、等)を
 * 両方カバーできるようにするため。1パスだけにする場合に比べて処理時間は増えるが、
 * 検出漏れ(元画像だけなら読めていたはずの文字が補正で読めなくなる劣化)を防げる。
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
    const enhanced = await enhanceForOcr(file);
    const inputs: (Blob | HTMLCanvasElement)[] = enhanced ? [file, enhanced] : [file];

    const texts: string[] = [];
    const allLines: OcrLine[] = [];
    const allParagraphs: OcrLine[] = [];
    for (const input of inputs) {
      const { data } = await worker.recognize(input, {}, { blocks: true });
      texts.push(data.text ?? '');
      allLines.push(...flattenLines(data));
      allParagraphs.push(...flattenParagraphs(data));
    }

    return {
      text: texts.join('\n'),
      lines: dedupeLines(allLines),
      paragraphs: dedupeLines(allParagraphs),
    };
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

interface TaggedItem {
  kind: 'name' | 'badge';
  name?: string; // kind === 'name'
  level?: number; // kind === 'badge'
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
 * 対応付けはまず「行(Y座標が近いもの)」でグループ化し、同じ行の中で
 * バッジと名前をX座標が近い順にペアリングする(行だけで判定すると、
 * 2列グリッドの同じ行にある「バッジの無い名前」が、本来は別の列の
 * バッジに対応するはずのバッジを誤って横取りしてしまう問題があった)。
 *
 * バッジと対応付かなかった名前(＝解放済みでロック表示のないサブスキル)は、
 * ゲーム仕様上必ずLv10側から連続して解放されるため、まだ埋まっていない
 * レベルのうち小さい方から、画面上の並び順(上から下、同じ行は左から右)
 * に割り当てる。
 *
 * どちらの方法でも対応が付かなかったレベルは、結果にキーを含めない
 * (誤ったレベルに割り当てるより空欄の方が安全なため)。
 *
 * 装飾フォントで文字間が広いと、1つのサブスキル名が複数の「行」に
 * 分割して認識され、どの行の文字列にも名前全体が収まらず検出漏れに
 * なることがある。その場合の救済として、行単位で見つからなかった名前は
 * 段落(複数行をまとめたテキスト)単位でも探す(`paragraphs`)。
 * 既に行単位で見つかっている名前には影響しない(追加のフォールバックのみ)。
 */
function detectSubSkillsByLevel(
  lines: OcrLine[],
  subSkillNames: string[],
  paragraphs: OcrLine[] = []
): Record<number, string> {
  const tagged: TaggedItem[] = [];
  const foundNames = new Set<string>();

  for (const line of lines) {
    for (const name of subSkillNames) {
      if (fuzzyIncludes(line.text, name)) {
        tagged.push({ kind: 'name', name, bbox: line.bbox });
        foundNames.add(name);
        break; // 1行につき1候補まで
      }
    }
    const badgeMatch = line.text.match(LEVEL_BADGE_RE);
    if (badgeMatch) {
      const lvl = Number.parseInt(badgeMatch[1], 10);
      if (SUBSKILL_LEVEL_SET.has(lvl)) {
        tagged.push({ kind: 'badge', level: lvl, bbox: line.bbox });
      }
    }
  }

  for (const para of paragraphs) {
    for (const name of subSkillNames) {
      if (foundNames.has(name)) continue;
      if (fuzzyIncludes(para.text, name)) {
        tagged.push({ kind: 'name', name, bbox: para.bbox });
        foundNames.add(name);
        break; // 1段落につき1候補まで
      }
    }
  }

  const result: Record<number, string> = {};
  if (tagged.every((t) => t.kind !== 'name')) return result;

  // Y座標でソートし、行の高さの0.9倍未満の差を同じ行とみなしてグループ化する
  // (名前の行とバッジの行は必ずしも完全に同じY座標ではないため、名前同士の
  // 判定(0.6倍)よりやや広めに許容する)。
  const sorted = [...tagged].sort((a, b) => a.bbox.y0 - b.bbox.y0);
  const rows: TaggedItem[][] = [];
  for (const item of sorted) {
    const h = Math.max(1, item.bbox.y1 - item.bbox.y0);
    const currentRow = rows[rows.length - 1];
    if (currentRow && Math.abs(item.bbox.y0 - currentRow[0].bbox.y0) < h * 0.9) {
      currentRow.push(item);
    } else {
      rows.push([item]);
    }
  }

  const unmatchedNames: MatchedLine[] = [];
  for (const row of rows) {
    const names = row.filter((r) => r.kind === 'name');
    const badges = row.filter((r) => r.kind === 'badge');
    const claimed = new Set<number>();

    // 行内の各バッジについて、まだ他のバッジに使われていない名前の中から
    // X座標が一番近いものを対応付ける(同じ行に複数列があっても、
    // バッジは自分の列の名前とだけペアになるようにする)。
    for (const b of badges) {
      if (result[b.level!] !== undefined) continue;
      let bestIdx = -1;
      let bestDist = Infinity;
      names.forEach((n, i) => {
        if (claimed.has(i)) return;
        const dist = Math.abs(
          (n.bbox.x0 + n.bbox.x1) / 2 - (b.bbox.x0 + b.bbox.x1) / 2
        );
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });
      if (bestIdx >= 0) {
        result[b.level!] = names[bestIdx].name!;
        claimed.add(bestIdx);
      }
    }

    names.forEach((n, i) => {
      if (!claimed.has(i)) unmatchedNames.push({ name: n.name!, bbox: n.bbox });
    });
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
  const subSkillGuesses = detectSubSkillsByLevel(run.lines, subSkillNames, run.paragraphs);

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
