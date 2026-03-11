"use client";

import type { Jogador } from "@/types/sorteio";
import { Check, Shield, Sparkles, Zap } from "lucide-react";

interface Props {
  jogador: Jogador;
  selecionado: boolean;
  onToggle: () => void;
}

export function JogadorCard({ jogador, selecionado, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`card-animate flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left shadow-sm transition-colors
      ${
        selecionado
          ? "border-green-400 bg-green-50 shadow-md dark:border-emerald-400 dark:bg-emerald-950/40 dark:shadow-soft-card"
          : "border-gray-200 bg-white hover:border-green-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-emerald-500/60 dark:hover:bg-slate-900"
      }`}
    >
      <div
        className={`relative inline-flex h-7 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border px-[2px] transition-colors
        ${
          selecionado
            ? "border-green-500 bg-green-100 dark:border-emerald-400 dark:bg-emerald-500/20"
            : "border-gray-300 bg-gray-100 dark:border-slate-700 dark:bg-slate-900"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full transition-transform ${
            selecionado
              ? "translate-x-4 bg-green-600 dark:bg-emerald-400"
              : "translate-x-0 bg-gray-300 dark:bg-slate-200"
          }`}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <span className="truncate text-xs font-semibold text-gray-900 dark:text-slate-100">
            {jogador.nome}
          </span>
          {selecionado && (
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-[10px] text-white dark:bg-emerald-500 dark:text-emerald-950">
              <Check className="h-3 w-3" />
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[11px]">
          <BadgePosicao tipo="ZAG" valor={jogador.ZAG} />
          <BadgePosicao tipo="MEI" valor={jogador.MEI} />
          <BadgePosicao tipo="ATA" valor={jogador.ATA} />
        </div>
      </div>
    </button>
  );
}

function BadgePosicao({ tipo, valor }: { tipo: "ZAG" | "MEI" | "ATA"; valor: number }) {
  const base = "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 transition-colors";

  if (tipo === "ZAG") {
    return (
      <span className={`${base} bg-blue-100 text-blue-700 dark:bg-sky-900/60 dark:text-sky-100`}>
        <Shield className="h-3 w-3" />
        <span className="font-semibold">{tipo}</span>
        <span className="text-[10px] opacity-90 dark:text-sky-200/80">{valor}</span>
      </span>
    );
  }

  if (tipo === "MEI") {
    return (
      <span className={`${base} bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-100`}>
        <Sparkles className="h-3 w-3" />
        <span className="font-semibold">{tipo}</span>
        <span className="text-[10px] opacity-90 dark:text-amber-200/80">{valor}</span>
      </span>
    );
  }

  return (
    <span className={`${base} bg-green-100 text-green-700 dark:bg-emerald-900/60 dark:text-emerald-100`}>
      <Zap className="h-3 w-3" />
      <span className="font-semibold">{tipo}</span>
      <span className="text-[10px] opacity-90 dark:text-emerald-200/80">{valor}</span>
    </span>
  );
}
