import { ImageResponse } from 'next/og';
import { iconGraphic } from '@/lib/icon-graphic';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(iconGraphic(180), { ...size });
}
