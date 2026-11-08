import "server-only";
import * as XLSX from "xlsx";
import { supabaseServer } from "@/lib/supabase-server";

// Прављење Excel фајла са поднесеним захтјевима — сваки град у свом листу.
//
// Три врсте извоза:
//  - "svi"    — сви захтјеви
//  - "novi"   — само они који још нису преузети (колона `izvezeno` је празна)
//  - "zadnji" — поново она група која је задња преузета као „нови"
//               (за случај да се преузимање изгуби или обрише)

export type VrstaIzvoza = "svi" | "novi" | "zadnji";

const KOLONE = [
  "Име и Презиме",
  "Град",
  "Бар код",
  "Број телефона",
  "Датум и вријеме подношења",
];

type Zahtjev = {
  id: number;
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

async function dohvatiZahtjeve(vrsta: VrstaIzvoza): Promise<Zahtjev[]> {
  let marker: string | null = null;
  if (vrsta === "zadnji") {
    const { data, error } = await supabaseServer
      .from("zahtjevi")
      .select("izvezeno")
      .not("izvezeno", "is", null)
      .order("izvezeno", { ascending: false })
      .limit(1);
    if (error) throw error;
    marker = (data?.[0]?.izvezeno as string | undefined) ?? null;
    if (!marker) return [];
  }

  const out: Zahtjev[] = [];
  for (let od = 0; ; od += 1000) {
    const osnova = supabaseServer
      .from("zahtjevi")
      .select("id, ime_prezime, grad, bar_kod, telefon, vrijeme");
    const filtrirano =
      vrsta === "novi"
        ? osnova.is("izvezeno", null)
        : vrsta === "zadnji"
          ? osnova.eq("izvezeno", marker as string)
          : osnova;
    const { data, error } = await filtrirano
      .order("grad")
      .order("vrijeme")
      .order("id")
      .range(od, od + 999);
    if (error) throw error;
    out.push(...((data ?? []) as Zahtjev[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export async function napraviIzvozZahtjeva(
  vrsta: VrstaIzvoza = "svi",
): Promise<{ podaci: ArrayBuffer; ids: number[] }> {
  const redovi = await dohvatiZahtjeve(vrsta);

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
      vrsta === "novi" ? "Нема нових захтјева" : "Нема захтјева",
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

  return {
    podaci: XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer,
    ids: redovi.map((r) => r.id),
  };
}

// Забиљежи да су ови захтјеви преузети (све добијају исту ознаку = једна група).
export async function oznaciKaoPreuzete(ids: number[], marker: string): Promise<void> {
  for (let i = 0; i < ids.length; i += 200) {
    const { error } = await supabaseServer
      .from("zahtjevi")
      .update({ izvezeno: marker })
      .in("id", ids.slice(i, i + 200));
    if (error) throw error;
  }
}

// Колико је захтјева још непреузето. null = колона још не постоји (измјена 5
// није покренута у бази).
export async function brojNovihZahtjeva(): Promise<number | null> {
  const { count, error } = await supabaseServer
    .from("zahtjevi")
    .select("*", { count: "exact", head: true })
    .is("izvezeno", null);
  if (error) return null;
  return count ?? 0;
}
