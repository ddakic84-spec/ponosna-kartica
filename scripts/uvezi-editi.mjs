// Увоз фајлова из F:/Foondacija/2026/editi у базу.
// node --env-file=.env.local scripts/uvezi-editi.mjs

import * as XLSX from "xlsx";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const folder = "F:/Foondacija/2026/editi";
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const GRAD = {
  "Banja Luka": "Бања Лука", "Banja Luka_dopina": "Бања Лука", BL: "Бања Лука",
  "Градишка": "Градишка", "Брод": "Брод", "Прњавор": "Прњавор",
  "Kotor Varoš": "Котор Варош", Kostajnica: "Костајница", Knezevo: "Кнежево",
  "Лакташи": "Лакташи", Laktasi: "Лакташи",
  "Istočno Novo Sarajevo": "Источно Ново Сарајево", Berkovici: "Берковићи",
  "Зворник": "Зворник", "Челинац": "Челинац", Sheet3: null,
};
const FAJLOVI = [
  "1.Захтјеви_23082026.xls", "2.Захтјеви_25082026.xls",
  "3.Захтјеви_26082026.xlsx", "Berkovici.xlsx", "Nedostajuce.xlsx",
];

const CIR = /[Ѐ-ӿ]/, LAT = /[A-Za-z]/;
const KLJUCNE = /(име|презиме|датум|година|годиште|број|телефон|редни|мобил|дјет|ime|prezime|redni|broj|dopina|достављен|bar\s*kod|barkod|корисник|подносилац)/i;
function liciNaIme(v) {
  const t = String(v ?? "").trim().replace(/\s+/g, " ");
  if (!t || /\d/.test(t) || KLJUCNE.test(t)) return false;
  const w = t.split(" ").filter(Boolean);
  return w.length >= 2 && w.every((r) => CIR.test(r[0]) || LAT.test(r[0]));
}
const bk13 = (v) => {
  const c = String(v ?? "").replace(/[^0-9]/g, "");
  return /^[0-9]{13}$/.test(c) ? c : null;
};
const LAT_U_CIR = { A:"А",a:"а",B:"В",C:"С",c:"с",E:"Е",e:"е",H:"Н",J:"Ј",j:"ј",K:"К",k:"к",M:"М",O:"О",o:"о",P:"Р",p:"р",T:"Т",X:"Х",x:"х",Y:"У",y:"у" };
const norm = (ime) =>
  Array.from(String(ime ?? "").trim()).map((ch) => LAT_U_CIR[ch] ?? ch).join("")
    .toLowerCase().split(/\s+/).filter(Boolean).sort().join(" ");

// скупи по граду
const poGradu = new Map();
for (const f of FAJLOVI) {
  const wb = XLSX.read(await readFile(folder + "/" + f), { type: "buffer" });
  for (const list of wb.SheetNames) {
    if (!(list in GRAD)) { console.log("⚠ непознат лист:", f, "/", list); continue; }
    const grad = GRAD[list];
    if (!grad) continue;
    const M = XLSX.utils.sheet_to_json(wb.Sheets[list], { header: 1, blankrows: false, raw: true });
    if (!poGradu.has(grad)) poGradu.set(grad, []);
    for (const r of M) {
      const cells = (r || []).map((c) => String(c ?? "").trim());
      const ime = cells.find(liciNaIme);
      if (!ime) continue;
      const bk = cells.map(bk13).find(Boolean) ?? null;
      poGradu.get(grad).push({ ime_prezime: ime.replace(/\s+/g, " "), bar_kod: bk });
    }
  }
}

for (const [grad, redovi] of [...poGradu].sort()) {
  await s.from("gradovi").upsert({ naziv: grad }, { onConflict: "naziv", ignoreDuplicates: true });
  // дедуп унутар увоза по (норм. име | бар код)
  const jed = new Map();
  for (const r of redovi) jed.set(`${norm(r.ime_prezime)}|${r.bar_kod ?? ""}`, r);
  const zaUpis = [...jed.values()].map((r) => ({
    ime_prezime: r.ime_prezime, grad, bar_kod: r.bar_kod,
    ime_norm: norm(r.ime_prezime), izvor_datoteka: "editi",
  }));
  let novo = 0;
  for (let i = 0; i < zaUpis.length; i += 500) {
    const { data, error } = await s.from("korisnici_kartice")
      .upsert(zaUpis.slice(i, i + 500), { onConflict: "grad,ime_prezime,bar_kod", ignoreDuplicates: true })
      .select("id");
    if (error) throw new Error(`${grad}: ${error.message}`);
    novo += data?.length ?? 0;
  }
  console.log(`${grad.padEnd(22)} у фајловима ${String(zaUpis.length).padStart(4)}  ново ${novo}`);
}

for (const t of ["gradovi", "korisnici_kartice", "bar_kodovi"]) {
  const { count } = await s.from(t).select("*", { count: "exact", head: true });
  console.log(`${t}: ${count}`);
}
