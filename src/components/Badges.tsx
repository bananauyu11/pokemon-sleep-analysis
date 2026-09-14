import {
  MEDAL_LABELS,
  SPECIALTY_LABELS,
  type MedalRank,
  type SpecialtyType,
} from '@/lib/types';

const SPECIALTY_STYLE: Record<SpecialtyType, string> = {
  berry: 'bg-brand-berry/15 text-brand-berry',
  ingredient: 'bg-brand-ingredient/15 text-brand-ingredient',
  skill: 'bg-brand-skill/15 text-brand-skill',
  all: 'bg-brand-all/15 text-brand-all',
};

const MEDAL_STYLE: Record<MedalRank, string> = {
  none: 'bg-black/5 text-black/40',
  bronze: 'bg-amber-700/15 text-amber-800',
  silver: 'bg-slate-400/20 text-slate-600',
  gold: 'bg-yellow-400/25 text-yellow-700',
};

export function SpecialtyBadge({ specialty }: { specialty: SpecialtyType }) {
  return (
    <span className={`chip ${SPECIALTY_STYLE[specialty]}`}>
      {SPECIALTY_LABELS[specialty]}
    </span>
  );
}

export function MedalBadge({ medal }: { medal: MedalRank }) {
  return (
    <span className={`chip ${MEDAL_STYLE[medal]}`}>メダル: {MEDAL_LABELS[medal]}</span>
  );
}
