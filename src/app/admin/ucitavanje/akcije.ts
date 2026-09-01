"use server";

import { revalidatePath } from "next/cache";
import { zahtijevajAdmina } from "@/lib/admin-sesija";
import { supabaseServer } from "@/lib/supabase-server";
import {
  procitajGradskuListu,
  procitajViseListova,
  procitajListuBarKodova,
  type RedGrada,
} from "@/lib/excel";
import { normalizujIme } from "@/lib/normalizacija";

export type StanjeUcitavanja =
  | { ok: true; poruka: string }
  | { ok: false; greska: string }
  | undefined;

function preuzmiExcel(formData: FormData): File | { greska: string } {
  const f = formData.get("datoteka");
  if (!(f instanceof File) || f.size === 0) return { greska: "Изабери Excel фајл." };
  if (!/\.(xlsx|xls)$/i.test(f.name))
    return { greska: "Фајл мора бити .xlsx или .xls." };
  return f;
}

async function upisiUGrupama(
  tabela: string,
  redovi: Record<string, unknown>[],
  onConflict: string,
  povratnaKolona: string,
  velicinaGrupe: number,
): Promise<{ upisano: number } | { greska: string }> {
  let upisano = 0;
  for (let i = 0; i < redovi.length; i += velicinaGrupe) {
    const { data, error } = await supabaseServer
      .from(tabela)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(redovi.slice(i, i + velicinaGrupe) as any, {
        onConflict,
        ignoreDuplicates: true,
      })
      .select(povratnaKolona);
    if (error) return { greska: error.message };
    upisano += data?.length ?? 0;
  }
  return { upisano };
}

// Уписује редове једног града. Враћа колико је НОВИХ уписано.
async function upisiGrad(
  naziv: string,
  redovi: RedGrada[],
  izvor: string,
): Promise<{ upisano: number } | { greska: string }> {
  await supabaseServer
    .from("gradovi")
    .upsert({ naziv }, { onConflict: "naziv", ignoreDuplicates: true });

  const zaUpis = redovi.map((r) => ({
    ime_prezime: r.imePrezime,
    grad: naziv,
    bar_kod: r.barKod,
    ime_norm: normalizujIme(r.imePrezime),
    izvor_datoteka: izvor,
  }));

  return upisiUGrupama(
    "korisnici_kartice",
    zaUpis,
    "grad,ime_prezime,bar_kod",
    "id",
    500,
  );
}

// ---- 1) Један град из једног фајла (један лист) ----------------------
export async function ucitajGradskuListu(
  _p: StanjeUcitavanja,
  formData: FormData,
): Promise<StanjeUcitavanja> {
  await zahtijevajAdmina();

  const naziv = String(formData.get("naziv") ?? "").trim().replace(/\s+/g, " ");
  if (!naziv) return { ok: false, greska: "Унеси назив града." };

  const fajl = preuzmiExcel(formData);
  if ("greska" in fajl) return { ok: false, greska: fajl.greska };

  let redovi: RedGrada[];
  try {
    redovi = procitajGradskuListu(await fajl.arrayBuffer()).redovi;
  } catch (e) {
    return { ok: false, greska: `Не могу да прочитам фајл: ${(e as Error).message}` };
  }
  if (redovi.length === 0)
    return { ok: false, greska: "У фајлу нема ниједног реда са именом." };

  const rez = await upisiGrad(naziv, redovi, fajl.name);
  if ("greska" in rez)
    return { ok: false, greska: `Грешка при упису: ${rez.greska}` };

  revalidatePath("/admin/gradovi");
  revalidatePath("/admin/ucitavanje");
  revalidatePath("/admin");
  revalidatePath("/");

  return {
    ok: true,
    poruka: `Град „${naziv}": у фајлу ${redovi.length} · ново уписано ${rez.upisano} · већ постојало ${redovi.length - rez.upisano}.`,
  };
}

// ---- 2) Више градова из једног фајла (назив листа = град) -----------
export async function ucitajViseListova(
  _p: StanjeUcitavanja,
  formData: FormData,
): Promise<StanjeUcitavanja> {
  await zahtijevajAdmina();

  const fajl = preuzmiExcel(formData);
  if ("greska" in fajl) return { ok: false, greska: fajl.greska };

  let listovi: { list: string; redovi: RedGrada[] }[];
  try {
    listovi = procitajViseListova(await fajl.arrayBuffer());
  } catch (e) {
    return { ok: false, greska: `Не могу да прочитам фајл: ${(e as Error).message}` };
  }
  if (listovi.length === 0)
    return { ok: false, greska: "Ниједан лист нема редова са именом." };

  const dijelovi: string[] = [];
  for (const { list, redovi } of listovi) {
    const naziv = list.trim().replace(/\s+/g, " ");
    const rez = await upisiGrad(naziv, redovi, fajl.name);
    if ("greska" in rez)
      return { ok: false, greska: `Лист „${list}": ${rez.greska}` };
    dijelovi.push(`${naziv}: ${redovi.length} у фајлу, ${rez.upisano} ново`);
  }

  revalidatePath("/admin/gradovi");
  revalidatePath("/admin/ucitavanje");
  revalidatePath("/admin");
  revalidatePath("/");

  return {
    ok: true,
    poruka:
      `Учитано ${listovi.length} листова. ` +
      dijelovi.join(" · ") +
      `. Провјери називе на страници Градови и по потреби их преименуј.`,
  };
}

// ---- 3) Комплетна листа бар кодова ---------------------------------
export async function ucitajBarKodove(
  _p: StanjeUcitavanja,
  formData: FormData,
): Promise<StanjeUcitavanja> {
  await zahtijevajAdmina();

  const fajl = preuzmiExcel(formData);
  if ("greska" in fajl) return { ok: false, greska: fajl.greska };

  let kodovi: string[];
  try {
    kodovi = procitajListuBarKodova(await fajl.arrayBuffer());
  } catch (e) {
    return { ok: false, greska: `Не могу да прочитам фајл: ${(e as Error).message}` };
  }
  if (kodovi.length === 0)
    return { ok: false, greska: "У фајлу нема бар кодова од 13 цифара." };

  const rez = await upisiUGrupama(
    "bar_kodovi",
    kodovi.map((bar_kod) => ({ bar_kod })),
    "bar_kod",
    "bar_kod",
    1000,
  );
  if ("greska" in rez)
    return { ok: false, greska: `Грешка при упису: ${rez.greska}` };

  revalidatePath("/admin/ucitavanje");
  revalidatePath("/admin");

  return {
    ok: true,
    poruka: `Бар кодови: ${kodovi.length} јединствених у фајлу · ново уписано ${rez.upisano} · већ постојало ${kodovi.length - rez.upisano}.`,
  };
}
