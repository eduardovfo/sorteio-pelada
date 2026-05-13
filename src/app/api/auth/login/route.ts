import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminCredentials,
  getSessionSecret,
} from "@/lib/admin-session";

export async function POST(request: Request) {
  const secret = getSessionSecret();
  const cfg = getAdminCredentials();
  if (!secret || !cfg) {
    return NextResponse.json(
      {
        erro:
          "Login de admin não configurado. Defina ADMIN_PASSWORD e ADMIN_SESSION_SECRET (veja .env.example).",
      },
      { status: 503 }
    );
  }

  let body: { usuario?: string; senha?: string };
  try {
    body = (await request.json()) as { usuario?: string; senha?: string };
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 });
  }

  const usuario =
    typeof body.usuario === "string" ? body.usuario.trim() : "";
  const senha = typeof body.senha === "string" ? body.senha : "";

  if (usuario !== cfg.user || senha !== cfg.password) {
    return NextResponse.json(
      { erro: "Usuário ou senha incorretos." },
      { status: 401 }
    );
  }

  const token = createAdminSessionToken();
  if (!token) {
    return NextResponse.json(
      { erro: "Não foi possível criar sessão." },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
