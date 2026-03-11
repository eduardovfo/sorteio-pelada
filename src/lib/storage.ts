const SELECAO_KEY = "sorteio-pelada:selecionados";
const RESULTADO_KEY = "sorteio-pelada:ultimo-resultado";

export function isBrowser() {
  return typeof window !== "undefined";
}

export function salvarSelecao(nomes: string[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(SELECAO_KEY, JSON.stringify(nomes));
}

export function carregarSelecao(): string[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(SELECAO_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function salvarResultado(resultado: unknown) {
  if (!isBrowser()) return;
  const payload = {
    criadoEm: new Date().toISOString(),
    resultado
  };
  window.localStorage.setItem(RESULTADO_KEY, JSON.stringify(payload));
}

export function carregarResultado<T>(): T | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(RESULTADO_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed.resultado as T;
  } catch {
    return null;
  }
}

