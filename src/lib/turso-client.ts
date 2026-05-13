import { createClient } from "@libsql/client";

export type TursoClient = ReturnType<typeof createClient>;

export function getTursoClient(): TursoClient | null {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const hasUrl = Boolean(url);
  const hasAuthToken = Boolean(authToken);

  if (!hasUrl || !hasAuthToken) {
    let urlHost: string | null = null;
    try {
      if (url) {
        urlHost = new URL(url).host;
      }
    } catch {
      urlHost = null;
    }
    console.error("[TURSO] Cliente não configurado", {
      hasUrl,
      hasAuthToken,
      urlHost,
    });
    return null;
  }

  let urlHost: string | null = null;
  try {
    urlHost = new URL(url as string).host;
  } catch {
    urlHost = null;
  }
  console.log("[TURSO] Criando client Turso", { urlHost });

  return createClient({ url: url as string, authToken: authToken as string });
}
