"use client";

import { useEffect, useState } from "react";
import type { DestaquesPelada } from "@/types/pelada";

const CAMPOS: {
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

interface Props {
  peladaId: number;
  valorInicial: DestaquesPelada;
  listaNomes: string[];
  onSalvo: () => Promise<void>;
  /** Se false, apenas exibe os valores (admin não logado). */
  podeEditar?: boolean;
  /** Chamado quando a API responde 401 (sessão expirada ou sem permissão). */
  onNaoAutorizado?: () => void;
}

export function DestaquesPeladaForm({
  peladaId,
  valorInicial,
  listaNomes,
  onSalvo,
  podeEditar = true,
  onNaoAutorizado,
}: Props) {
  const [valores, setValores] = useState<DestaquesPelada>(valorInicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setValores(valorInicial);
  }, [valorInicial, peladaId]);

  function syncFromProps() {
    setValores(valorInicial);
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/peladas/${peladaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valores),
      });
      if (res.status === 401) {
        onNaoAutorizado?.();
        setErro("Sessão expirada ou sem permissão. Faça login novamente.");
        return;
      }
      if (!res.ok) throw new Error("Falha ao salvar destaques");
      await onSalvo();
    } catch {
      setErro("Não foi possível salvar os destaques.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-3 transition-colors dark:border-slate-800 dark:bg-slate-900/70">
      <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-100">
        Destaques da pelada
      </h3>
      <p className="mt-0.5 text-[10px] text-gray-500 dark:text-slate-400">
        {podeEditar
          ? "Preencha o nome do jogador em cada categoria (opcional)."
          : "Somente leitura. Faça login como admin para editar os destaques."}
      </p>
      {listaNomes.length > 0 && (
        <datalist id="nomes-jogadores-pelada">
          {listaNomes.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      )}
      {erro && (
        <p className="mt-2 text-[11px] text-red-600 dark:text-red-300">{erro}</p>
      )}
      <div className="mt-2 grid gap-2">
        {CAMPOS.map(({ key, titulo, desc }) => (
          <label key={key} className="flex flex-col gap-0.5">
            <span className="text-[10px] font-medium text-gray-600 dark:text-slate-400">
              {titulo} <span className="font-normal opacity-80">({desc})</span>
            </span>
            <input
              type="text"
              list={podeEditar ? "nomes-jogadores-pelada" : undefined}
              readOnly={!podeEditar}
              value={valores[key] ?? ""}
              onChange={(e) =>
                setValores((v) => ({ ...v, [key]: e.target.value || null }))
              }
              className="rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none ring-green-500 focus:ring-2 read-only:cursor-default read-only:opacity-90 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:read-only:bg-slate-900/60"
              placeholder="Nome do jogador"
            />
          </label>
        ))}
      </div>
      {podeEditar && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="rounded-2xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:text-amber-950"
          >
            {salvando ? "Salvando..." : "Salvar destaques"}
          </button>
          <button
            type="button"
            onClick={syncFromProps}
            className="rounded-2xl border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Desfazer alterações
          </button>
        </div>
      )}
    </div>
  );
}
