import "server-only";
import crypto from "node:crypto";
import { TRAJANJE_SEKUNDI } from "@/lib/admin-konstante";

export { KOLACIC, TRAJANJE_SEKUNDI } from "@/lib/admin-konstante";

// Прављење и провјера потписане вриједности админ „пропуснице" (колачића).
// Овдје нема ничега везаног за прегледач ни за базу — само математика потписа.

function tajniKljuc(): string {
  const k = process.env.ADMIN_SESSION_SECRET;
  if (!k) throw new Error("Недостаје ADMIN_SESSION_SECRET у .env.local");
  return k;
}

function base64url(ulaz: Buffer | string): string {
  return Buffer.from(ulaz)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function potpis(podaci: string): string {
  return base64url(
    crypto.createHmac("sha256", tajniKljuc()).update(podaci).digest(),
  );
}

// Вриједност колачића: "<подаци>.<потпис>"
export function napraviToken(): string {
  const podaci = base64url(JSON.stringify({ iat: Date.now() }));
  return `${podaci}.${potpis(podaci)}`;
}

export function tokenJeValjan(token: string | undefined | null): boolean {
  if (!token) return false;
  const [podaci, dobijeniPotpis] = token.split(".");
  if (!podaci || !dobijeniPotpis) return false;

  const ocekivani = potpis(podaci);
  const a = Buffer.from(dobijeniPotpis);
  const b = Buffer.from(ocekivani);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  try {
    const { iat } = JSON.parse(Buffer.from(podaci, "base64").toString());
    if (typeof iat !== "number") return false;
    return Date.now() - iat < TRAJANJE_SEKUNDI * 1000;
  } catch {
    return false;
  }
}
