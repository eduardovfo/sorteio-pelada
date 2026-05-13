import type { Formacao, ResultadoSorteio } from "@/types/sorteio";
import { FormationChips } from "@/components/sorteio/FormationChips";
import { umaCasaDecimal } from "@/lib/format-notas";
import { CircleHelp, Users } from "lucide-react";

interface Props {
  totalJogadores: number;
  selecionados: number;
  formacaoPrioritaria: Formacao;
  resultado?: ResultadoSorteio | null;
}

const TOOLTIP_FORMACAO =
  "Distribuicao-alvo que o algoritmo busca em cada time: 2 defensores, 1 meia e 2 atacantes. Quando nao da pra atingir, escolhe a mais proxima entre 2-1-2, 2-2-1 e 1-2-2.";

export function ResumoPainel({
  totalJogadores,
  selecionados,
  formacaoPrioritaria,
  resultado
}: Props) {
  const quantidadeTimes = resultado
    ? resultado.times.length
    : selecionados >= 10
      ? Math.ceil(selecionados / 5)
      : 0;

  return (
    <section className="card-animate grid gap-3 rounded-3xl border border-gray-200 bg-white p-4 text-sm shadow-md transition-colors dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-soft-card md:grid-cols-2 lg:gap-4 lg:p-5 2xl:gap-5 2xl:p-6">
      <div className="flex flex-col gap-2 border-b border-gray-200 pb-3 md:border-b-0 md:border-r md:pb-0 md:pr-4 dark:border-slate-800 lg:pr-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
          <Users className="h-3.5 w-3.5" />
          Visao geral
        </div>
        <div className="flex items-end gap-6">
          <div>
            <div className="text-[11px] text-gray-500 dark:text-slate-400">Jogadores</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-slate-50">
              {selecionados}
              <span className="text-gray-400 dark:text-slate-500">/{totalJogadores}</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500 dark:text-slate-400">Times</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-slate-50">
              {quantidadeTimes || "-"}
            </div>
          </div>
          {resultado && (
            <div>
              <div className="text-[11px] text-gray-500 dark:text-slate-400">Diferenca</div>
              <div className="text-lg font-semibold text-green-600 dark:text-emerald-400">
                {umaCasaDecimal(resultado.diferencaForca)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 md:pl-4 lg:pl-5">
        <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
          Formacao prioritaria
          <span title={TOOLTIP_FORMACAO} className="cursor-help text-gray-400 dark:text-slate-500">
            <CircleHelp className="h-3 w-3" aria-hidden />
          </span>
        </div>
        <div className="inline-flex w-fit flex-col gap-2">
          <FormationChips formation={formacaoPrioritaria.distribuicao} />
        </div>
      </div>
    </section>
  );
}
