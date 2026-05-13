"use client";

import Link from "next/link";
import { Copy, Loader2, Shuffle, Trash2, Tv, UserX } from "lucide-react";
import { copiarResultadoSorteio } from "@/lib/compartilhar-resultado-sorteio";
import type { ResultadoSorteio } from "@/types/sorteio";

interface Props {
  podeSortear: boolean;
  estaProcessando: boolean;
  onSortear: () => void;
  onLimparResultado: () => void;
  onResetTudo: () => void;
  onDesativarSelecao: () => void;
  resultado?: ResultadoSorteio | null;
  motivoIndisponivel?: string;
}

export function AcoesSorteio({
  podeSortear,
  estaProcessando,
  onSortear,
  onLimparResultado,
  onResetTudo,
  onDesativarSelecao,
  resultado,
  motivoIndisponivel
}: Props) {
  const temResultado = resultado && resultado.times.length > 0;

  function handleCopiar() {
    if (!resultado) return;
    void copiarResultadoSorteio(resultado);
  }

  const outlineBtn =
    "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800";

  return (
    <div className="card-animate flex flex-col gap-2 rounded-3xl border border-gray-200 bg-white p-4 shadow-md transition-colors dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-soft-card">
      <button
        type="button"
        onClick={onSortear}
        disabled={!podeSortear || estaProcessando}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
      >
        {estaProcessando ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden />
        ) : (
          <Shuffle className="h-4 w-4 shrink-0" aria-hidden />
        )}
        {estaProcessando ? "Processando sorteio..." : "Sortear"}
      </button>

      {!podeSortear && motivoIndisponivel && (
        <p className="px-1 text-[11px] text-amber-700 dark:text-amber-300">
          {motivoIndisponivel}
        </p>
      )}

      {temResultado && (
        <>
          <div className="flex gap-2">
            <Link
              href="/telao"
              className={outlineBtn}
              title="Abrir em tela cheia (TV ou projetor)"
            >
              <Tv className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Telão
            </Link>
            <button
              type="button"
              onClick={handleCopiar}
              className={outlineBtn}
              aria-label="Copiar resultado do sorteio"
            >
              <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Copiar
            </button>
          </div>

          <button
            type="button"
            onClick={onLimparResultado}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/70"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Limpar resultado
          </button>
        </>
      )}

      <hr className="border-gray-100 dark:border-slate-800" />

      <button
        type="button"
        onClick={onDesativarSelecao}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <UserX className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Desativar todos
      </button>
      <button
        type="button"
        onClick={onResetTudo}
        className="w-full rounded-md px-3 py-1.5 text-center text-[11px] text-gray-500 transition-colors hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        Resetar tudo
      </button>
    </div>
  );
}
