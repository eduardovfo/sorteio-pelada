"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Trophy, Users } from "lucide-react";
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
import { AcoesSorteio } from "@/components/sorteio/AcoesSorteio";
import { ResultadoSorteioModal } from "@/components/sorteio/ResultadoSorteioModal";
import { ServerStatus, type StatusServidor } from "@/components/sorteio/ServerStatus";

type OrdenacaoJogador = "nome" | "rating" | "posicao";

function melhorNota(j: Jogador): number {
  return Math.max(j.ZAG, j.MEI, j.ATA);
}

function posicaoNatural(j: Jogador): "ZAG" | "MEI" | "ATA" {
  const m = melhorNota(j);
  if (j.ZAG >= m) return "ZAG";
  if (j.MEI >= m) return "MEI";
  return "ATA";
}

const ORDEM_POSICAO: Record<"ZAG" | "MEI" | "ATA", number> = {
  ZAG: 0,
  MEI: 1,
  ATA: 2
};

export default function SorteioPage() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [carregandoJogadores, setCarregandoJogadores] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [resultado, setResultado] = useState<ResultadoSorteio | null>(null);
  const [estaProcessando, setEstaProcessando] = useState(false);
  const [modalTimesAberta, setModalTimesAberta] = useState(false);
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoJogador>("nome");

  const carregarJogadores = useCallback(async () => {
    setErroCarregamento(false);
    try {
      const res = await fetch("/api/jogadores");
      if (res.ok) {
        const data = (await res.json()) as Jogador[];
        setJogadores(data);
      } else {
        setErroCarregamento(true);
        setJogadores([]);
      }
    } catch {
      setErroCarregamento(true);
      setJogadores([]);
    } finally {
      setCarregandoJogadores(false);
    }
  }, []);

  useEffect(() => {
    carregarJogadores();
  }, [carregarJogadores]);

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
      const faltam = 10 - total;
      return `Selecione mais ${faltam} ${faltam === 1 ? "jogador" : "jogadores"} para sortear.`;
    }
    return undefined;
  }, [jogadoresSelecionados.length]);

  const statusServidor: StatusServidor = useMemo(() => {
    if (carregandoJogadores) return "loading";
    if (erroCarregamento) return "offline";
    return "online";
  }, [carregandoJogadores, erroCarregamento]);

  const jogadoresVisiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    let lista = jogadores;
    if (termo) {
      lista = lista.filter((j) => j.nome.toLowerCase().includes(termo));
    }
    const ordenado = [...lista];
    if (ordenacao === "rating") {
      ordenado.sort(
        (a, b) =>
          melhorNota(b) - melhorNota(a) || a.nome.localeCompare(b.nome, "pt-BR")
      );
    } else if (ordenacao === "posicao") {
      ordenado.sort((a, b) => {
        const dp =
          ORDEM_POSICAO[posicaoNatural(a)] - ORDEM_POSICAO[posicaoNatural(b)];
        if (dp !== 0) return dp;
        return a.nome.localeCompare(b.nome, "pt-BR");
      });
    } else {
      ordenado.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    }
    return ordenado;
  }, [jogadores, busca, ordenacao]);

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

  const executarSorteio = useCallback(() => {
    if (!prontoParaSortear || estaProcessando) return;
    setEstaProcessando(true);
    setTimeout(() => {
      const resultadoNovo = sortearTimesEquilibrados(
        jogadoresSelecionados,
        resultado
      );
      setEstaProcessando(false);
      if (resultadoNovo) {
        setResultado(resultadoNovo);
        salvarResultado(resultadoNovo);
        setModalTimesAberta(true);
      }
    }, 550);
  }, [prontoParaSortear, estaProcessando, jogadoresSelecionados, resultado]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      const alvo = e.target as HTMLElement | null;
      if (!alvo) return;
      const tag = alvo.tagName;
      const editavel =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        alvo.isContentEditable;
      if (editavel) return;
      if (modalTimesAberta) return;
      e.preventDefault();
      executarSorteio();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [executarSorteio, modalTimesAberta]);

  function limparResultado() {
    setResultado(null);
    setModalTimesAberta(false);
    if (isBrowser()) {
      window.localStorage.removeItem("sorteio-pelada:ultimo-resultado");
    }
  }

  function resetarTudo() {
    setSelecionados(new Set());
    setResultado(null);
    setModalTimesAberta(false);
    if (isBrowser()) {
      window.localStorage.clear();
    }
  }

  if (carregandoJogadores) {
    return (
      <main className="flex min-h-screen w-full items-center justify-center px-3 py-4">
        <p className="text-sm text-gray-500 dark:text-slate-400">Carregando jogadores...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full items-start justify-start py-4 md:py-8">
      <div className="w-full px-4 lg:px-6 xl:px-8 2xl:px-10">
        <div className="mx-auto flex max-w-md flex-col gap-3 rounded-[2.6rem] border border-gray-200 bg-white p-3 shadow-lg transition-colors dark:rounded-3xl dark:border-slate-800/80 dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-950/95 dark:shadow-soft-card md:max-w-none md:rounded-3xl md:p-5 lg:gap-5 lg:p-6 xl:gap-6 xl:p-8 2xl:gap-8 2xl:p-10">
          <header className="sticky top-3 z-10 mb-2 rounded-3xl border border-gray-200 bg-white/95 px-4 py-3 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-950/90 lg:px-6 2xl:px-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-green-100 text-green-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Trophy className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-emerald-400">
                    Pelada da Babilonia
                  </p>
                  <h1 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                    Sorteio da Pelada
                  </h1>
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 space-y-3 xl:space-y-4">
              <ResumoPainel
                totalJogadores={jogadores.length}
                selecionados={jogadoresSelecionados.length}
                formacaoPrioritaria={FORMACOES_PRIORITARIAS[0]}
                resultado={resultado ?? undefined}
              />

              <section className="card-animate rounded-3xl border border-gray-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-900/80">
                <header className="flex flex-col gap-3 border-b border-gray-100 px-3.5 py-3 dark:border-slate-800 lg:px-5 lg:py-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                      Jogadores da pelada
                    </h2>
                    <div className="flex items-center gap-3 text-[11px]">
                      <button
                        type="button"
                        onClick={selecionarTodos}
                        className="text-green-600 hover:text-green-700 dark:text-emerald-300 dark:hover:text-emerald-200"
                      >
                        Selecionar todos
                      </button>
                      <span className="text-gray-300 dark:text-slate-700">|</span>
                      <button
                        type="button"
                        onClick={limparSelecao}
                        className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative min-w-0 flex-1">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                      <input
                        type="search"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar jogador..."
                        className="w-full rounded-md border border-gray-200 bg-white py-1.5 pl-7 pr-2 text-xs text-gray-900 placeholder:text-gray-400 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400"
                      />
                    </div>
                    <select
                      value={ordenacao}
                      onChange={(e) => setOrdenacao(e.target.value as OrdenacaoJogador)}
                      className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-green-400 focus:outline-none focus:ring-1 focus:ring-green-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-emerald-400 dark:focus:ring-emerald-400"
                      aria-label="Ordenar jogadores"
                    >
                      <option value="nome">A-Z</option>
                      <option value="rating">Maior nota</option>
                      <option value="posicao">Posicao</option>
                    </select>
                  </div>
                </header>

                <div className="max-h-[360px] overflow-y-auto rounded-b-3xl lg:max-h-[520px] lg:min-h-[380px] xl:max-h-[500px] 2xl:max-h-[620px]">
                  {jogadoresVisiveis.length === 0 ? (
                    <p className="px-4 py-8 text-center text-xs text-gray-500 dark:text-slate-400">
                      Nenhum jogador encontrado.
                    </p>
                  ) : (
                    jogadoresVisiveis.map((jogador) => (
                      <JogadorCard
                        key={jogador.nome}
                        jogador={jogador}
                        selecionado={selecionados.has(jogador.nome)}
                        onToggle={() => alternarSelecao(jogador.nome)}
                      />
                    ))
                  )}
                </div>
              </section>
            </div>

            <aside className="flex min-w-0 flex-col gap-4 self-start lg:sticky lg:top-4">
              <ServerStatus
                status={statusServidor}
                activePlayers={jogadoresSelecionados.length}
              />

              <AcoesSorteio
                podeSortear={prontoParaSortear}
                estaProcessando={estaProcessando}
                onSortear={executarSorteio}
                onLimparResultado={limparResultado}
                onResetTudo={resetarTudo}
                onDesativarSelecao={limparSelecao}
                resultado={resultado ?? undefined}
                motivoIndisponivel={motivoIndisponivel}
              />

              {resultado && !modalTimesAberta && (
                <button
                  type="button"
                  onClick={() => setModalTimesAberta(true)}
                  className="card-animate flex w-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800 transition-colors hover:bg-green-100 dark:border-emerald-700/50 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60"
                >
                  <Users className="h-4 w-4 shrink-0" aria-hidden />
                  Ver times sorteados
                </button>
              )}
            </aside>
          </div>
        </div>
      </div>

      <ResultadoSorteioModal
        aberto={modalTimesAberta}
        onFechar={() => setModalTimesAberta(false)}
        resultado={resultado}
      />
    </main>
  );
}
