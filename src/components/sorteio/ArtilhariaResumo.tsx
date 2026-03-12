"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import type { GolsRecord } from "@/types/gols";

const LIMITE = 3;

export function ArtilhariaResumo() {
  const [gols, setGols] = useState<GolsRecord | null>(null);

  useEffect(() => {
    fetch("/api/gols")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: GolsRecord) => setGols(data))
      .catch(() => setGols({}));
  }, []);

  if (gols === null) return null;

  const ranking = Object.entries(gols)
    .filter(([, qtd]) => qtd > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, LIMITE);

  if (ranking.length === 0) {
    return (
      <section className="card-animate rounded-3xl border border-gray-200 bg-white p-3 transition-colors dark:border-slate-800 dark:bg-slate-900/70 lg:p-4 2xl:p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            <h2 className="text-xs font-semibold text-gray-900 dark:text-slate-200">Artilharia</h2>
          </div>
          <Link
            href="/gols"
            className="text-[11px] font-medium text-green-600 hover:text-green-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Ver ranking
          </Link>
        </div>
        <p className="mt-2 text-[11px] text-gray-500 dark:text-slate-400">
          Nenhum gol registrado ainda.
        </p>
      </section>
    );
  }

  return (
    <section className="card-animate rounded-3xl border border-gray-200 bg-white p-3 transition-colors dark:border-slate-800 dark:bg-slate-900/70 lg:p-4 2xl:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500 dark:text-amber-400" />
          <h2 className="text-xs font-semibold text-gray-900 dark:text-slate-200">Artilharia</h2>
        </div>
        <Link
          href="/gols"
          className="text-[11px] font-medium text-green-600 hover:text-green-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          Ver ranking
        </Link>
      </div>
      <ul className="mt-2 space-y-1.5">
        {ranking.map(([nome, qtd], i) => (
          <li
            key={nome}
            className="flex items-center gap-2 text-[11px] text-gray-600 transition-colors dark:text-slate-300"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700 dark:bg-slate-800 dark:text-amber-400">
              {i + 1}º
            </span>
            <span className="flex-1 truncate font-medium text-gray-900 dark:text-slate-100">{nome}</span>
            <span className="font-semibold text-amber-600 dark:text-amber-300">{qtd} ⚽</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
