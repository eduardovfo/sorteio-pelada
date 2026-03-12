import type { Formacao, ResultadoSorteio } from "@/types/sorteio";
import { CircleAlert, CircleCheck, Users } from "lucide-react";

interface Props {
  totalJogadores: number;
  selecionados: number;
  formacaoPrioritaria: Formacao;
  prontoParaSortear: boolean;
  motivoIndisponivel?: string;
  resultado?: ResultadoSorteio | null;
}

export function ResumoPainel({
  totalJogadores,
  selecionados,
  formacaoPrioritaria,
  prontoParaSortear,
  motivoIndisponivel,
  resultado
}: Props) {
  const quantidadeTimes = resultado
    ? resultado.times.length
    : selecionados >= 10
      ? Math.ceil(selecionados / 5)
      : 0;
  const usadosNoSorteio = resultado
    ? resultado.times.reduce(
        (total, time) => total + time.jogadores.length,
        0
      )
    : null;

  const StatusIcon = prontoParaSortear ? CircleCheck : CircleAlert;
  const statusTexto = prontoParaSortear
    ? "Pronto para sortear"
    : "Ajuste a seleção para sortear";

  return (
    <section className="card-animate grid gap-3 rounded-3xl border border-gray-200 bg-white p-4 text-sm shadow-md transition-colors dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-soft-card md:grid-cols-3 lg:gap-4 lg:p-5 2xl:gap-5 2xl:p-6">
      <div className="flex flex-col gap-2 border-b border-gray-200 pb-3 md:border-b-0 md:border-r md:pb-0 md:pr-4 dark:border-slate-800 lg:pr-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
          <Users className="h-3.5 w-3.5" />
          Visão geral
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] text-gray-500 dark:text-slate-400">Jogadores totais</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-slate-50">
              {totalJogadores}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500 dark:text-slate-400">Selecionados</div>
            <div className="text-lg font-semibold text-green-600 dark:text-emerald-400">
              {selecionados}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500 dark:text-slate-400">Times</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-slate-50">
              {quantidadeTimes}
            </div>
          </div>
          {usadosNoSorteio !== null && (
            <div>
              <div className="text-[11px] text-gray-500 dark:text-slate-400">Jogadores nos times</div>
              <div className="text-lg font-semibold text-green-600 dark:text-emerald-400">
                {usadosNoSorteio}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-b border-gray-200 pb-3 md:border-b-0 md:border-r md:pb-0 md:px-4 dark:border-slate-800 lg:px-5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
          Formação prioritária
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs text-gray-900 dark:bg-slate-800/80 dark:text-slate-100">
          <span className="h-2 w-2 rounded-full bg-green-500 dark:bg-emerald-400" />
          <span className="font-medium">{formacaoPrioritaria.descricao}</span>
        </div>
        {resultado && (
          <div className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
            Diferença atual entre o time mais forte e o mais fraco:{" "}
            <span className="font-semibold text-green-700 dark:text-emerald-300">
              {resultado.diferencaForca}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 md:pl-4 lg:pl-5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
          Status do sorteio
        </div>
        <div className="flex items-start gap-2">
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
              prontoParaSortear
                ? "bg-green-100 text-green-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                : "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
            }`}
          >
            <StatusIcon className="h-3.5 w-3.5" />
          </span>
          <div className="flex flex-col">
            <span
              className={`text-xs font-semibold transition-colors ${
                prontoParaSortear ? "text-green-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"
              }`}
            >
              {statusTexto}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-slate-400">
              {motivoIndisponivel ??
                (prontoParaSortear
                  ? 'Toque em "Sortear times" para gerar a melhor combinação possível.'
                  : "Selecione pelo menos 10 jogadores para liberar o sorteio.")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
