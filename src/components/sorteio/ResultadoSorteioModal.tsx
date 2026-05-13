"use client";

import { useEffect } from "react";
import { IconBrandWhatsapp } from "@tabler/icons-react";
import { Copy, X } from "lucide-react";
import type { ResultadoSorteio } from "@/types/sorteio";
import {
  abrirWhatsAppComResultadoSorteio,
  copiarResultadoSorteio
} from "@/lib/compartilhar-resultado-sorteio";
import { TimesResultado } from "@/components/sorteio/TimesResultado";

interface Props {
  aberto: boolean;
  onFechar: () => void;
  resultado: ResultadoSorteio | null;
}

export function ResultadoSorteioModal({ aberto, onFechar, resultado }: Props) {
  useEffect(() => {
    if (!aberto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aberto, onFechar]);

  useEffect(() => {
    if (!aberto) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [aberto]);

  if (!aberto || !resultado || !resultado.times.length) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px] transition-opacity dark:bg-black/60"
        aria-label="Fechar modal de times"
        onClick={onFechar}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-times-titulo"
        className="relative flex max-h-[92vh] w-full max-w-6xl flex-col rounded-t-3xl border border-gray-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-3xl"
      >
        <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-slate-800 sm:gap-3 sm:px-5">
          <h2
            id="modal-times-titulo"
            className="min-w-0 flex-1 text-base font-semibold text-gray-900 dark:text-slate-50"
          >
            Times sorteados
          </h2>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => void copiarResultadoSorteio(resultado)}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              aria-label="Copiar resultado do sorteio"
            >
              <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Copiar</span>
            </button>
            <button
              type="button"
              onClick={() => abrirWhatsAppComResultadoSorteio(resultado)}
              className="inline-flex items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              aria-label="Enviar resultado no WhatsApp"
            >
              <IconBrandWhatsapp className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={onFechar}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-6 pt-2 sm:px-5 sm:pb-8">
          <TimesResultado resultado={resultado} className="mt-0 space-y-3 lg:space-y-4 2xl:space-y-5" />
        </div>
      </div>
    </div>
  );
}
