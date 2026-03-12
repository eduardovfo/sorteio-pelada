"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Posicao, ResultadoSorteio } from "@/types/sorteio";
import { Shield, Sparkles, Zap } from "lucide-react";
import { carregarResultado, isBrowser } from "@/lib/storage";

function IconePosicao({ posicao }: { posicao: Posicao }) {
  const className = "h-5 w-5 flex-shrink-0";
  if (posicao === "ZAG") return <Shield className={className} />;
  if (posicao === "MEI") return <Sparkles className={className} />;
  return <Zap className={className} />;
}

export default function TelaoPage() {
  const [resultado, setResultado] = useState<ResultadoSorteio | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    if (!isBrowser()) return;
    const ultimo = carregarResultado<ResultadoSorteio>();
    setResultado(ultimo);
    setCarregado(true);
  }, []);

  if (!carregado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <p className="text-sm text-gray-500 dark:text-slate-400">Carregando...</p>
      </main>
    );
  }

  if (!resultado || !resultado.times.length) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 dark:bg-slate-950">
        <p className="text-center text-gray-600 dark:text-slate-300">
          Nenhum resultado de sorteio salvo. Faça um sorteio em Sorteio da Pelada para exibir aqui.
        </p>
        <Link
          href="/sorteio"
          className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Ir para o Sorteio
        </Link>
      </main>
    );
  }

  const reservas = resultado.reservas ?? [];

  return (
    <main
      className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-slate-950 dark:text-slate-100"
      role="application"
      aria-label="Modo telão - times da pelada"
    >
      <Link
        href="/sorteio"
        className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900/90 dark:hover:bg-slate-800"
        aria-label="Voltar ao sorteio"
      >
        <ArrowLeft className="h-5 w-5" />
        Voltar
      </Link>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6 md:flex-row md:gap-12">
        {resultado.times.map((time) => (
          <div
            key={time.id}
            className="flex w-full max-w-md flex-col rounded-3xl border-2 border-green-300 bg-white p-6 shadow-2xl transition-colors dark:border-emerald-500/40 dark:bg-slate-900/90 md:p-8"
          >
            <h2 className="mb-1 text-2xl font-bold text-green-700 md:text-3xl dark:text-emerald-400">
              {time.nome}
            </h2>
            <p className="mb-4 text-sm text-gray-500 dark:text-slate-400">
              Força: {time.forcaTotal} · {time.formacaoUsada.descricao}
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
                    {esc.posicao} ({esc.notaNaPosicao})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {reservas.length > 0 && (
        <div className="mx-auto w-full max-w-2xl rounded-2xl border-2 border-amber-400 bg-amber-50/90 p-6 transition-colors dark:border-amber-600 dark:bg-amber-950/40">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-amber-900 dark:text-amber-100">
            <span aria-hidden>⚽</span>
            Reserva / Próxima rodada
          </h2>
          <ul className="flex flex-wrap gap-2">
            {reservas.map((j) => (
              <li
                key={j.nome}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-800 dark:bg-slate-900/70 dark:text-slate-200"
              >
                {j.nome}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
