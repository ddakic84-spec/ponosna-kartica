// Привремена дијагностика — не открива тајне (само дужине и резултат провјере).
export const dynamic = "force-dynamic";

export async function GET() {
  const duz = (v: string | undefined) => (v ?? "").length;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: duz(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: duz(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: duz(process.env.SUPABASE_SERVICE_ROLE_KEY),
    ADMIN_EMAIL: duz(process.env.ADMIN_EMAIL),
    ADMIN_LOZINKA: duz(process.env.ADMIN_LOZINKA),
    ADMIN_SESSION_SECRET: duz(process.env.ADMIN_SESSION_SECRET),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: duz(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
    TURNSTILE_SECRET_KEY: duz(process.env.TURNSTILE_SECRET_KEY),
    url_pocetak: url.slice(0, 13),
    url_ima_razmak_ili_novi_red: url !== url.trim(),
  };

  let baza = "није пробано";
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const s = createClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim(),
      (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim(),
      { auth: { persistSession: false } },
    );
    const { count, error } = await s
      .from("gradovi")
      .select("*", { count: "exact", head: true });
    baza = error ? `грешка: ${error.message}` : `ок, градова: ${count}`;
  } catch (e) {
    baza = `изузетак: ${(e as Error).message}`;
  }

  return Response.json({ env, baza });
}
