import Link from "next/link";
import { zahtijevajAdmina } from "@/lib/admin-sesija";
import { brojRedova } from "@/lib/baza";
import { FormaGradskaLista, FormaViseListova, FormaBarKodovi } from "./forme";

export default async function Ucitavanje() {
  await zahtijevajAdmina();

  const [brGradova, brKorisnika, brKodova] = await Promise.all([
    brojRedova("gradovi"),
    brojRedova("korisnici_kartice"),
    brojRedova("bar_kodovi"),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link href="/admin" className="text-sm text-zinc-600 underline">
        ← назад на админ
      </Link>
      <h1 className="mt-3 text-xl font-semibold tracking-tight">
        Учитавање података
      </h1>

      <p className="mt-2 text-sm text-zinc-600">
        Тренутно у бази: {brGradova} градова · {brKorisnika} корисника · {brKodova}{" "}
        бар кодова.
      </p>

      <section className="mt-8 rounded-lg border border-zinc-200 p-5">
        <h2 className="font-medium">1) Листа града (име + бар код)</h2>
        <p className="mt-1 mb-4 text-sm text-zinc-600">
          Учитава се један град по фајлу. Понови учитавање кад имаш нова имена —
          додаће се само нови редови, постојећи се прескачу.
        </p>
        <FormaGradskaLista />
      </section>

      <section className="mt-6 rounded-lg border border-zinc-200 p-5">
        <h2 className="font-medium">2) Фајл са више листова (више градова)</h2>
        <p className="mt-1 mb-4 text-sm text-zinc-600">
          Један фајл, сваки лист је други град. Погодно за „Захтјеви" фајлове.
        </p>
        <FormaViseListova />
      </section>

      <section className="mt-6 rounded-lg border border-zinc-200 p-5">
        <h2 className="font-medium">3) Комплетна листа бар кодова</h2>
        <p className="mt-1 mb-4 text-sm text-zinc-600">
          Велика листа (~12.000). Може да потраје неколико секунди.
        </p>
        <FormaBarKodovi />
      </section>
    </main>
  );
}
