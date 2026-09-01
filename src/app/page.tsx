import Link from "next/link";
import ZahtevForma from "@/components/zahtev-forma";
import { dajGradove } from "@/lib/baza";

// Листа градова се чита из базе при сваком отварању, да нови градови одмах уђу у мени.
export const dynamic = "force-dynamic";

export default async function Pocetna() {
  const gradovi = await dajGradove();

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:py-16">
      <h1 className="text-2xl font-semibold tracking-tight">
        Захтјев за Нестро е-картицу
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Програм „Поносна картица 2026–2028". Попуните сва поља тачно у траженом
        облику.
      </p>

      <div className="mt-8">
        <ZahtevForma
          gradovi={gradovi}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        />
      </div>

      <footer className="mt-16 flex gap-4 border-t border-zinc-200 pt-4 text-xs text-zinc-400">
        <Link href="/privatnost" className="hover:text-zinc-600">
          Обавјештење о приватности
        </Link>
        <Link href="/admin" className="hover:text-zinc-600">
          Админ
        </Link>
      </footer>
    </main>
  );
}
