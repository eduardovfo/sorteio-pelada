'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Target, Trophy, X } from "lucide-react";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  function close() {
    setOpen(false);
  }

  const baseLinkClasses =
    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu de navegação"
        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] lg:hidden"
          onClick={close}
        >
          <div
            className="fixed inset-y-0 left-0 z-50 flex w-64 max-w-[80%] flex-col border-r border-gray-200 bg-white/95 p-3 shadow-xl transition-transform dark:border-slate-800 dark:bg-slate-950/95"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="mb-3 flex items-center justify-between gap-2 border-b border-gray-200 pb-2 dark:border-slate-800">
              <div className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-emerald-400">
                Pelada da Babilônia ⚽
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Fechar menu"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <nav className="flex flex-1 flex-col gap-1">
              <Link
                href="/sorteio"
                onClick={close}
                className={`${baseLinkClasses} ${
                  pathname === "/sorteio"
                    ? "bg-green-100 text-green-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200"
                }`}
              >
                <Trophy className="h-4 w-4" />
                Sorteio
              </Link>
              <Link
                href="/gols"
                onClick={close}
                className={`${baseLinkClasses} ${
                  pathname === "/gols"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-200"
                }`}
              >
                <Target className="h-4 w-4" />
                Gols
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

