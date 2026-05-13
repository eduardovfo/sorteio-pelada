"use client";

import type { Jogador } from "@/types/sorteio";
import { arredondaUmaCasa, umaCasaDecimal } from "@/lib/format-notas";
import { ArrowLeftRight, Flame, Shield } from "lucide-react";

interface Props {
  jogador: Jogador;
  selecionado: boolean;
  onToggle: () => void;
}

export function JogadorCard({ jogador, selecionado, onToggle }: Props) {
  const rating = arredondaUmaCasa((jogador.ZAG + jogador.MEI + jogador.ATA) / 3);
  const tituloMedia = `Média (ATK ${umaCasaDecimal(jogador.ATA)} | MED ${umaCasaDecimal(jogador.MEI)} | DEF ${umaCasaDecimal(jogador.ZAG)})`;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`card-animate flex w-full flex-wrap items-center gap-x-2 gap-y-1 border-b border-gray-100 px-3 py-1.5 text-left transition-colors last:border-b-0 hover:bg-gray-50 dark:border-slate-800/80 dark:hover:bg-slate-800/50 ${
        selecionado ? "bg-green-50/80 dark:bg-emerald-950/25" : "bg-white dark:bg-slate-900/40"
      }`}
    >
      <div
        className={`relative inline-flex h-5 w-8 shrink-0 cursor-pointer items-center rounded-full border px-[2px] transition-colors ${
          selecionado
            ? "border-green-500 bg-green-100 dark:border-emerald-400 dark:bg-emerald-500/20"
            : "border-gray-300 bg-gray-100 dark:border-slate-600 dark:bg-slate-800"
        }`}
        aria-hidden
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full transition-transform ${
            selecionado
              ? "translate-x-3 bg-green-600 dark:bg-emerald-400"
              : "translate-x-0 bg-gray-300 dark:bg-slate-300"
          }`}
        />
      </div>

      <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-slate-100">
        {jogador.nome}
      </span>

      <div className="flex shrink-0 items-center gap-1">
        <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0 text-[10px] font-medium text-red-800 dark:bg-red-950/40 dark:text-red-300">
          <Flame className="h-2.5 w-2.5 shrink-0" aria-hidden />
          ATK {umaCasaDecimal(jogador.ATA)}
        </span>
        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0 text-[10px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <ArrowLeftRight className="h-2.5 w-2.5 shrink-0" aria-hidden />
          MED {umaCasaDecimal(jogador.MEI)}
        </span>
        <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-1.5 py-0 text-[10px] font-medium text-green-800 dark:bg-green-950/40 dark:text-green-300">
          <Shield className="h-2.5 w-2.5 shrink-0" aria-hidden />
          DEF {umaCasaDecimal(jogador.ZAG)}
        </span>
      </div>

      <span
        className="shrink-0 text-[11px] font-semibold text-gray-500 dark:text-slate-400"
        title={tituloMedia}
      >
        {umaCasaDecimal(rating)}
      </span>
    </button>
  );
}
