import "server-only";
import { headers } from "next/headers";

// Cloudflare Turnstile — провјера „нисам робот".
// Ако тајни кључ није подешен (нпр. локални развој), провјера се прескаче.

// Активно је само ако су ОБА кључа подешена (виджет на страници тражи site key,
// провјера на серверу тражи secret key). Ако фали било који — прескаче се,
// да погрешно подешавање не обори форму свима.
export function turnstileUkljucen(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  );
}

export async function provjeriTurnstile(token: string): Promise<boolean> {
  if (!turnstileUkljucen()) return true; // није (потпуно) подешено
  const secret = process.env.TURNSTILE_SECRET_KEY!;
  if (!token) return false;

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim();

  const tijelo = new URLSearchParams({ secret, response: token });
  if (ip) tijelo.set("remoteip", ip);

  try {
    const r = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: tijelo },
    );
    const j = (await r.json()) as { success?: boolean };
    return j.success === true;
  } catch {
    return false;
  }
}
