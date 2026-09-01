// Једнократно учитавање СВИХ правих Excel фајлова у базу.
// Ради исту ствар као админ форме, само за све фајлове одједном.
// node --env-file=.env.local scripts/ucitaj-prave-podatke.mjs "<фајл-са-путањом>"

import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const folder = (await readFile(process.argv[2], "utf8")).trim();
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const LAT_U_CIR = {
  A: "А", a: "а", B: "В", C: "С", c: "с", E: "Е", e: "е", H: "Н", J: "Ј",
  j: "ј", K: "К", k: "к", M: "М", O: "О", o: "о", P: "Р", p: "р", T: "Т",
  X: "Х", x: "х", Y: "У", y: "у",
};
const normalizujIme = (ime) =>
  Array.from((ime ?? "").trim().replace(/\s+/g, " "))
    .map((ch) => LAT_U_CIR[ch] ?? ch)
    .join("")
    .toLowerCase();
const samoCifre = (v) => (v ?? "").replace(/[^0-9]/g, "");
const tekstCelije = (v) => {
  if (v == null) return "";
  if (typeof v === "object") {
    if (v.result != null) return String(v.result);
    if (v.text != null) return String(v.text);
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text ?? "").join("");
    return "";
  }
  return String(v);
};

const NAZIVI = {
  Banjaluka: "Бања Лука", Bijeljina: "Бијељина", Celinac: "Челинац",
  Derventa: "Дервента", Doboj: "Добој", Foca: "Фоча", Gradiska: "Градишка",
  IstocnoNovoSarajevo: "Источно Ново Сарајево", Kostajnica: "Костајница",
  "Kotor Varos": "Котор Варош", "Kozarska Dubica": "Козарска Дубица",
  Ljubinje: "Љубиње", Modrica: "Модрича", NoviGrad: "Нови Град",
  Prijedor: "Приједор", Prnjavor: "Прњавор", Samac: "Шамац", Sipovo: "Шипово",
  Teslic: "Теслић", Ugljevik: "Угљевик", Zvornik: "Зворник",
};

async function upsertGrupe(tabela, redovi, onConflict, kol) {
  let upisano = 0;
  const N = 1000;
  for (let i = 0; i < redovi.length; i += N) {
    const { data, error } = await s
      .from(tabela)
      .upsert(redovi.slice(i, i + N), { onConflict, ignoreDuplicates: true })
      .select(kol);
    if (error) throw new Error(`${tabela}: ${error.message}`);
    upisano += data?.length ?? 0;
  }
  return upisano;
}

// --- градови ---
for (const [latinski, naziv] of Object.entries(NAZIVI)) {
  const fajl = path.join(folder, `${latinski}.xlsx`);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(fajl);
  const ws = wb.worksheets[0];

  await s.from("gradovi").upsert({ naziv }, { onConflict: "naziv", ignoreDuplicates: true });

  const zaUpis = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const ime = tekstCelije(ws.getRow(r).getCell(1).value).trim().replace(/\s+/g, " ");
    if (!ime) continue;
    const bk = samoCifre(tekstCelije(ws.getRow(r).getCell(2).value));
    zaUpis.push({
      ime_prezime: ime,
      grad: naziv,
      bar_kod: /^[0-9]{13}$/.test(bk) ? bk : null,
      ime_norm: normalizujIme(ime),
      izvor_datoteka: `${latinski}.xlsx`,
    });
  }
  const n = await upsertGrupe("korisnici_kartice", zaUpis, "grad,ime_prezime,bar_kod", "id");
  console.log(`${naziv.padEnd(22)} у фајлу ${String(zaUpis.length).padStart(5)}  ново ${n}`);
}

// --- master бар кодови ---
const wbM = new ExcelJS.Workbook();
await wbM.xlsx.readFile(path.join(folder, "Kodovi_2026_2028 (Autosaved).xlsx"));
const kodovi = new Set();
wbM.worksheets[0].eachRow((row) => {
  const bk = samoCifre(tekstCelije(row.getCell(1).value));
  if (/^[0-9]{13}$/.test(bk)) kodovi.add(bk);
});
const nk = await upsertGrupe("bar_kodovi", [...kodovi].map((bar_kod) => ({ bar_kod })), "bar_kod", "bar_kod");
console.log(`\nБар кодови: у фајлу ${kodovi.size}  ново ${nk}`);

// --- преглед ---
for (const t of ["gradovi", "korisnici_kartice", "bar_kodovi"]) {
  const { count } = await s.from(t).select("*", { count: "exact", head: true });
  console.log(`${t}: ${count}`);
}
