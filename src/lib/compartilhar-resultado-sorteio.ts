import { toast } from "sonner";
import type { ResultadoSorteio } from "@/types/sorteio";
import { gerarTextoCompartilhamento } from "@/lib/sorteioAlgoritmo";

const MAX_WA_CHARS = 3500;

export async function copiarResultadoSorteio(
  resultado: ResultadoSorteio
): Promise<void> {
  const texto = gerarTextoCompartilhamento(resultado);
  try {
    await navigator.clipboard.writeText(texto);
    toast.success("Times copiados!", { duration: 2000 });
  } catch {
    toast.error("Não foi possível copiar.", { duration: 2500 });
  }
}

export function abrirWhatsAppComResultadoSorteio(
  resultado: ResultadoSorteio
): void {
  const texto = gerarTextoCompartilhamento(resultado);
  const corpo =
    texto.length > MAX_WA_CHARS
      ? `${texto.slice(0, MAX_WA_CHARS)}\n\n… (mensagem truncada — use Copiar para o texto completo.)`
      : texto;
  const url = `https://wa.me/?text=${encodeURIComponent(corpo)}`;
  const janela = window.open(url, "_blank", "noopener,noreferrer");
  if (!janela) {
    toast.error("Permita pop-ups ou abra o link manualmente.", {
      duration: 3000
    });
    return;
  }
  toast.success("Abrindo o WhatsApp…", { duration: 2000 });
}
