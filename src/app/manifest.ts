import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ポケスリ分析',
    short_name: 'ポケスリ分析',
    description:
      'ポケモンスリープで捕まえたポケモンのサブスキル・食材配列・性格・メダル状況を記録し分析するツール',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f6f5ff',
    theme_color: '#2f2761',
    lang: 'ja',
    icons: [
      {
        src: '/icons/icon-192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
