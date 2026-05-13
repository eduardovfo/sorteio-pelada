"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LogIn, LogOut, Save, Target } from "lucide-react";
import type { Jogador } from "@/types/sorteio";
import type { GolsRecord } from "@/types/gols";
import type { Pelada } from "@/types/pelada";
import { Artilharia } from "@/components/gols/Artilharia";
import { DestaquesPeladaForm } from "@/components/gols/DestaquesPeladaForm";
import { hojeEmFusoPelada } from "@/lib/datas-pelada";

export default function GolsPage() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [peladas, setPeladas] = useState<Pelada[]>([]);
  const [peladaId, setPeladaId] = useState<number | null>(null);
  const [gols, setGols] = useState<GolsRecord>({});
  const [golsPersistidos, setGolsPersistidos] = useState<GolsRecord>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [alterado, setAlterado] = useState(false);

  const [sessaoVerificada, setSessaoVerificada] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [usuarioLogin, setUsuarioLogin] = useState("");
  const [senhaLogin, setSenhaLogin] = useState("");
  const [loginErro, setLoginErro] = useState<string | null>(null);
  const [loginEnviando, setLoginEnviando] = useState(false);

  const nomesJogadores = useMemo(
    () => jogadores.map((j) => j.nome).filter(Boolean),
    [jogadores]
  );

  const peladaAtual = useMemo(
    () => peladas.find((p) => p.id === peladaId) ?? null,
    [peladas, peladaId]
  );

  const peladasOrdenadasAdmin = useMemo(
    () =>
      [...peladas].sort((a, b) =>
        b.dataPelada.localeCompare(a.dataPelada, "en-CA")
      ),
    [peladas]
  );

  const dataHojePelada = hojeEmFusoPelada();

  const carregarPeladas = useCallback(
    async (opts?: { preferirId?: number | null }) => {
      const res = await fetch("/api/peladas");
      if (!res.ok) throw new Error("Peladas");
      const lista = (await res.json()) as Pelada[];
      setPeladas(lista);
      setPeladaId((idAtual) => {
        const pref = opts?.preferirId;
        if (pref != null && lista.some((p) => p.id === pref)) {
          return pref;
        }
        if (idAtual != null && lista.some((p) => p.id === idAtual)) {
          return idAtual;
        }
        const hoje = hojeEmFusoPelada();
        const deHoje = lista.find((p) => p.dataPelada === hoje);
        if (deHoje) return deHoje.id;
        return lista[0]?.id ?? null;
      });
    },
    []
  );

  const carregarGolsPelada = useCallback(async (id: number) => {
    const res = await fetch(`/api/gols?peladaId=${id}`);
    if (!res.ok) throw new Error("Gols");
    const data = (await res.json()) as GolsRecord;
    setGols(data);
    setGolsPersistidos(data);
    setAlterado(false);
  }, []);

  const carregarBase = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resJogadores = await fetch("/api/jogadores");
      if (!resJogadores.ok) throw new Error("Jogadores");
      const jogadoresData = (await resJogadores.json()) as Jogador[];
      setJogadores(jogadoresData);
      await carregarPeladas();
    } catch {
      setErro("Não foi possível carregar os dados.");
    } finally {
      setCarregando(false);
    }
  }, [carregarPeladas]);

  useEffect(() => {
    carregarBase();
  }, [carregarBase]);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d: { admin?: boolean }) => {
        setIsAdmin(d.admin === true);
        setSessaoVerificada(true);
      })
      .catch(() => {
        setSessaoVerificada(true);
      });
  }, []);

  /** Visitante: sempre voltar para a pelada de hoje (ou a mais recente). */
  useEffect(() => {
    if (!sessaoVerificada || isAdmin || peladas.length === 0) return;
    const hoje = hojeEmFusoPelada();
    const deHoje = peladas.find((p) => p.dataPelada === hoje);
    setPeladaId(deHoje?.id ?? peladas[0]?.id ?? null);
  }, [sessaoVerificada, isAdmin, peladas]);

  useEffect(() => {
    if (peladaId == null) return;
    let ativo = true;
    (async () => {
      try {
        await carregarGolsPelada(peladaId);
      } catch {
        if (ativo) setErro("Não foi possível carregar os gols desta pelada.");
      }
    })();
    return () => {
      ativo = false;
    };
  }, [peladaId, carregarGolsPelada]);

  function adicionarGol(nome: string) {
    if (!isAdmin) return;
    setGols((atual) => ({
      ...atual,
      [nome]: (atual[nome] ?? 0) + 1,
    }));
    setAlterado(true);
    setErro(null);
  }

  function removerGol(nome: string) {
    if (!isAdmin) return;
    setGols((atual) => {
      const valor = atual[nome] ?? 0;
      if (valor <= 0) return atual;
      const next = { ...atual };
      next[nome] = valor - 1;
      return next;
    });
    setAlterado(true);
    setErro(null);
  }

  async function salvarGolsClick() {
    if (peladaId == null || !isAdmin) return;
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/gols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ peladaId, gols }),
      });
      if (res.status === 401) {
        setIsAdmin(false);
        setErro("Sessão expirada ou sem permissão. Faça login como admin.");
        return;
      }
      if (!res.ok) throw new Error("Falha ao salvar");
      const data = (await res.json()) as GolsRecord;
      setGols(data);
      setGolsPersistidos(data);
      setAlterado(false);
    } catch {
      setErro(
        "Não foi possível salvar os gols. Verifique a conexão e tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErro(null);
    setLoginEnviando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: usuarioLogin.trim(),
          senha: senhaLogin,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; erro?: string };
      if (res.status === 503) {
        setLoginErro(
          data.erro ??
            "Login não configurado. Defina ADMIN_PASSWORD e ADMIN_SESSION_SECRET."
        );
        return;
      }
      if (!res.ok) {
        setLoginErro(data.erro ?? "Falha no login.");
        return;
      }
      setIsAdmin(true);
      setSenhaLogin("");
      await carregarPeladas({ preferirId: peladaId });
    } catch {
      setLoginErro("Não foi possível entrar. Tente novamente.");
    } finally {
      setLoginEnviando(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignora */
    }
    setIsAdmin(false);
    const hoje = hojeEmFusoPelada();
    const deHoje = peladas.find((p) => p.dataPelada === hoje);
    setPeladaId(deHoje?.id ?? peladas[0]?.id ?? null);
  }

  const prontoParaConteudo = !carregando && sessaoVerificada;

  if (!prontoParaConteudo) {
    return (
      <main className="flex min-h-screen items-center justify-center px-3 py-4">
        <p className="text-sm text-gray-500 dark:text-slate-400">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-3 py-4 md:px-6 md:py-8">
      <div className="w-full max-w-2xl">
        <div className="mx-auto flex max-w-md flex-col gap-4 rounded-[2.6rem] border border-gray-200 bg-white p-3 shadow-lg transition-colors dark:max-w-none dark:rounded-3xl dark:border-slate-800/80 dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-950/95 dark:shadow-soft-card md:max-w-none md:rounded-3xl md:p-5">
          <header className="sticky top-3 z-10 mb-1 rounded-3xl border border-gray-200 bg-white/95 px-4 py-3 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-950/90">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                  <Target className="h-4 w-4" />
                </span>
                <div>
                  <h1 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                    Marcar gols por pelada
                  </h1>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    Visitantes veem a artilharia e os destaques em somente leitura.
                    Administradores podem editar qualquer data (quarta no calendário)
                    após login. Ver{" "}
                    <Link
                      href="/artilharia"
                      className="font-medium text-green-600 dark:text-emerald-400"
                    >
                      Artilharia e destaques
                    </Link>
                    .
                  </p>
                </div>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="inline-flex flex-shrink-0 items-center gap-1 rounded-2xl border border-gray-300 px-2.5 py-1.5 text-[11px] font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sair
                </button>
              )}
            </div>
          </header>

          {!isAdmin && (
            <section className="rounded-3xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-green-100 text-green-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <LogIn className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-xs font-semibold text-gray-900 dark:text-slate-100">
                  Área do administrador
                </h2>
              </div>
              <p className="mb-2 text-[10px] text-gray-600 dark:text-slate-400">
                Em desenvolvimento, o padrão é usuário{" "}
                <code className="rounded bg-gray-200 px-1 dark:bg-slate-800">
                  admin
                </code>{" "}
                e senha{" "}
                <code className="rounded bg-gray-200 px-1 dark:bg-slate-800">
                  admin
                </code>
                . Em produção, use{" "}
                <code className="rounded bg-gray-200 px-1 dark:bg-slate-800">
                  ADMIN_PASSWORD
                </code>{" "}
                e{" "}
                <code className="rounded bg-gray-200 px-1 dark:bg-slate-800">
                  ADMIN_SESSION_SECRET
                </code>{" "}
                (veja .env.example).
              </p>
              <form onSubmit={(e) => void handleLogin(e)} className="flex flex-col gap-2">
                <label className="text-[10px] font-medium text-gray-600 dark:text-slate-400">
                  Usuário
                  <input
                    type="text"
                    name="usuario"
                    autoComplete="username"
                    value={usuarioLogin}
                    onChange={(e) => setUsuarioLogin(e.target.value)}
                    className="mt-0.5 w-full rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none ring-green-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </label>
                <label className="text-[10px] font-medium text-gray-600 dark:text-slate-400">
                  Senha
                  <input
                    type="password"
                    name="senha"
                    autoComplete="current-password"
                    value={senhaLogin}
                    onChange={(e) => setSenhaLogin(e.target.value)}
                    className="mt-0.5 w-full rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none ring-green-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </label>
                {loginErro && (
                  <p className="text-[11px] text-red-600 dark:text-red-300">
                    {loginErro}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loginEnviando}
                  className="mt-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50 dark:bg-emerald-500 dark:text-emerald-950"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  {loginEnviando ? "Entrando..." : "Entrar como admin"}
                </button>
              </form>
            </section>
          )}

          {isAdmin && peladas.length > 0 && (
            <label className="flex flex-col gap-1 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-3 py-2 dark:border-amber-500/25 dark:bg-amber-500/5">
              <span className="text-[10px] font-medium text-amber-900 dark:text-amber-200/90">
                Pelada a editar (admin)
              </span>
              <select
                value={peladaId ?? ""}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) setPeladaId(v);
                }}
                className="rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none ring-amber-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {peladasOrdenadasAdmin.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.dataPelada}
                    {p.dataPelada === dataHojePelada ? " · hoje" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}

          {erro && (
            <div className="rounded-2xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {erro}
            </div>
          )}

          {peladaAtual && (
            <p className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-center text-[11px] text-gray-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
              Pelada:{" "}
              <span className="font-semibold text-gray-900 dark:text-slate-100">
                {peladaAtual.dataPelada}
              </span>
              {peladaAtual.dataPelada === dataHojePelada ? " · hoje" : ""}
            </p>
          )}

          {peladaId != null && peladaAtual && (
            <DestaquesPeladaForm
              key={peladaId}
              peladaId={peladaId}
              valorInicial={peladaAtual.destaques}
              listaNomes={nomesJogadores}
              onSalvo={() => carregarPeladas({ preferirId: peladaId })}
              podeEditar={isAdmin}
              onNaoAutorizado={() => setIsAdmin(false)}
            />
          )}

          {jogadores.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              Nenhum jogador cadastrado no banco. Use a rota{" "}
              <code className="rounded bg-gray-200 px-1 dark:bg-slate-800">
                POST /api/jogadores/seed
              </code>{" "}
              para importar a lista.
            </div>
          ) : peladaId == null ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              Não há peladas no banco. Em uma quarta-feira (horário de Brasília),
              recarregue esta página para criar a pelada do dia automaticamente.
            </div>
          ) : (
            <>
              <Artilharia
                jogadores={jogadores}
                gols={gols}
                golsParaOrdenacao={golsPersistidos}
                ordenarPorRanking={true}
                somenteLeitura={!isAdmin}
                onAdicionar={adicionarGol}
                onRemover={removerGol}
              />

              {isAdmin && (
                <div className="flex flex-col gap-2 rounded-3xl border border-gray-200 bg-white p-3 transition-colors dark:border-slate-800 dark:bg-slate-900/70">
                  {alterado && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      Você tem alterações não salvas. Clique em Salvar para gravar
                      nesta pelada.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => void salvarGolsClick()}
                    disabled={!alterado || salvando}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
                  >
                    <Save className="h-4 w-4" />
                    {salvando ? "Salvando..." : "Salvar gols desta pelada"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
