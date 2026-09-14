'use client';

// 画像からのOCR抽出(ベストエフォート)。
// ゲーム内スクリーンショットは装飾されたUIのため認識精度は完全ではない。
// 抽出結果は必ずフォームで確認・修正できるようにする前提の設計。

export interface OcrExtraction {
  rawText: string;
  time: string; // HH:mm 形式(見つからなければ空)
  level: number | null;
  speciesGuess: string; // マスタ内で一番近そうな名前
  subSkillGuesses: string[]; // マスタ内サブスキルとの一致候補
  mainSkillGuess: string; // 「メインスキル」ラベル直後のテキスト(推測)
}

export async function runOcr(
  file: Blob,
  onProgress?: (progress: number) => void
): Promise<string> {
  const Tesseract = await import('tesseract.js');
  const { data } = await Tesseract.recognize(file, 'jpn', {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    },
  });
  return data.text ?? '';
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
 * rawText 中に candidate に近い部分文字列が含まれるか(許容誤差つき)。
 * 誤検出を避けるため、候補文字列に対する編集距離の「比率」で判定する
 * (文字数に対して十分近い場合のみ一致とみなす。短い候補ほど厳しくする)。
 * candidate の末尾がランク文字(S/M/L)の場合は、そこだけは完全一致を必須にする
 * (例: 「食材確率アップS」と「食材確率アップM」を取り違えない)。
 * 見つかった場合はその出現位置(nHay内のインデックス)を返す。見つからなければ -1。
 */
function fuzzyFindIndex(haystack: string, candidate: string): number {
  const nCandidate = normalize(candidate);
  if (nCandidate.length < 2) return -1;
  const nHay = normalize(haystack);
  const exact = nHay.indexOf(nCandidate);
  if (exact >= 0) return exact;
  if (nCandidate.length < 4) return -1; // 短い名前は誤検出しやすいので完全一致のみ許可

  const rankMatch = candidate.match(RANK_SUFFIX);
  const requiredSuffix = rankMatch ? rankMatch[0].toLowerCase() : null;

  const windowSize = nCandidate.length;
  const maxRatio = 0.2; // 候補文字数の20%までの差異のみ許容
  const maxDist = Math.floor(nCandidate.length * maxRatio);
  if (maxDist < 1) return -1;

  for (let i = 0; i <= nHay.length - windowSize; i++) {
    const slice = nHay.slice(i, i + windowSize);
    if (requiredSuffix && slice[slice.length - 1] !== requiredSuffix) continue;
    if (levenshtein(slice, nCandidate) <= maxDist) return i;
  }
  return -1;
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

export function extractFields(
  rawText: string,
  speciesNames: string[],
  subSkillNames: string[]
): OcrExtraction {
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

  // 画面上でサブスキルは解放レベル順(Lv10→25→50→70→80)に上から表示される
  // ため、OCRテキスト中に「出現した順番」で並べ替えることで、そのままレベル
  // 枠に割り当てられるようにする。
  const subSkillGuesses = subSkillNames
    .map((name) => ({ name, pos: fuzzyFindIndex(rawText, name) }))
    .filter((m) => m.pos >= 0)
    .sort((a, b) => a.pos - b.pos)
    .map((m) => m.name);

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
