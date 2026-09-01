import Link from "next/link";
import Image from "next/image";
import ZahtevForma from "@/components/zahtev-forma";
import { Zaglavlje } from "@/components/zaglavlje";
import logoTtd from "@/assets/logo-ttd.png";
import { dajGradove } from "@/lib/baza";

// Листа градова се чита из базе при сваком отварању, да нови градови одмах уђу у мени.
export const dynamic = "force-dynamic";

export default async function Pocetna() {
  let gradovi: string[] = [];
  let greskaBaze = false;
  try {
    gradovi = await dajGradove();
  } catch (e) {
    greskaBaze = true;
    console.error("Не могу да учитам градове:", e);
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 sm:py-16">
      <Zaglavlje />

      <h1 className="text-2xl font-semibold tracking-tight">
        Захтјев за Нестро е-картицу
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Попуњавају само корисници нове Поносне картице 2026–2028 у оквиру пројекта
        „Пријатељи породице“. Попуните сва поља тачно у траженом облику.
      </p>

      {greskaBaze && (
        <p className="mt-6 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Тренутно није могуће учитати листу градова. Покушајте касније.
        </p>
      )}

      <div className="mt-8">
        <ZahtevForma
          gradovi={gradovi}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        />
      </div>

      <footer className="mt-16 flex items-center justify-between gap-4 border-t border-zinc-200 pt-4">
        <div className="flex gap-4 text-xs text-zinc-400">
          <Link href="/privatnost" className="hover:text-zinc-600">
            Обавјештење о приватности
          </Link>
          <Link href="/admin" className="hover:text-zinc-600">
            Админ
          </Link>
        </div>
        <Image
          src={logoTtd}
          alt="Transforming to Digital Ltd"
          className="h-6 w-auto opacity-80"
        />
      </footer>
    </main>
  );
}
