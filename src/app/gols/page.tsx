"use client";

import { useCallback, useEffect, useState } from "react";
import { Save, Target } from "lucide-react";
import type { Jogador } from "@/types/sorteio";
import type { GolsRecord } from "@/types/gols";
import { Artilharia } from "@/components/gols/Artilharia";

export default function GolsPage() {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [gols, setGols] = useState<GolsRecord>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [alterado, setAlterado] = useState(false);
  const [ordenarPorRanking, setOrdenarPorRanking] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [resJogadores, resGols] = await Promise.all([
        fetch("/api/jogadores"),
        fetch("/api/gols")
      ]);
      if (!resJogadores.ok) throw new Error("Jogadores");
      if (!resGols.ok) throw new Error("Gols");
      const jogadoresData = (await resJogadores.json()) as Jogador[];
      const golsData = (await resGols.json()) as GolsRecord;
      setJogadores(jogadoresData);
      setGols(golsData);
      setAlterado(false);
      setOrdenarPorRanking(true);
    } catch {
      setErro("Não foi possível carregar os dados.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function adicionarGol(nome: string) {
    setGols((atual) => ({
      ...atual,
      [nome]: (atual[nome] ?? 0) + 1
    }));
    setAlterado(true);
    setOrdenarPorRanking(false);
    setErro(null);
  }

  function removerGol(nome: string) {
    setGols((atual) => {
      const valor = atual[nome] ?? 0;
      if (valor <= 0) return atual;
      const next = { ...atual };
      next[nome] = valor - 1;
      return next;
    });
    setAlterado(true);
    setOrdenarPorRanking(false);
    setErro(null);
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch("/api/gols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gols)
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      const data = (await res.json()) as GolsRecord;
      setGols(data);
      setAlterado(false);
      setOrdenarPorRanking(true);
    } catch {
      setErro("Não foi possível salvar os gols. Verifique a conexão e tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
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
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                <Target className="h-4 w-4" />
              </span>
              <div>
                <h1 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                  Marcar gols
                </h1>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  Estatísticas de gols e a lista de jogadores são salvas no servidor (Turso).
                </p>
              </div>
            </div>
          </header>

          {erro && (
            <div className="rounded-2xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {erro}
            </div>
          )}

          {jogadores.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
              Nenhum jogador cadastrado no banco. Use a rota <code className="rounded bg-gray-200 px-1 dark:bg-slate-800">POST /api/jogadores/seed</code> para importar a lista.
            </div>
          ) : (
            <>
              <Artilharia
                jogadores={jogadores}
                gols={gols}
                ordenarPorRanking={ordenarPorRanking}
                onAdicionar={adicionarGol}
                onRemover={removerGol}
              />

              <div className="flex flex-col gap-2 rounded-3xl border border-gray-200 bg-white p-3 transition-colors dark:border-slate-800 dark:bg-slate-900/70">
                {alterado && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    Você tem alterações não salvas. Clique em Salvar para enviar para o servidor.
                  </p>
                )}
                <button
                  type="button"
                  onClick={salvar}
                  disabled={!alterado || salvando}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
                >
                  <Save className="h-4 w-4" />
                  {salvando ? "Salvando..." : "Salvar gols"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
