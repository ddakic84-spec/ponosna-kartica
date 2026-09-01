"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  validnoImePrezime,
  validanGrad,
  validanBarKod,
  validanTelefon,
} from "@/lib/validacija";
import { provjeriZahtjev, type RezultatProvjere } from "@/app/provjera";
import { Turnstile } from "@/components/turnstile";

const PORUKA_FORMAT = "Молимо да унесете податке у траженом формату.";
const PORUKA_PRIHVACEN =
  "Ваш захтјев је прихваћен. Добићете активациони код путем СМСа.";
const EMAIL_FONDACIJE = "dragan.dakic@zaporodicu.org";

type Ishod =
  | { vrsta: "greska"; poruka: string }
  | { vrsta: "uspjeh"; poruka: string }
  | { vrsta: "info"; poruka: string }
  | { vrsta: "nije_evidentiran" }
  | null;

function izRezultata(r: RezultatProvjere): Ishod {
  switch (r.status) {
    case "prihvacen":
      return { vrsta: "uspjeh", poruka: PORUKA_PRIHVACEN };
    case "vec_podnesen":
      return {
        vrsta: "info",
        poruka:
          "Ваш претходни захтјев је прихваћен. Није дозвољено подношење више од једног захтјева.",
      };
    case "nije_evidentiran":
      return { vrsta: "nije_evidentiran" };
    case "bar_kod_nije_nadjen":
      return {
        vrsta: "greska",
        poruka:
          "Унесени бар код није пронађен. Провјерите да сте тачно преписали свих 13 цифара са картице.",
      };
    case "format":
      return { vrsta: "greska", poruka: PORUKA_FORMAT };
    case "previse_pokusaja":
      return {
        vrsta: "greska",
        poruka:
          "Превише покушаја у кратком времену. Сачекајте неколико минута па покушајте поново.",
      };
    case "robot":
      return {
        vrsta: "greska",
        poruka:
          "Провјера „нисам робот“ није успјела. Освјежите страницу и покушајте поново.",
      };
    default:
      return {
        vrsta: "greska",
        poruka: "Тренутно није могуће обрадити захтјев. Покушајте поново.",
      };
  }
}

