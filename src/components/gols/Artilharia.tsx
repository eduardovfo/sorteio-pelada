"use client";

import { Minus, Plus, Trophy } from "lucide-react";
import type { Jogador } from "@/types/sorteio";
import type { GolsRecord } from "@/types/gols";

interface Props {
  jogadores: Jogador[];
  gols: GolsRecord;
  ordenarPorRanking?: boolean;
  onAdicionar: (nome: string) => void;
  onRemover: (nome: string) => void;
}

export function Artilharia({
  jogadores,
  gols,
  ordenarPorRanking = true,
  onAdicionar,
  onRemover
}: Props) {
  const lista = jogadores.map((j) => ({ nome: j.nome, gols: gols[j.nome] ?? 0 }));

  // Só ordena por ranking (gols desc, depois nome A–Z) após salvar. Enquanto edita, ordem alfabética estável.
  const exibicao = ordenarPorRanking
    ? [...lista].sort((a, b) => {
        if (b.gols !== a.gols) return b.gols - a.gols;
        return a.nome.localeCompare(b.nome, "pt-BR");
      })
    : [...lista].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return (
    <section className="card-animate rounded-3xl border border-gray-200 bg-white p-3.5 shadow-md transition-colors dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-soft-card">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
          <Trophy className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-50">Artilharia</h2>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">
            Use os botões para marcar ou desfazer. Depois clique em Salvar para gravar no servidor.
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {exibicao.map((item, index) => (
          <li
            key={item.nome}
            className="flex items-center justify-between gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 transition-colors dark:border-slate-800 dark:bg-slate-950/80"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-[11px] font-bold text-gray-700 dark:bg-slate-800 dark:text-slate-300">
                {index + 1}º
              </span>
              <span className="truncate text-sm font-medium text-gray-900 dark:text-slate-100">
                {item.nome}
              </span>
              <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <span>{item.gols}</span>
                <span className="text-[10px]">⚽</span>
              </span>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onRemover(item.nome)}
                disabled={item.gols === 0}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label={`Remover gol de ${item.nome}`}
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onAdicionar(item.nome)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-white transition-colors hover:bg-green-700 dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400"
                aria-label={`Adicionar gol para ${item.nome}`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
