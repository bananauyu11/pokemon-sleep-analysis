'use client';

// 食材アイコンの画像照合(ベストエフォート)。
//
// スクリーンショット内の食材アイコン領域を切り出し、あらかじめ用意した
// 19種類のアイコン画像(public/ingredient-icons/)と単純な色ベースの
// 特徴量で比較し、一番近いものを推定する。ゲームのアイコンをそのまま
// 認識するわけではなく、あくまで「近い色・形のものを探す」簡易的な
// 手法のため、精度は保証できない。必ずユーザーが目で確認・修正できる
// ようにする前提で使うこと。
import { INGREDIENT_ICONS, ingredientIconUrl } from './ingredients';
import type { OcrBbox } from './ocr';

const SIG_SIZE = 10; // ダウンサンプル後のグリッドサイズ(SIG_SIZE x SIG_SIZE)

export interface IconMatch {
  id: string;
  name: string;
  distance: number; // 小さいほど近い(0が完全一致)
}

interface ReferenceSignature {
  id: string;
  name: string;
  signature: Float32Array;
}

let referenceSignaturesPromise: Promise<ReferenceSignature[]> | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });
}

/**
 * 画像(または画像の一部領域)を SIG_SIZE x SIG_SIZE に縮小し、
 * 各マスのRGB平均値を並べた特徴量ベクトルを作る(簡易的な色ヒストグラム)。
 */
function computeSignature(
  source: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number
): Float32Array {
  const canvas = document.createElement('canvas');
  canvas.width = SIG_SIZE;
  canvas.height = SIG_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return new Float32Array(SIG_SIZE * SIG_SIZE * 3);
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, SIG_SIZE, SIG_SIZE);
  const { data } = ctx.getImageData(0, 0, SIG_SIZE, SIG_SIZE);
  const sig = new Float32Array(SIG_SIZE * SIG_SIZE * 3);
  for (let i = 0; i < SIG_SIZE * SIG_SIZE; i++) {
    sig[i * 3] = data[i * 4] / 255;
    sig[i * 3 + 1] = data[i * 4 + 1] / 255;
    sig[i * 3 + 2] = data[i * 4 + 2] / 255;
  }
  return sig;
}

// 19種類のアイコンはいずれも背景に淡いクリーム色の円形バッジを共通で
// 持っており、この背景色が特徴量(平均色)の大部分を占めてしまうため、
// 見た目の異なるアイコン同士(例: ジンジャーとハーブ)でも色の平均だけでは
// 近い値になりやすい(実測で確認)。周囲15%をトリミングして中心の
// イラスト部分の比重を高めることで、識別性をやや改善する。
const SIGNATURE_MARGIN = 0.15;

function trimMargin(
  sx: number,
  sy: number,
  sw: number,
  sh: number
): [number, number, number, number] {
  const mx = sw * SIGNATURE_MARGIN;
  const my = sh * SIGNATURE_MARGIN;
  return [sx + mx, sy + my, sw - mx * 2, sh - my * 2];
}

async function getReferenceSignatures(): Promise<ReferenceSignature[]> {
  if (!referenceSignaturesPromise) {
    referenceSignaturesPromise = Promise.all(
      INGREDIENT_ICONS.map(async (ing) => {
        const img = await loadImage(ingredientIconUrl(ing.id));
        const signature = computeSignature(
          img,
          ...trimMargin(0, 0, img.naturalWidth, img.naturalHeight)
        );
        return { id: ing.id, name: ing.name, signature };
      })
    );
  }
  return referenceSignaturesPromise;
}

