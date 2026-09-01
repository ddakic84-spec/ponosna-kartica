import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Обавјештење о приватности — Поносна картица 2026–2028",
};

export default function Privatnost() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-16">
      <Link href="/" className="text-sm text-zinc-600 underline">
        ← назад на форму
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Обавјештење о приватности
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Односи се на обраду личних података приликом подношења захтјева за Нестро
        е-картицу у оквиру програма „Поносна картица 2026–2028".
      </p>

      <div className="mt-8 space-y-6 text-sm leading-6 text-zinc-700">
        <section>
          <h2 className="font-medium text-zinc-900">Ко обрађује податке</h2>
          <p className="mt-1">
            Руковалац података је Фондација „За породицу“, Булевар војводе Степе
            Степановића 94Б, 78000 Бања Лука, ЈИБ 4404670920001. Контакт за питања
            о заштити података:{" "}
            <a href="mailto:dragan.dakic@zaporodicu.org" className="underline">
              dragan.dakic@zaporodicu.org
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-medium text-zinc-900">Који подаци се прикупљају</h2>
          <ul className="mt-1 list-disc pl-5">
            <li>име и презиме,</li>
            <li>град,</li>
            <li>бар код картице,</li>
            <li>број телефона,</li>
            <li>датум и вријеме подношења захтјева.</li>
          </ul>
          <p className="mt-1">
            Не прикупљају се други подаци, нити се врши профилисање или
            аутоматизовано одлучивање са правним посљедицама.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-zinc-900">Сврха и правни основ</h2>
          <p className="mt-1">
            Подаци се обрађују искључиво ради провјере права на картицу и слања
            активационог кода путем СМС-а, у оквиру програма „Поносна картица
            2026–2028“. Подаци се сакупљају и обрађују у складу са пристанком
            корисника Поносне картице 2026–2028 који је дат приликом подношења
            захтјева у локалној заједници.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-zinc-900">Колико се чувају</h2>
          <p className="mt-1">
            Поднесени захтјеви чувају се за вријеме трајања програма „Поносна
            картица 2026–2028", а најкасније по његовом завршетку се бришу.
            Техничке евиденције о ограничењу броја покушаја (у виду хеша IP
            адресе, без саме адресе) бришу се у року од 24 сата.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-zinc-900">Ко још има приступ</h2>
          <p className="mt-1">
            Подацима приступа само овлашћено лице Фондације. У техничкој обради
            учествују пружаоци услуга: Supabase (база података, сервери у ЕУ),
            Vercel (хостинг апликације) и Cloudflare (заштита од злоупотребе).
            Подаци се не продају нити уступају трећим лицима у друге сврхе.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-zinc-900">Ваша права</h2>
          <p className="mt-1">
            Имате право на приступ својим подацима, исправку, брисање, приговор на
            обраду и повлачење датог пристанка (што не утиче на законитост обраде
            прије повлачења). Захтјев шаљете на{" "}
            <a
              href="mailto:dragan.dakic@zaporodicu.org"
              className="underline"
            >
              dragan.dakic@zaporodicu.org
            </a>
            . Такође имате право на притужбу надлежном органу за заштиту личних
            података.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-zinc-900">Колачићи</h2>
          <p className="mt-1">
            Јавна форма не користи колачиће за праћење. У административном дијелу
            (није јаван) користи се један неопходан колачић за пријаву, који траје
            7 дана.
          </p>
        </section>

        <section>
          <h2 className="font-medium text-zinc-900">Измјене обавјештења</h2>
          <p className="mt-1">
            Ово обавјештење може бити ажурирано. Важећа верзија је увијек на овој
            страници.
          </p>
        </section>
      </div>
    </main>
  );
}
