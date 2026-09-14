import { ImageResponse } from 'next/og';
import { iconGraphic } from '@/lib/icon-graphic';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(iconGraphic(32), { ...size });
}
