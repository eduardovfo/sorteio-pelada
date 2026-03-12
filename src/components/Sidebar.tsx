"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Target, Trophy } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 z-30 hidden h-screen w-24 flex-col border-r border-gray-200 bg-white/95 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-950/95 lg:flex xl:w-28 2xl:w-32"
      aria-label="Navegação principal"
    >
      <div className="flex flex-col gap-1 p-2 lg:p-3 xl:p-4">
        <p className="mb-2 border-b border-gray-200 pb-2 text-center text-[10px] font-bold uppercase leading-tight tracking-wider text-green-600 dark:border-slate-800 dark:text-emerald-400 lg:mb-3 lg:pb-3 xl:text-xs">
          Pelada da Babilônia ⚽
        </p>
        <Link
          href="/sorteio"
          className={`flex items-center justify-center gap-2 rounded-2xl px-2 py-2.5 text-xs font-medium transition-colors xl:justify-start xl:gap-3 xl:px-4 xl:py-3 xl:text-sm ${
            pathname === "/sorteio"
              ? "bg-green-100 text-green-700 dark:bg-emerald-500/20 dark:text-emerald-300"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200"
          }`}
        >
<Trophy className="h-4 w-4 shrink-0 xl:h-5 xl:w-5" />
          Sorteio
        </Link>
        <Link
          href="/gols"
          className={`flex items-center justify-center gap-2 rounded-2xl px-2 py-2.5 text-xs font-medium transition-colors xl:justify-start xl:gap-3 xl:px-4 xl:py-3 xl:text-sm ${
              pathname === "/gols"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200"
          }`}
        >
          <Target className="h-4 w-4 shrink-0 xl:h-5 xl:w-5" />
          Gols
        </Link>
      </div>
    </aside>
  );
}
