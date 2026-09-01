// Провјера да ли је база подешена како треба.
// Покретање:  node --env-file=.env.local scripts/provjeri-bazu.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon || !service) {
  console.error("Недостаје неко подешавање у .env.local");
  process.exit(1);
}

const TABELE = ["gradovi", "korisnici_kartice", "bar_kodovi", "zahtjevi"];

const serverski = createClient(url, service, { auth: { persistSession: false } });
const javni = createClient(url, anon, { auth: { persistSession: false } });

console.log("1) Провјера да ли табеле постоје (серверски приступ):");
let sveOk = true;
for (const t of TABELE) {
  const { count, error } = await serverski
    .from(t)
    .select("*", { count: "exact", head: true });
  if (error) {
    console.log(`   ✗ ${t}: ${error.message}`);
    sveOk = false;
  } else {
    console.log(`   ✓ ${t}: постоји, редова: ${count ?? 0}`);
  }
}

console.log("\n2) Провјера да јавни (anon) приступ НЕ може да чита податке:");
for (const t of TABELE) {
  const { data, error } = await javni.from(t).select("*").limit(1);
  const blokirano = error !== null || (Array.isArray(data) && data.length === 0);
  console.log(
    `   ${blokirano ? "✓" : "✗"} ${t}: ${
      error ? `одбијено (${error.message})` : `враћено редова: ${data?.length ?? 0}`
    }`,
  );
  if (!blokirano) sveOk = false;
}

console.log(sveOk ? "\nСве у реду." : "\nНешто није у реду — погледај горе.");
process.exit(sveOk ? 0 : 1);
