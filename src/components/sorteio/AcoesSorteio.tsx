"use client";

import Link from "next/link";
import { Loader2, RefreshCw, Share2, Trash2, Tv } from "lucide-react";
import { gerarTextoCompartilhamento } from "@/lib/sorteioAlgoritmo";
import type { ResultadoSorteio } from "@/types/sorteio";

interface Props {
  podeSortear: boolean;
  estaProcessando: boolean;
  onSortear: () => void;
  onSortearNovamente: () => void;
  onLimparResultado: () => void;
  onResetTudo: () => void;
  resultado?: ResultadoSorteio | null;
}

export function AcoesSorteio({
  podeSortear,
  estaProcessando,
  onSortear,
  onSortearNovamente,
  onLimparResultado,
  onResetTudo,
  resultado
}: Props) {
  async function handleCompartilhar() {
    if (!resultado) return;
    const texto = gerarTextoCompartilhamento(resultado);

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Sorteio da pelada",
          text: texto
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(texto);
        alert("Resultado copiado para a área de transferência.");
      }
    } catch {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(texto);
        alert("Resultado copiado para a área de transferência.");
      }
    }
  }

  const temResultado = resultado && resultado.times.length > 0;

  const btnSecundario =
    "inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border text-xs font-medium transition-colors lg:h-11";

  return (
    <div className="card-animate mt-3 flex flex-col gap-2 rounded-3xl border border-gray-200 bg-white p-3 shadow-md transition-colors dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-soft-card lg:grid lg:grid-cols-4 lg:gap-3 lg:p-4 2xl:gap-4 2xl:p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400 lg:col-span-4 lg:mb-1">
        Ações do sorteio
      </h2>

      {/* Linha 1: ação principal + Modo telão */}
      <button
        type="button"
        onClick={onSortear}
        disabled={!podeSortear || estaProcessando}
        className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400 dark:disabled:bg-emerald-500/30 lg:col-span-3 lg:h-12 ${!temResultado ? "lg:col-span-4" : ""}`}
      >
        {estaProcessando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {estaProcessando ? "Processando sorteio..." : "Sortear times"}
      </button>

      {temResultado && (
        <Link
          href="/telao"
          className={`${btnSecundario} border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-600/50 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20 lg:col-span-1 lg:h-12`}
          title="Abrir em tela cheia (TV ou projetor)"
        >
          <Tv className="h-4 w-4 shrink-0" />
          Modo telão
        </Link>
      )}

      {/* Linha 2: Sortear novamente + Copiar */}
      <button
        type="button"
        onClick={onSortearNovamente}
        disabled={!podeSortear || estaProcessando}
        className={`${btnSecundario} col-span-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-emerald-500/60 dark:hover:bg-slate-900/80`}
      >
        <RefreshCw className="h-3.5 w-3.5 shrink-0" />
        Sortear novamente
      </button>

      <button
        type="button"
        onClick={handleCompartilhar}
        disabled={!resultado}
        className={`${btnSecundario} col-span-2 border-green-300 bg-green-50 text-green-800 hover:bg-green-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 dark:border-emerald-600/60 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:border-emerald-400 dark:disabled:border-slate-700 dark:disabled:text-slate-500`}
      >
        <Share2 className="h-3.5 w-3.5 shrink-0" />
        Copiar / compartilhar
      </button>

      {/* Linha 3: Limpar + Resetar (destrutivo) */}
      <button
        type="button"
        onClick={onLimparResultado}
        className={`${btnSecundario} col-span-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-500`}
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" />
        Limpar resultado
      </button>

      <button
        type="button"
        onClick={onResetTudo}
        className={`${btnSecundario} col-span-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200 dark:hover:border-red-500/50 dark:hover:bg-red-950/70`}
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" />
        Resetar tudo
      </button>
    </div>
  );
}
