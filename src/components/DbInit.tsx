'use client';

import { useEffect } from 'react';
import { ensureSeeded } from '@/lib/db';

export default function DbInit() {
  useEffect(() => {
    ensureSeeded();
  }, []);
  return null;
}
