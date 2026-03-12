"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, Trophy } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-950/95 lg:border-b-0">
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-3 py-2 lg:justify-end lg:pr-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-emerald-400 lg:hidden">
          Pelada da Babilônia ⚽
        </span>
        <Link
          href="/sorteio"
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors lg:hidden ${
            pathname === "/sorteio"
              ? "bg-green-100 text-green-700 dark:bg-emerald-500/20 dark:text-emerald-300"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200"
          }`}
        >
          <Trophy className="h-4 w-4" />
          Sorteio
        </Link>
        <Link
          href="/gols"
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors lg:hidden ${
            pathname === "/gols"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200"
          }`}
        >
          <Target className="h-4 w-4" />
          Gols
        </Link>
        <ThemeToggle />
      </div>
    </nav>
  );
}