function distance(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export interface IconCropResult {
  /** 切り出した領域のプレビュー用データURL */
  previewUrl: string;
  best: IconMatch | null;
  /** 参考: 近い順の候補上位3件(デバッグ・目視確認用) */
  candidates: IconMatch[];
}

/**
 * 画像上の指定領域(sx, sy, sw, sh)を切り出し、食材アイコンと照合する。
 *
 * `candidateNames` を指定すると、そのポケモンの種族マスタで判明している
 * (そのスロットで実際にあり得る)食材名だけに絞り込んで比較する。
 * 比較対象が少ないほど、淡い色同士の取り違えなどが起きにくくなるため、
 * 判明している場合は優先的に使う。未指定、または該当する候補が
 * 1件も無い場合は、従来通り19種類全体から探す。
 */
export async function matchIngredientIcon(
  source: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  candidateNames?: string[]
): Promise<IconCropResult> {
  const refs = await getReferenceSignatures();
  const targetSig = computeSignature(source, ...trimMargin(sx, sy, sw, sh));

  const pool =
    candidateNames && candidateNames.length > 0
      ? refs.filter((r) => candidateNames.includes(r.name))
      : refs;
  const searchRefs = pool.length > 0 ? pool : refs;

  const candidates = searchRefs
    .map((r) => ({ id: r.id, name: r.name, distance: distance(targetSig, r.signature) }))
    .sort((a, b) => a.distance - b.distance);

  // プレビュー画像(切り出した領域をそのまま少し大きめに描画)
  const previewCanvas = document.createElement('canvas');
  const previewSize = 64;
  previewCanvas.width = previewSize;
  previewCanvas.height = previewSize;
  const ctx = previewCanvas.getContext('2d');
  if (ctx) ctx.drawImage(source, sx, sy, sw, sh, 0, 0, previewSize, previewSize);
  const previewUrl = previewCanvas.toDataURL('image/png');

  return {
    previewUrl,
    best: candidates[0] ?? null,
    candidates: candidates.slice(0, 3),
  };
}

// 注意: 実データで検証したところ、この単純な色ヒストグラム比較だけでは
// 「モーモーミルク」と「とくせんエッグ」のような淡い色合いの食材同士を
// 確実に区別できないことが分かっている(背景の薄い黄色が結果を支配して
// しまい、アイコン自体の色・形の違いが埋もれてしまう)。SIGNATURE_MARGIN
// によるトリミングである程度は緩和されるが、根本的な解消ではない。
// そのため `best`/`candidates` はあくまで「参考程度の近さ」であり、
// 間違っている前提で、切り出したプレビュー画像を見ながらユーザー自身が
// アイコン一覧からいつでも選び直せるようにしておくこと。

export interface IngredientSlotRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 「食材」ラベルの位置(OCRで検出したバウンディングボックス)を基準に、
 * 3つの食材アイコンのおおよその位置を推定する。
 *
 * 実際のスクリーンショット(iPhone, 1179x2556)で実測して調整した値:
 * - ラベルのテキスト右端から画像幅の約7%分右にアイコン列が始まる
 *   (緑色のボタン背景の分の余白)
 * - アイコン列は画像幅の約90%の位置で終わる(右端に少し余白がある)
 * - ラベルの縦中心とアイコン列の縦中心はほぼ一致する
 * - アイコン1個の直径はおおよそ画像幅の13.5%
 *
 * 画面サイズ・機種が変わると誤差が大きくなる可能性があるため、
 * あくまで目安。切り出し結果は必ずプレビュー表示し、目視確認できる
 * ようにすること。
 */
export function estimateIngredientSlots(
  labelBbox: OcrBbox,
  imageWidth: number
): IngredientSlotRect[] {
  const regionLeft = labelBbox.x1 + imageWidth * 0.07;
  const regionRight = imageWidth * 0.9;
  const centerY = (labelBbox.y0 + labelBbox.y1) / 2;
  const iconSize = imageWidth * 0.135;
  const slotWidth = Math.max(1, (regionRight - regionLeft) / 3);

  return [0, 1, 2].map((i) => {
    const cx = regionLeft + slotWidth * (i + 0.5);
    return {
      x: cx - iconSize / 2,
      y: centerY - iconSize / 2,
      w: iconSize,
      h: iconSize,
    };
  });
}
