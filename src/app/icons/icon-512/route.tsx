import { ImageResponse } from 'next/og';
import { iconGraphic } from '@/lib/icon-graphic';

export const dynamic = 'force-static';

export async function GET() {
  return new ImageResponse(iconGraphic(512), { width: 512, height: 512 });
}
