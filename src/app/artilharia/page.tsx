"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Medal, Pencil, Save, Target, Trophy, X } from "lucide-react";
import type { DestaquesPelada, Pelada, PeladaComRanking } from "@/types/pelada";
import type { GolsRecord } from "@/types/gols";
import type { Jogador } from "@/types/sorteio";
import { Artilharia } from "@/components/gols/Artilharia";

const DESTAQUES_UI: {
  key: keyof DestaquesPelada;
  titulo: string;
  desc: string;
}[] = [
  { key: "craque", titulo: "Craque", desc: "maior avaliação" },
  { key: "pereba", titulo: "Pereba", desc: "menor avaliação" },
  { key: "artilheiro", titulo: "Artilheiro", desc: "mais gols" },
  { key: "garcom", titulo: "Garçom", desc: "mais assistências" },
  { key: "xerifao", titulo: "Xerifão", desc: "mais desarmes" },
  { key: "paredao", titulo: "Paredão", desc: "mais defesas difíceis" },
  { key: "bolaMurcha", titulo: "Bola Murcha", desc: "mais falhas" },
];

function SecaoDestaques({ d }: { d: DestaquesPelada }) {
  const temAlgum = DESTAQUES_UI.some((x) => {
    const v = d[x.key];
    return v != null && String(v).trim() !== "";
  });
  if (!temAlgum) {
    return (
      <p className="text-[11px] text-gray-500 dark:text-slate-400">
        Destaques ainda não preenchidos. Edite em{" "}
        <Link href="/gols" className="font-medium text-green-600 dark:text-emerald-400">
          Marcar gols
        </Link>
        .
      </p>
    );
  }
  return (
    <dl className="grid gap-2 sm:grid-cols-2">
      {DESTAQUES_UI.map(({ key, titulo, desc }) => {
        const valor = d[key];
        const texto =
          valor != null && String(valor).trim() !== "" ? String(valor) : "—";
        return (
          <div
            key={key}
            className="rounded-2xl border border-gray-200 bg-gray-50/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/60"
          >
            <dt className="text-[10px] font-semibold text-gray-700 dark:text-slate-300">
              {titulo}{" "}
              <span className="font-normal text-gray-500 dark:text-slate-500">
                ({desc})
              </span>
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-gray-900 dark:text-slate-100">
              {texto}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function rotuloDataPelada(iso: string): string {
  const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d || Number.isNaN(y)) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ArtilhariaPage() {
  const [listaPeladas, setListaPeladas] = useState<Pelada[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState<string>("");
  const [peladaDetalhe, setPeladaDetalhe] = useState<PeladaComRanking | null>(
    null
  );
  const [carregandoPelada, setCarregandoPelada] = useState(false);
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [golsGeral, setGolsGeral] = useState<GolsRecord>({});
  const [golsGeralPersistidos, setGolsGeralPersistidos] =
    useState<GolsRecord>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessaoVerificada, setSessaoVerificada] = useState(false);
  const [salvandoGeral, setSalvandoGeral] = useState(false);
  const [alteradoGeral, setAlteradoGeral] = useState(false);
  const [editandoGeral, setEditandoGeral] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const rankingGeralLeitura = useMemo(
    () =>
      Object.entries(golsGeralPersistidos)
        .filter(([, q]) => q > 0)
        .sort((a, b) =>
          b[1] !== a[1]
            ? b[1] - a[1]
            : a[0].localeCompare(b[0], "pt-BR")
        ),
    [golsGeralPersistidos]
  );

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [rPeladas, rGeral, rJogadores, rSessao] = await Promise.all([
        fetch("/api/peladas"),
        fetch("/api/gols"),
        fetch("/api/jogadores"),
        fetch("/api/auth/session"),
      ]);
      if (!rPeladas.ok) throw new Error("peladas");
      const sessao = (await rSessao.json()) as { admin?: boolean };
      setIsAdmin(sessao.admin === true);
      setSessaoVerificada(true);

      const lista = (await rPeladas.json()) as Pelada[];
      setListaPeladas(lista);
      setDataSelecionada(lista[0]?.dataPelada ?? "");

      const geralApi = rGeral.ok ? ((await rGeral.json()) as GolsRecord) : {};

      let jList: Jogador[] = [];
      if (rJogadores.ok) {
        jList = (await rJogadores.json()) as Jogador[];
        setJogadores(jList);
      } else {
        setJogadores([]);
      }

      const record: GolsRecord = {};
      for (const j of jList) {
        const n = j.nome?.trim();
        if (!n) continue;
        record[n] = geralApi[n] ?? 0;
      }
      setGolsGeral(record);
      setGolsGeralPersistidos(record);
      setAlteradoGeral(false);
      setEditandoGeral(false);
    } catch {
      setErro("Não foi possível carregar a artilharia.");
      setListaPeladas([]);
      setDataSelecionada("");
      setPeladaDetalhe(null);
      setJogadores([]);
      setGolsGeral({});
      setGolsGeralPersistidos({});
      setSessaoVerificada(true);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!dataSelecionada) {
      setPeladaDetalhe(null);
      setCarregandoPelada(false);
      return;
    }
    let ativo = true;
    setCarregandoPelada(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/peladas/resumo?data=${encodeURIComponent(dataSelecionada)}`
        );
        if (!ativo) return;
        if (!res.ok) {
          setPeladaDetalhe(null);
          return;
        }
        const item = (await res.json()) as PeladaComRanking;
        setPeladaDetalhe(item);
      } catch {
        if (ativo) setPeladaDetalhe(null);
      } finally {
        if (ativo) setCarregandoPelada(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [dataSelecionada]);

  useEffect(() => {
    if (!isAdmin) setEditandoGeral(false);
  }, [isAdmin]);

  function abrirEdicaoGeral() {
    setGolsGeral({ ...golsGeralPersistidos });
    setAlteradoGeral(false);
    setEditandoGeral(true);
    setErro(null);
  }

  function cancelarEdicaoGeral() {
    setGolsGeral({ ...golsGeralPersistidos });
    setAlteradoGeral(false);
    setEditandoGeral(false);
    setErro(null);
  }

  function adicionarGolGeral(nome: string) {
    if (!isAdmin || !editandoGeral) return;
    setGolsGeral((atual) => ({
      ...atual,
      [nome]: (atual[nome] ?? 0) + 1,
    }));
    setAlteradoGeral(true);
    setErro(null);
  }

  function removerGolGeral(nome: string) {
    if (!isAdmin || !editandoGeral) return;
    setGolsGeral((atual) => {
      const valor = atual[nome] ?? 0;
      if (valor <= 0) return atual;
      return { ...atual, [nome]: valor - 1 };
    });
    setAlteradoGeral(true);
    setErro(null);
  }

  async function salvarGeralClick() {
    if (!isAdmin || !editandoGeral || jogadores.length === 0) return;
    setSalvandoGeral(true);
    setErro(null);
    try {
      const corpo: GolsRecord = {};
      for (const j of jogadores) {
        const n = j.nome?.trim();
        if (!n) continue;
        corpo[n] = golsGeral[n] ?? 0;
      }
      const res = await fetch("/api/gols/geral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gols: corpo }),
      });
      if (res.status === 401) {
        setIsAdmin(false);
        setErro("Sessão expirada. Faça login em Gols como admin.");
        return;
      }
      if (!res.ok) throw new Error("Falha ao salvar");
      const data = (await res.json()) as GolsRecord;
      const record: GolsRecord = {};
      for (const j of jogadores) {
        const n = j.nome?.trim();
        if (!n) continue;
        record[n] = data[n] ?? 0;
      }
      setGolsGeral(record);
      setGolsGeralPersistidos(record);
      setAlteradoGeral(false);
      setEditandoGeral(false);
    } catch {
      setErro("Não foi possível salvar a artilharia geral.");
    } finally {
      setSalvandoGeral(false);
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center px-3 py-8">
        <p className="text-sm text-gray-500 dark:text-slate-400">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full px-3 py-6 md:px-6 md:py-10 lg:pl-[5.5rem]">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-col gap-2 border-b border-gray-200 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
              <Medal className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                Artilharia e destaques por pelada
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Escolha a data da pelada para ver destaques e artilharia daquela
                noite. Ranking geral continua acima.
                {sessaoVerificada && isAdmin
                  ? " Como admin, use Editar na artilharia geral para alterar totais e Salvar."
                  : " Para marcar gols por noite e destaques, use "}
                {!(sessaoVerificada && isAdmin) && (
                  <>
                    <Link
                      href="/gols"
                      className="font-medium text-green-600 dark:text-emerald-400"
                    >
                      Gols
                    </Link>
                    . Faça login em Gols para também editar totais gerais aqui.
                  </>
                )}
              </p>
            </div>
          </div>
        </header>

        {erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {erro}
          </div>
        )}

        <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                Artilharia geral (todas as peladas)
              </h2>
            </div>
            {sessaoVerificada &&
              isAdmin &&
              jogadores.length > 0 &&
              (editandoGeral ? (
                <button
                  type="button"
                  onClick={cancelarEdicaoGeral}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancelar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={abrirEdicaoGeral}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700 dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
              ))}
          </div>
          {sessaoVerificada && isAdmin && editandoGeral && (
            <p className="mb-3 text-[11px] text-gray-600 dark:text-slate-400">
              Totais = soma das peladas + ajuste só na artilharia geral (cada
              quarta abaixo não muda).
            </p>
          )}
          {jogadores.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Cadastre jogadores para ver e editar a artilharia geral.
            </p>
          ) : editandoGeral && isAdmin ? (
            <>
              <Artilharia
                jogadores={jogadores}
                gols={golsGeral}
                golsParaOrdenacao={golsGeralPersistidos}
                ordenarPorRanking={true}
                somenteLeitura={false}
                onAdicionar={adicionarGolGeral}
                onRemover={removerGolGeral}
              />
              <div className="mt-3 flex flex-col gap-2 rounded-3xl border border-gray-200 bg-gray-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                {alteradoGeral && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    Alterações não salvas.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void salvarGeralClick()}
                  disabled={!alteradoGeral || salvandoGeral}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400"
                >
                  <Save className="h-4 w-4" />
                  {salvandoGeral ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </>
          ) : rankingGeralLeitura.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Ainda não há gols registrados.
            </p>
          ) : (
            <ol className="space-y-2">
              {rankingGeralLeitura.map(([nome, q], i) => (
                <li
                  key={nome}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950/60"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                      {i + 1}º
                    </span>
                    <span className="font-medium text-gray-900 dark:text-slate-100">
                      {nome}
                    </span>
                  </span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {q} ⚽
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-none">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-green-100 text-green-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                <Calendar className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                  Pelada por data
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  Selecione a quarta para carregar destaques e gols da noite.
                </p>
              </div>
            </div>
            <label className="flex min-w-[12rem] flex-col gap-1 text-[10px] font-medium text-gray-600 dark:text-slate-400">
              Data (YYYY-MM-DD)
              <select
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
                disabled={listaPeladas.length === 0}
                className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none ring-green-500 focus:ring-2 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {listaPeladas.length === 0 ? (
                  <option value="">—</option>
                ) : (
                  listaPeladas.map((p) => (
                    <option key={p.id} value={p.dataPelada}>
                      {p.dataPelada} · {rotuloDataPelada(p.dataPelada)}
                    </option>
                  ))
                )}
              </select>
            </label>
          </div>

          {listaPeladas.length === 0 ? (
            <p className="text-center text-sm text-gray-500 dark:text-slate-400">
              Nenhuma pelada cadastrada ainda.
            </p>
          ) : carregandoPelada ? (
            <p className="text-center text-sm text-gray-500 dark:text-slate-400">
              Carregando pelada…
            </p>
          ) : !dataSelecionada ? (
            <p className="text-center text-sm text-gray-500 dark:text-slate-400">
              Selecione uma data no campo acima.
            </p>
          ) : !peladaDetalhe ? (
            <p className="text-center text-sm text-gray-500 dark:text-slate-400">
              Não foi possível carregar esta data.
            </p>
          ) : (
            <article className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/50 dark:border-slate-800 dark:bg-slate-950/40">
              <div className="border-b border-gray-100 bg-gradient-to-r from-green-50/90 to-white px-4 py-3 dark:border-slate-800 dark:from-emerald-950/40 dark:to-slate-900/90">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                    Pelada · {peladaDetalhe.pelada.dataPelada}
                    <span className="ml-2 font-normal text-gray-500 dark:text-slate-400">
                      ({rotuloDataPelada(peladaDetalhe.pelada.dataPelada)})
                    </span>
                  </h3>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400">
                    {peladaDetalhe.ranking.length} jogador(es) com gol
                  </span>
                </div>
              </div>
              <div className="space-y-4 p-4">
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Destaques
                  </h4>
                  <SecaoDestaques d={peladaDetalhe.pelada.destaques} />
                </div>
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    <Target className="h-3.5 w-3.5" />
                    Artilharia da pelada
                  </h4>
                  {peladaDetalhe.ranking.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      Nenhum gol nesta pelada.
                    </p>
                  ) : (
                    <ol className="space-y-1.5">
                      {peladaDetalhe.ranking.map(({ nome, gols: q }, i) => (
                        <li
                          key={nome}
                          className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm dark:border-slate-800/80 dark:bg-slate-900/60"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-400 dark:text-slate-500">
                              {i + 1}.
                            </span>
                            {nome}
                          </span>
                          <span className="font-semibold text-green-600 dark:text-emerald-400">
                            {q} ⚽
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            </article>
          )}
        </section>
      </div>
    </main>
  );
}
