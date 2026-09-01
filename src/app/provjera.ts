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
  | { status: "bar_kod_nije_nadjen" }
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

  // (0b) Ограничење броја покушаја по IP.
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

  // (1) Формат (сервер увијек провјерава поново).
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

  // (2) Име + град МОРАЈУ да се поклопе са неким редом у листи тог града.
  //     Ако нема — захтјев се одбија (не смије се прихватити само по бар коду,
  //     то би било погађање кода).
  const { data: poImenu, error: e1 } = await supabaseServer
    .from("korisnici_kartice")
    .select("bar_kod")
    .eq("grad", grad)
    .eq("ime_norm", imeNorm);
  if (e1) return { status: "greska" };
  if (!poImenu || poImenu.length === 0) {
    return { status: "nije_evidentiran" };
  }

  // (3) Бар код мора бити прави: или у комплетној листи од 12.000, или тачно
  //     онај који стоји уз то име у листи града.
  const barKodNaListi = poImenu.some((r) => r.bar_kod === barKod);
  const uMaster = barKodNaListi ? true : await barKodPostojiUMaster(barKod);
  if (!uMaster) {
    return { status: "bar_kod_nije_nadjen" };
  }

  const nacin = barKodNaListi ? "ime_i_barkod_sa_liste" : "ime_i_master";

  // (4) Само један захтјев по особи (град + име).
  const { data: postojeci, error: e2 } = await supabaseServer
    .from("zahtjevi")
    .select("id")
    .eq("grad", grad)
    .eq("ime_norm", imeNorm)
    .limit(1);
  if (e2) return { status: "greska" };
  if (postojeci && postojeci.length > 0) {
    return { status: "vec_podnesen" };
  }

  // (5) Упис прихваћеног захтјева.
  const { error: eIns } = await supabaseServer.from("zahtjevi").insert({
    ime_prezime: imePrezime,
    grad,
    bar_kod: barKod,
    telefon,
    ime_norm: imeNorm,
    nacin_prihvatanja: nacin,
  });

  if (eIns) {
    // 23505 = кршење јединствености (истовремени други захтјев исте особе)
    if (eIns.code === "23505") return { status: "vec_podnesen" };
    return { status: "greska" };
  }

  return { status: "prihvacen" };
}
