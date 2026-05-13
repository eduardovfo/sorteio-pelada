"use client";

import { ThemeToggle } from "@/components/theme-toggle";

export function Nav() {
  return (
    <nav className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-950/95 lg:border-b-0">
      <div className="flex w-full items-center justify-between gap-2 px-3 py-2 lg:justify-end lg:pr-4">
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 lg:hidden">
          <span className="min-w-0 truncate text-[11px] font-bold uppercase tracking-wider text-green-600 dark:text-emerald-400">
            Pelada da Babilônia ⚽
          </span>
          <ThemeToggle />
        </div>

        {/* Desktop: apenas o toggle de tema alinhado à direita */}
        <div className="hidden items-center justify-end lg:flex">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
