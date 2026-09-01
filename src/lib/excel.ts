import "server-only";
import * as XLSX from "xlsx";
import { samoCifre } from "@/lib/normalizacija";

// Читање учитаних Excel фајлова (.xlsx и .xls).
//
// Улазне листе су неуредне: колона са именом није увијек иста, има насловних
// редова, негдје су и телефони/датуми. Зато за сваки ред узимамо ПРВУ ћелију
// која личи на „Име Презиме", а бар код (ако постоји) је прва ћелија у реду
// која је тачно 13 цифара.

export type RedGrada = { imePrezime: string; barKod: string | null };

const CIRILICA = /[Ѐ-ӿ]/;
const LATINICA = /[A-Za-z]/;
const KLJUCNE_RIJECI =
  /(име|презиме|датум|година|годиште|број|телефон|редни|мобил|дјет|ime|prezime|redni|broj|dopina|достављен|bar\s*kod|barkod|корисник|подносилац)/i;

function liciNaImeIPrezime(v: string): boolean {
  const t = v.trim().replace(/\s+/g, " ");
  if (!t || /\d/.test(t)) return false;
  if (KLJUCNE_RIJECI.test(t)) return false;
  const rijeci = t.split(" ").filter(Boolean);
  if (rijeci.length < 2) return false;
  return rijeci.every((r) => CIRILICA.test(r[0]) || LATINICA.test(r[0]));
}

function ucitajKnjigu(buffer: ArrayBuffer): XLSX.WorkBook {
  return XLSX.read(new Uint8Array(buffer), { type: "array" });
}

function matricaLista(ws: XLSX.WorkSheet): string[][] {
  const redovi = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    blankrows: false,
    raw: true,
  });
  return redovi.map((r) => (r ?? []).map((c) => (c == null ? "" : String(c).trim())));
}

function redoviIzLista(ws: XLSX.WorkSheet | undefined): RedGrada[] {
  if (!ws) return [];
  const out: RedGrada[] = [];
  for (const cells of matricaLista(ws)) {
    const ime = cells.find(liciNaImeIPrezime);
    if (!ime) continue;
    let barKod: string | null = null;
    for (const c of cells) {
      const d = samoCifre(c);
      if (/^[0-9]{13}$/.test(d)) {
        barKod = d;
        break;
      }
    }
    out.push({ imePrezime: ime.replace(/\s+/g, " "), barKod });
  }
  return out;
}

// Један лист = један град.
export function procitajGradskuListu(buffer: ArrayBuffer): { redovi: RedGrada[] } {
  const wb = ucitajKnjigu(buffer);
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error("Excel фајл нема ниједан лист.");
  return { redovi: redoviIzLista(ws) };
}

// Више листова = више градова (назив листа = предложени назив града).
export function procitajViseListova(
  buffer: ArrayBuffer,
): { list: string; redovi: RedGrada[] }[] {
  const wb = ucitajKnjigu(buffer);
  return wb.SheetNames.map((ime) => ({
    list: ime,
    redovi: redoviIzLista(wb.Sheets[ime]),
  })).filter((x) => x.redovi.length > 0);
}

// Комплетна листа бар кодова — свака ћелија која је 13 цифара.
export function procitajListuBarKodova(buffer: ArrayBuffer): string[] {
  const wb = ucitajKnjigu(buffer);
  const kodovi = new Set<string>();
  for (const ime of wb.SheetNames) {
    for (const cells of matricaLista(wb.Sheets[ime])) {
      for (const c of cells) {
        const d = samoCifre(c);
        if (/^[0-9]{13}$/.test(d)) {
          kodovi.add(d);
          break;
        }
      }
    }
  }
  return [...kodovi];
}
