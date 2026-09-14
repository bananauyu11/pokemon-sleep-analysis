import { Suspense } from 'react';
import SpeciesClient from './SpeciesClient';

export default function SpeciesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-black/40">読み込み中...</p>}>
      <SpeciesClient />
    </Suspense>
  );
}
