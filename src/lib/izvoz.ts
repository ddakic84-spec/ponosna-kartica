import "server-only";
import * as XLSX from "xlsx";
import { supabaseServer } from "@/lib/supabase-server";

// Прављење Excel фајла са поднесеним захтјевима — сваки град у свом листу.

const KOLONE = [
  "Име и Презиме",
  "Град",
  "Бар код",
  "Број телефона",
  "Датум и вријеме подношења",
];

type Zahtjev = {
  ime_prezime: string;
  grad: string;
  bar_kod: string;
  telefon: string;
  vrijeme: string;
};

function formatVrijeme(iso: string): string {
  return new Intl.DateTimeFormat("sr-Latn-BA", {
    timeZone: "Europe/Sarajevo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// Excel назив листа: највише 31 знак, без : \ / ? * [ ]
function ocistiNazivLista(naziv: string): string {
  const c = naziv.replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31).trim();
  return c || "Лист";
}

async function sviZahtjevi(): Promise<Zahtjev[]> {
  const out: Zahtjev[] = [];
  for (let od = 0; ; od += 1000) {
    const { data, error } = await supabaseServer
      .from("zahtjevi")
      .select("ime_prezime, grad, bar_kod, telefon, vrijeme")
      .order("grad")
      .order("vrijeme")
      .range(od, od + 999);
    if (error) throw error;
    out.push(...((data ?? []) as Zahtjev[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export async function napraviIzvozZahtjeva(): Promise<ArrayBuffer> {
  const redovi = await sviZahtjevi();

  const poGradu = new Map<string, Zahtjev[]>();
  for (const r of redovi) {
    if (!poGradu.has(r.grad)) poGradu.set(r.grad, []);
    poGradu.get(r.grad)!.push(r);
  }

  const wb = XLSX.utils.book_new();

  if (poGradu.size === 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([KOLONE]),
      "Нема захтјева",
    );
  } else {
    const zauzeti = new Set<string>();
    const gradovi = [...poGradu.keys()].sort((a, b) => a.localeCompare(b, "sr"));
    for (const grad of gradovi) {
      const aoa: (string | number)[][] = [KOLONE];
      for (const r of poGradu.get(grad)!) {
        aoa.push([
          r.ime_prezime,
          r.grad,
          r.bar_kod,
          r.telefon,
          formatVrijeme(r.vrijeme),
        ]);
      }
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = [{ wch: 26 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 20 }];

      let naziv = ocistiNazivLista(grad);
      let br = 2;
      while (zauzeti.has(naziv)) naziv = `${ocistiNazivLista(grad).slice(0, 27)} ${br++}`;
      zauzeti.add(naziv);
      XLSX.utils.book_append_sheet(wb, ws, naziv);
    }
  }

  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}
