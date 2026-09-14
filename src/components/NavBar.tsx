'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: '分析' },
  { href: '/pokemon', label: '記録一覧' },
  { href: '/pokemon/new', label: '手動追加' },
  { href: '/import', label: '取込' },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-brand-night text-white">
      <div className="mx-auto flex max-w-5xl items-center gap-2 overflow-x-auto px-4 py-3">
        <Link href="/" className="mr-2 flex shrink-0 items-center gap-2 font-bold">
          <span className="text-xl">🌙</span>
          <span>ポケスリ分析</span>
        </Link>
        <nav className="flex shrink-0 gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                  active
                    ? 'bg-brand-accent text-brand-night-dark'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
