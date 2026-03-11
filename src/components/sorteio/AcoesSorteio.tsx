"use client";

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
  onModoTelao: () => void;
  resultado?: ResultadoSorteio | null;
}

export function AcoesSorteio({
  podeSortear,
  estaProcessando,
  onSortear,
  onSortearNovamente,
  onLimparResultado,
  onResetTudo,
  onModoTelao,
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

  return (
    <div className="card-animate mt-3 flex flex-col gap-2 rounded-3xl border border-gray-200 bg-white p-3 shadow-md transition-colors dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-soft-card sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap gap-2">
        <button
          type="button"
          onClick={onSortear}
          disabled={!podeSortear || estaProcessando}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400 dark:disabled:bg-emerald-500/30 sm:flex-none sm:min-w-[180px]"
        >
          {estaProcessando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {estaProcessando ? "Processando sorteio..." : "Sortear times"}
        </button>

        <button
          type="button"
          onClick={onSortearNovamente}
          disabled={!podeSortear || estaProcessando}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-emerald-500/60 dark:hover:bg-slate-900/80 sm:flex-none sm:min-w-[160px]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sortear novamente
        </button>
      </div>

      <div className="mt-1 flex flex-wrap gap-2 sm:mt-0 sm:justify-end">
        {resultado && resultado.times.length > 0 && (
          <button
            type="button"
            onClick={onModoTelao}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-600/50 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:border-amber-400 dark:hover:bg-amber-500/20"
          >
            <Tv className="h-3.5 w-3.5" />
            Modo telão
          </button>
        )}
        <button
          type="button"
          onClick={onLimparResultado}
          className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Limpar resultado
        </button>
        <button
          type="button"
          onClick={onResetTudo}
          className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-slate-700 dark:bg-slate-950 dark:text-red-200 dark:hover:border-red-500/70 dark:hover:text-red-200"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Resetar tudo
        </button>
        <button
          type="button"
          onClick={handleCompartilhar}
          disabled={!resultado}
          className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-green-300 bg-green-50 px-3 py-2 text-[11px] font-medium text-green-800 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 dark:border-emerald-600/60 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:border-emerald-400 dark:disabled:border-slate-700 dark:disabled:text-slate-500"
        >
          <Share2 className="h-3.5 w-3.5" />
          Copiar / compartilhar
        </button>
      </div>
    </div>
  );
}
