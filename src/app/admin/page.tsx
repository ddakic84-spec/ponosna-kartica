import Link from "next/link";
import { zahtijevajAdmina } from "@/lib/admin-sesija";
import { odjaviSe } from "@/lib/admin-akcije";
import { brojRedova } from "@/lib/baza";
import { brojNovihZahtjeva } from "@/lib/izvoz";

export default async function AdminPocetna() {
  // Ако није пријављен — одмах на страницу за пријаву.
  await zahtijevajAdmina();

  const [brGradova, brKorisnika, brKodova, brZahtjeva, brNovih] =
    await Promise.all([
      brojRedova("gradovi"),
      brojRedova("korisnici_kartice"),
      brojRedova("bar_kodovi"),
      brojRedova("zahtjevi"),
      brojNovihZahtjeva(),
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
      </nav>

      <section className="mt-6 rounded-lg border border-zinc-200 p-4">
        <h2 className="font-medium">Захтјеви као Excel</h2>

        {brNovih === null ? (
          <p className="mt-2 text-sm text-amber-700">
            За „само нове" је потребна измјена базе 0005 (још није покренута).
          </p>
        ) : (
          <>
            <form method="post" action="/admin/preuzmi" className="mt-3">
              <button
                type="submit"
                disabled={brNovih === 0}
                className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Преузми само НОВЕ захтјеве ({brNovih})
              </button>
            </form>
            <p className="mt-2 text-xs text-zinc-500">
              „Нови" су они који нису били у ранијем преузимању. Послије преузимања
              се бележе као преузети (освјежи страницу да видиш нови број).
            </p>
          </>
        )}

        <div className="mt-4 flex flex-col gap-1 text-sm">
          {brNovih !== null && (
            <a
              href="/admin/preuzmi?vrsta=zadnji"
              className="text-zinc-600 underline hover:text-zinc-900"
            >
              Поново преузми задњу групу „нових"
            </a>
          )}
          <a
            href="/admin/preuzmi"
            className="text-zinc-600 underline hover:text-zinc-900"
          >
            Преузми СВЕ захтјеве ({brZahtjeva})
          </a>
        </div>
      </section>
    </main>
  );
}
