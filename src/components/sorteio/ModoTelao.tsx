"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Sparkles, X, Zap } from "lucide-react";
import type { Posicao, ResultadoSorteio } from "@/types/sorteio";
import { umaCasaDecimal } from "@/lib/format-notas";

interface Props {
  resultado: ResultadoSorteio;
  onFechar: () => void;
}

function IconePosicao({ posicao }: { posicao: Posicao }) {
  const className = "h-5 w-5 flex-shrink-0";
  if (posicao === "ZAG") return <Shield className={className} />;
  if (posicao === "MEI") return <Sparkles className={className} />;
  return <Zap className={className} />;
}

export function ModoTelao({ resultado, onFechar }: Props) {
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onFechar]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-gray-50 text-gray-900 transition-colors dark:bg-slate-950 dark:text-slate-100"
      role="dialog"
      aria-label="Modo telão - times da pelada"
    >
      <div className="absolute left-4 right-4 top-4 z-50 flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/sorteio"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900/90 dark:hover:bg-slate-800"
          aria-label="Voltar ao sorteio"
        >
          <ArrowLeft className="h-5 w-5 shrink-0" />
          Voltar
        </Link>
        <button
          type="button"
          onClick={onFechar}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900/90 dark:hover:bg-slate-800"
          aria-label="Sair do modo telão"
        >
          <X className="h-5 w-5 shrink-0" />
          Sair
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6 pt-16 md:flex-row md:gap-12">
        {resultado.times.map((time) => (
          <div
            key={time.id}
            className="flex w-full max-w-md flex-col rounded-3xl border-2 border-green-300 bg-white p-6 shadow-2xl transition-colors dark:border-emerald-500/40 dark:bg-slate-900/90 md:p-8"
          >
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-green-700 md:text-3xl dark:text-emerald-400">
                {time.nome}
              </h2>
              {time.jogadores.length < 5 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-500/25 dark:text-amber-200">
                  Incompleto ({time.jogadores.length}/5)
                </span>
              )}
            </div>
            <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">
              Força: {umaCasaDecimal(time.forcaTotal)} · {time.formacaoUsada.descricao}
            </p>
            <ul className="space-y-3">
              {time.jogadores.map((esc) => (
                <li
                  key={esc.jogador.nome + esc.posicao}
                  className="flex items-center gap-3 rounded-xl bg-gray-100 px-4 py-3 text-lg transition-colors dark:bg-slate-800/80"
                >
                  <IconePosicao posicao={esc.posicao} />
                  <span className="flex-1 font-semibold text-gray-900 dark:text-slate-100">
                    {esc.jogador.nome}
                  </span>
                  <span className="text-green-600 dark:text-emerald-400">
                    {esc.posicao} ({umaCasaDecimal(esc.notaNaPosicao)})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