export default function ZahtevForma({
  gradovi,
  turnstileSiteKey,
}: {
  gradovi: string[];
  turnstileSiteKey?: string;
}) {
  const [imePrezime, setImePrezime] = useState("");
  const [grad, setGrad] = useState("");
  const [barKod, setBarKod] = useState("");
  const [telefon, setTelefon] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [ishod, setIshod] = useState<Ishod>(null);
  const [pokusano, setPokusano] = useState(false);
  const [saljem, setSaljem] = useState(false);

  const onToken = useCallback((t: string) => setTurnstileToken(t), []);

  const greske = {
    imePrezime: !validnoImePrezime(imePrezime),
    grad: !validanGrad(grad, gradovi),
    barKod: !validanBarKod(barKod),
    telefon: !validanTelefon(telefon),
  };

  const cekaRobota = Boolean(turnstileSiteKey) && turnstileToken === "";

  async function posalji(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPokusano(true);

    const sveIspravno =
      !greske.imePrezime && !greske.grad && !greske.barKod && !greske.telefon;
    if (!sveIspravno) {
      setIshod({ vrsta: "greska", poruka: PORUKA_FORMAT });
      return;
    }
    if (cekaRobota) {
      setIshod({
        vrsta: "greska",
        poruka: "Молимо сачекајте да се учита провјера „нисам робот“.",
      });
      return;
    }

    setSaljem(true);
    setIshod(null);
    try {
      const r = await provjeriZahtjev({
        imePrezime,
        grad,
        barKod,
        telefon,
        turnstileToken,
        honeypot,
      });
      setIshod(izRezultata(r));
    } catch {
      setIshod({
        vrsta: "greska",
        poruka: "Тренутно није могуће обрадити захтјев. Покушајте поново.",
      });
    } finally {
      setSaljem(false);
    }
  }

  function klasaPolja(nevalidno: boolean): string {
    const osnovno =
      "mt-1 w-full rounded-md border px-3 py-2 outline-none bg-white";
    return pokusano && nevalidno
      ? `${osnovno} border-red-500 focus:border-red-500`
      : `${osnovno} border-zinc-300 focus:border-zinc-500`;
  }

  return (
    <form onSubmit={posalji} noValidate className="space-y-6">
      {/* мамац за ботове — сакривено од људи */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        aria-hidden="true"
      />

      <div>
        <label htmlFor="imePrezime" className="block text-sm font-medium">
          Име и Презиме
        </label>
        <input
          id="imePrezime"
          name="imePrezime"
          type="text"
          value={imePrezime}
          onChange={(e) => setImePrezime(e.target.value)}
          autoComplete="name"
          aria-invalid={pokusano && greske.imePrezime}
          className={klasaPolja(greske.imePrezime)}
        />
        <p className="mt-1 text-xs text-zinc-500">
          На ћирилици, у облику „Име Презиме" (свака ријеч великим почетним словом).
        </p>
      </div>

      <div>
        <label htmlFor="grad" className="block text-sm font-medium">
          Град
        </label>
        <select
          id="grad"
          name="grad"
          value={grad}
          onChange={(e) => setGrad(e.target.value)}
          aria-invalid={pokusano && greske.grad}
          className={klasaPolja(greske.grad)}
        >
          <option value="">— изаберите град —</option>
          {gradovi.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="barKod" className="block text-sm font-medium">
          Бар код са нове Поносне картице 2026-2028
        </label>
        <input
          id="barKod"
          name="barKod"
          type="text"
          inputMode="numeric"
          value={barKod}
          onChange={(e) =>
            setBarKod(e.target.value.replace(/[^0-9]/g, "").slice(0, 13))
          }
          aria-invalid={pokusano && greske.barKod}
          className={klasaPolja(greske.barKod)}
        />
        <p className="mt-1 text-xs text-zinc-500">
          Тачно 13 цифара, нпр. „2707…“.
        </p>
      </div>

      <div>
        <label htmlFor="telefon" className="block text-sm font-medium">
          Број телефона
        </label>
        <input
          id="telefon"
          name="telefon"
          type="text"
          inputMode="numeric"
          value={telefon}
          onChange={(e) =>
            setTelefon(e.target.value.replace(/[^0-9]/g, "").slice(0, 11))
          }
          aria-invalid={pokusano && greske.telefon}
          className={klasaPolja(greske.telefon)}
        />
        <p className="mt-1 text-xs text-zinc-500">
          Почиње са „3876“ и има још тачно 7 цифара (укупно 11). Без знака „+“,
          без почетне нуле, без размака и цртица.
        </p>
      </div>

      {turnstileSiteKey && (
        <Turnstile siteKey={turnstileSiteKey} onToken={onToken} />
      )}

      {ishod && ishod.vrsta === "nije_evidentiran" && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          Нисте евидентирани као корисник Поносне картице 2026-2028. Молимо да се
          обратите Фондацији на{" "}
          <a href={`mailto:${EMAIL_FONDACIJE}`} className="font-medium underline">
            {EMAIL_FONDACIJE}
          </a>
          .
        </p>
      )}

      {ishod && ishod.vrsta !== "nije_evidentiran" && (
        <p
          role="alert"
          className={
            ishod.vrsta === "greska"
              ? "rounded-md bg-red-50 px-3 py-2 text-sm text-red-800"
              : ishod.vrsta === "info"
                ? "rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800"
                : "rounded-md bg-green-50 px-3 py-2 text-sm text-green-800"
          }
        >
          {ishod.poruka}
        </p>
      )}

      <p className="text-xs text-zinc-500">
        Подношењем захтјева прихватате обраду унесених података у сврху програма
        „Поносна картица 2026–2028". Више у{" "}
        <Link href="/privatnost" className="underline">
          Обавјештењу о приватности
        </Link>
        .
      </p>

      <button
        type="submit"
        disabled={saljem}
        className="w-full rounded-md bg-zinc-900 px-4 py-2.5 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {saljem ? "Провјера…" : "Поднеси захтјев за Нестро е-картицу"}
      </button>
    </form>
  );
}
