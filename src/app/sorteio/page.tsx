"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldHalf, Trophy } from "lucide-react";
import type { Jogador } from "@/types/sorteio";
import { FORMACOES_PRIORITARIAS } from "@/lib/formacoes";
import {
  carregarResultado,
  carregarSelecao,
  isBrowser,
  salvarResultado,
  salvarSelecao
} from "@/lib/storage";
import { sortearTimesEquilibrados } from "@/lib/sorteioAlgoritmo";
import type { ResultadoSorteio } from "@/types/sorteio";
import { JogadorCard } from "@/components/sorteio/JogadorCard";
import { ResumoPainel } from "@/components/sorteio/ResumoPainel";
import { TimesResultado } from "@/components/sorteio/TimesResultado";
import { AcoesSorteio } from "@/components/sorteio/AcoesSorteio";
import { ComoFunciona } from "@/components/sorteio/ComoFunciona";
import { ArtilhariaResumo } from "@/components/sorteio/ArtilhariaResumo";

export default function SorteioPage() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [carregandoJogadores, setCarregandoJogadores] = useState(true);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [resultado, setResultado] = useState<ResultadoSorteio | null>(null);
  const [estaProcessando, setEstaProcessando] = useState(false);

  const carregarJogadores = useCallback(async () => {
    try {
      const res = await fetch("/api/jogadores");
      if (res.ok) {
        const data = (await res.json()) as Jogador[];
        setJogadores(data);
      }
    } finally {
      setCarregandoJogadores(false);
    }
  }, []);

  useEffect(() => {
    carregarJogadores();
  }, [carregarJogadores]);

  const jogadoresOrdenados = useMemo(
    () => [...jogadores].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [jogadores]
  );

  useEffect(() => {
    if (!isBrowser()) return;
    const nomesSelecionados = carregarSelecao();
    if (nomesSelecionados.length) {
      setSelecionados(new Set(nomesSelecionados));
    }
    const ultimo = carregarResultado<ResultadoSorteio>();
    if (ultimo) {
      setResultado(ultimo);
    }
  }, []);

  useEffect(() => {
    salvarSelecao(Array.from(selecionados));
  }, [selecionados]);

  const jogadoresSelecionados = useMemo(
    () => jogadores.filter((j) => selecionados.has(j.nome)),
    [jogadores, selecionados]
  );

  const prontoParaSortear = useMemo(() => {
    return jogadoresSelecionados.length >= 10;
  }, [jogadoresSelecionados.length]);

  const motivoIndisponivel = useMemo(() => {
    const total = jogadoresSelecionados.length;
    if (total < 10) {
      return "É necessário ter pelo menos 10 jogadores selecionados.";
    }
    return undefined;
  }, [jogadoresSelecionados.length]);

  function alternarSelecao(nome: string) {
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(nome)) {
        novo.delete(nome);
      } else {
        novo.add(nome);
      }
      return novo;
    });
  }

  function selecionarTodos() {
    setSelecionados(new Set(jogadores.map((j) => j.nome)));
  }

  function limparSelecao() {
    setSelecionados(new Set());
  }

  function executarSorteio() {
    if (!prontoParaSortear) return;
    setEstaProcessando(true);
    setTimeout(() => {
      const resultadoNovo = sortearTimesEquilibrados(jogadoresSelecionados);
      setEstaProcessando(false);
      if (resultadoNovo) {
        setResultado(resultadoNovo);
        salvarResultado(resultadoNovo);
      }
    }, 550);
  }

  function sortearNovamente() {
    executarSorteio();
  }

  function limparResultado() {
    setResultado(null);
    if (isBrowser()) {
      window.localStorage.removeItem("sorteio-pelada:ultimo-resultado");
    }
  }

  function resetarTudo() {
    setSelecionados(new Set());
    setResultado(null);
    if (isBrowser()) {
      window.localStorage.clear();
    }
  }

  if (carregandoJogadores) {
    return (
      <main className="flex min-h-screen items-center justify-center px-3 py-4">
        <p className="text-sm text-gray-500 dark:text-slate-400">Carregando jogadores...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center py-4 md:py-8">
      <div className="mx-auto w-full max-w-5xl px-4 lg:max-w-6xl lg:px-6 xl:max-w-7xl xl:px-8 2xl:max-w-[1900px] 2xl:px-12">
        <div className="mx-auto flex max-w-md flex-col gap-3 rounded-[2.6rem] border border-gray-200 bg-white p-3 shadow-lg transition-colors dark:rounded-3xl dark:border-slate-800/80 dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-950/95 dark:shadow-soft-card md:max-w-none md:rounded-3xl md:p-5 lg:gap-5 lg:p-6 xl:gap-6 xl:p-8 2xl:gap-8 2xl:p-10">
          <header className="sticky top-3 z-10 mb-2 rounded-3xl border border-gray-200 bg-white/95 px-4 py-3 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-950/90 lg:px-6 2xl:px-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-green-100 text-green-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Trophy className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-emerald-400">
                    Pelada da Babilônia ⚽
                  </p>
                  <h1 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                    Sorteio da Pelada
                  </h1>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    Times inteligentes e equilibrados por posição e nível.
                  </p>
                </div>
              </div>
              <div className="hidden items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-600 md:inline-flex dark:bg-slate-900 dark:text-slate-300">
                <ShieldHalf className="h-3 w-3 text-green-600 dark:text-emerald-400" />
                <span>Algoritmo focado em equilíbrio</span>
              </div>
            </div>
          </header>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.1fr)] lg:grid-cols-12 lg:gap-8 xl:gap-8 2xl:grid-cols-16 2xl:gap-10">
            <div className="space-y-3 lg:col-span-8 lg:space-y-4 xl:col-span-8 2xl:col-span-10">
              <ResumoPainel
                totalJogadores={jogadores.length}
                selecionados={jogadoresSelecionados.length}
                formacaoPrioritaria={FORMACOES_PRIORITARIAS[0]}
                prontoParaSortear={prontoParaSortear}
                motivoIndisponivel={motivoIndisponivel}
                resultado={resultado ?? undefined}
              />

              <section className="card-animate rounded-3xl border border-gray-200 bg-white p-3.5 transition-colors dark:border-slate-800 dark:bg-slate-900/80 lg:p-5 2xl:p-6">
                <header className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                      Jogadores da pelada
                    </h2>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">
                      Toque para marcar quem vai participar do sorteio.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 text-right text-[11px]">
                    <button
                      type="button"
                      onClick={selecionarTodos}
                      className="text-green-600 hover:text-green-700 dark:text-emerald-300 dark:hover:text-emerald-200"
                    >
                      Selecionar todos
                    </button>
                    <button
                      type="button"
                      onClick={limparSelecao}
                      className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      Limpar seleção
                    </button>
                  </div>
                </header>

                <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1 lg:max-h-[520px] lg:min-h-[380px] xl:max-h-[500px] 2xl:max-h-[620px]">
                  {jogadoresOrdenados.map((jogador) => (
                    <JogadorCard
                      key={jogador.nome}
                      jogador={jogador}
                      selecionado={selecionados.has(jogador.nome)}
                      onToggle={() => alternarSelecao(jogador.nome)}
                    />
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-2 md:space-y-3 lg:col-span-4 lg:space-y-4 xl:col-span-4 2xl:col-span-6 2xl:space-y-5">
              <AcoesSorteio
                podeSortear={prontoParaSortear}
                estaProcessando={estaProcessando}
                onSortear={executarSorteio}
                onSortearNovamente={sortearNovamente}
                onLimparResultado={limparResultado}
                onResetTudo={resetarTudo}
                resultado={resultado ?? undefined}
              />

              <ArtilhariaResumo />

              <ComoFunciona />

              {!resultado && (
                <section className="card-animate mt-2 rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-500 transition-colors dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400 lg:mt-4 lg:p-6 lg:text-sm 2xl:p-8">
                  <p className="font-medium text-gray-700 dark:text-slate-300">
                    Nenhum sorteio realizado ainda.
                  </p>
                  <p className="mt-1">
                    Selecione pelo menos 10 jogadores e toque em{" "}
                    <span className="font-semibold text-green-600 dark:text-emerald-300">
                      “Sortear times”
                    </span>{" "}
                    para ver os times montados automaticamente.
                  </p>
                </section>
              )}
            </div>

            {resultado && (
              <div className="mt-4 w-full md:mt-6 lg:col-span-12 lg:mt-8 xl:col-span-12 2xl:col-span-16 2xl:mt-10">
                <TimesResultado resultado={resultado} />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

