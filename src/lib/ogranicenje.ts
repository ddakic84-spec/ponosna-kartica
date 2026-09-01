import "server-only";
import crypto from "node:crypto";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase-server";

// Ограничење броја покушаја по IP адреси, у клизном временском прозору.
// Чува се само хеш адресе (privacy), не сама адреса.

async function ipAdresa(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "";
  return xff.split(",")[0].trim() || "nepoznato";
}

async function kljuc(vrsta: string): Promise<string> {
  const ip = await ipAdresa();
  const hash = crypto
    .createHash("sha256")
    .update(`${vrsta}|${ip}`)
    .digest("hex")
    .slice(0, 32);
  return `${vrsta}:${hash}`;
}

// true = дозвољено (и забиљежен покушај); false = прекорачен лимит.
export async function dozvoljenPokusaj(
  vrsta: string,
  maksPokusaja: number,
  prozorMinuta: number,
): Promise<boolean> {
  const k = await kljuc(vrsta);
  const odVremena = new Date(Date.now() - prozorMinuta * 60_000).toISOString();

  const { count, error } = await supabaseServer
    .from("provjere_log")
    .select("*", { count: "exact", head: true })
    .eq("kljuc", k)
    .gte("vrijeme", odVremena);

  // Ако провјера падне, не блокирамо корисника (fail-open за доступност).
  if (error) return true;
  if ((count ?? 0) >= maksPokusaja) return false;

  await supabaseServer.from("provjere_log").insert({ kljuc: k });

  // Повремено обриши старе редове (да табела не расте бескрајно).
  if (Math.random() < 0.03) {
    const staro = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    await supabaseServer.from("provjere_log").delete().lt("vrijeme", staro);
  }

  return true;
}
