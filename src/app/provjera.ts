"use server";

import { supabaseServer } from "@/lib/supabase-server";
import { dajGradove } from "@/lib/baza";
import { normalizujIme, samoCifre } from "@/lib/normalizacija";
import {
  validnoImePrezime,
  validanBarKod,
  validanTelefon,
} from "@/lib/validacija";
import { dozvoljenPokusaj } from "@/lib/ogranicenje";
import { provjeriTurnstile } from "@/lib/turnstile";

export type RezultatProvjere =
  | { status: "format" }
  | { status: "prihvacen" }
  | { status: "vec_podnesen" }
  | { status: "nije_evidentiran" }
  | { status: "previse_pokusaja" }
  | { status: "robot" }
  | { status: "greska" };

type Unos = {
  imePrezime: string;
  grad: string;
  barKod: string;
  telefon: string;
  turnstileToken?: string;
  honeypot?: string;
};

async function barKodPostojiUMaster(barKod: string): Promise<boolean> {
  const { data } = await supabaseServer
    .from("bar_kodovi")
    .select("bar_kod")
    .eq("bar_kod", barKod)
    .limit(1);
  return Boolean(data && data.length > 0);
}

export async function provjeriZahtjev(unos: Unos): Promise<RezultatProvjere> {
  // (0a) „Мамац" поље — попуњавају га само аутоматизовани ботови.
  if (String(unos?.honeypot ?? "").trim() !== "") {
    return { status: "nije_evidentiran" };
  }

  // (0b) Ограничење броја покушаја по IP: највише 8 у 5 минута, 25 у сат.
  const ok5 = await dozvoljenPokusaj("provjera-5min", 8, 5);
  const ok60 = await dozvoljenPokusaj("provjera-60min", 25, 60);
  if (!ok5 || !ok60) return { status: "previse_pokusaja" };

  // (0c) „Нисам робот"
  const robotOk = await provjeriTurnstile(String(unos?.turnstileToken ?? ""));
  if (!robotOk) return { status: "robot" };

  const imePrezime = String(unos?.imePrezime ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const grad = String(unos?.grad ?? "").trim();
  const barKod = samoCifre(String(unos?.barKod ?? ""));
  const telefon = samoCifre(String(unos?.telefon ?? ""));

  // (1) формат (сервер увијек провјерава поново)
  let gradovi: string[];
  try {
    gradovi = await dajGradove();
  } catch {
    return { status: "greska" };
  }
  if (
    !validnoImePrezime(imePrezime) ||
    !gradovi.includes(grad) ||
    !validanBarKod(barKod) ||
    !validanTelefon(telefon)
  ) {
    return { status: "format" };
  }

  const imeNorm = normalizujIme(imePrezime);
  let nacin: string | null = null;

  // (2) у листи изабраног града постоји ред са овим бар кодом
  const { data: poBarkodu, error: e1 } = await supabaseServer
    .from("korisnici_kartice")
    .select("ime_norm")
    .eq("grad", grad)
    .eq("bar_kod", barKod);
  if (e1) return { status: "greska" };

  if (poBarkodu && poBarkodu.length > 0) {
    nacin = poBarkodu.some((r) => r.ime_norm === imeNorm)
      ? "grad_i_barkod"
      : "grad_i_barkod_ime_ne";
  }

  // (3) и (4)
  if (!nacin) {
    const [poImenu, uMaster] = await Promise.all([
      supabaseServer
        .from("korisnici_kartice")
        .select("id")
        .eq("grad", grad)
        .eq("ime_norm", imeNorm)
        .limit(1),
      barKodPostojiUMaster(barKod),
    ]);
    if (poImenu.error) return { status: "greska" };

    if (uMaster && poImenu.data && poImenu.data.length > 0) {
      nacin = "ime_i_master";
    } else if (uMaster) {
      nacin = "samo_master";
    }
  }

  // (5) нема поклапања
  if (!nacin) return { status: "nije_evidentiran" };

  // прихваћено → упис
  const { error: eIns } = await supabaseServer.from("zahtjevi").insert({
    ime_prezime: imePrezime,
    grad,
    bar_kod: barKod,
    telefon,
    nacin_prihvatanja: nacin,
  });

  if (eIns) {
    if (eIns.code === "23505") return { status: "vec_podnesen" };
    return { status: "greska" };
  }

  return { status: "prihvacen" };
}
