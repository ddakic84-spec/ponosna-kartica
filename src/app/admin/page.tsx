import Link from "next/link";
import { zahtijevajAdmina } from "@/lib/admin-sesija";
import { odjaviSe } from "@/lib/admin-akcije";
import { brojRedova } from "@/lib/baza";

export default async function AdminPocetna() {
  // Ако није пријављен — одмах на страницу за пријаву.
  await zahtijevajAdmina();

  const [brGradova, brKorisnika, brKodova, brZahtjeva] = await Promise.all([
    brojRedova("gradovi"),
    brojRedova("korisnici_kartice"),
    brojRedova("bar_kodovi"),
    brojRedova("zahtjevi"),
  ]);

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Админ</h1>
        <form action={odjaviSe}>
          <button type="submit" className="text-sm text-zinc-600 underline">
            Одјава
          </button>
        </form>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-zinc-200 p-3">
          <dt className="text-zinc-500">Градови</dt>
          <dd className="text-lg tabular-nums">{brGradova}</dd>
        </div>
        <div className="rounded-lg border border-zinc-200 p-3">
          <dt className="text-zinc-500">Корисници на листама</dt>
          <dd className="text-lg tabular-nums">{brKorisnika}</dd>
        </div>
        <div className="rounded-lg border border-zinc-200 p-3">
          <dt className="text-zinc-500">Бар кодови (комплетна листа)</dt>
          <dd className="text-lg tabular-nums">{brKodova}</dd>
        </div>
        <div className="rounded-lg border border-zinc-200 p-3">
          <dt className="text-zinc-500">Поднесени захтјеви</dt>
          <dd className="text-lg tabular-nums">{brZahtjeva}</dd>
        </div>
      </dl>

      <nav className="mt-8 space-y-2">
        <Link
          href="/admin/ucitavanje"
          className="block rounded-md border border-zinc-200 px-4 py-3 hover:bg-zinc-50"
        >
          Учитавање података (Excel листе)
        </Link>
        <Link
          href="/admin/gradovi"
          className="block rounded-md border border-zinc-200 px-4 py-3 hover:bg-zinc-50"
        >
          Градови
        </Link>
        <a
          href="/admin/preuzmi"
          className="block rounded-md border border-zinc-200 px-4 py-3 hover:bg-zinc-50"
        >
          Преузми захтјеве као Excel ({brZahtjeva})
        </a>
      </nav>
    </main>
  );
}
