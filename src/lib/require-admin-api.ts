import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin-session";

export async function requireAdminOr401(): Promise<NextResponse | null> {
  const jar = await cookies();
  const raw = jar.get(ADMIN_SESSION_COOKIE)?.value;
  if (!raw || !verifyAdminSessionToken(raw)) {
    return NextResponse.json(
      { erro: "Não autorizado. Faça login como admin." },
      { status: 401 }
    );
  }
  return null;
}
