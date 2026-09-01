import Link from "next/link";
import { zahtijevajAdmina } from "@/lib/admin-sesija";
import { supabaseServer } from "@/lib/supabase-server";
import { FormaDodajGrad, DugmeObrisiGrad, DugmePreimenuj } from "./dijelovi";

export default async function Gradovi() {
  await zahtijevajAdmina();

  const { data: gradovi } = await supabaseServer
    .from("gradovi")
    .select("naziv")
    .order("naziv");

  // Број корисника по граду — засебан упит по граду (тачан број, без ограничења).
  const lista = await Promise.all(
    (gradovi ?? []).map(async (g) => {
      const naziv = g.naziv as string;
      const { count } = await supabaseServer
        .from("korisnici_kartice")
        .select("*", { count: "exact", head: true })
        .eq("grad", naziv);
      return { naziv, broj: count ?? 0 };
    }),
  );

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link href="/admin" className="text-sm text-zinc-600 underline">
        ← назад на админ
      </Link>
      <h1 className="mt-3 text-xl font-semibold tracking-tight">Градови</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Градови се могу додати и овдје ручно, или се сами направе при учитавању
        листе.
      </p>

      <div className="mt-6 max-w-md">
        <FormaDodajGrad />
      </div>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-zinc-500">
            <th className="py-2">Град</th>
            <th className="py-2 text-right">Корисника</th>
            <th className="py-2 text-right">&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {lista.length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 text-zinc-500">
                Још нема ниједног града.
              </td>
            </tr>
          )}
          {lista.map((g) => (
            <tr key={g.naziv} className="border-b border-zinc-100">
              <td className="py-2">{g.naziv}</td>
              <td className="py-2 text-right tabular-nums">{g.broj}</td>
              <td className="py-2">
                <div className="flex justify-end gap-4">
                  <DugmePreimenuj naziv={g.naziv} />
                  <DugmeObrisiGrad naziv={g.naziv} brojKorisnika={g.broj} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
