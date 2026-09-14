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

/** rawText 中に candidate に近い部分文字列が含まれるか(許容誤差つき) */
function fuzzyIncludes(haystack: string, candidate: string): boolean {
  const nCandidate = normalize(candidate);
  if (!nCandidate) return false;
  const nHay = normalize(haystack);
  if (nHay.includes(nCandidate)) return true;
  if (nCandidate.length < 2) return false;

  const tolerance = Math.max(1, Math.floor(nCandidate.length * 0.34));
  const windowSize = nCandidate.length;
  for (let i = 0; i <= nHay.length - windowSize + tolerance; i++) {
    const slice = nHay.slice(i, i + windowSize + tolerance);
    if (slice.length < windowSize - tolerance) continue;
    if (levenshtein(slice, nCandidate) <= tolerance) return true;
  }
  return false;
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
    if (fuzzyIncludes(rawText, name)) {
      if (name.length > speciesGuess.length) speciesGuess = name;
    }
  }

  const subSkillGuesses = subSkillNames.filter((name) =>
    fuzzyIncludes(rawText, name)
  );

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
