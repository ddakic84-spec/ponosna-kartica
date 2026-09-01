"use client";

import { useActionState } from "react";
import { prijaviSe } from "@/lib/admin-akcije";

export default function AdminPrijava() {
  const [stanje, akcija, ceka] = useActionState(prijaviSe, undefined);

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="text-xl font-semibold tracking-tight">Админ пријава</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Овај дио није за грађане. Потребна је админ лозinка.
      </p>

      <form action={akcija} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Мејл
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label htmlFor="lozinka" className="block text-sm font-medium">
            Лозинка
          </label>
          <input
            id="lozinka"
            name="lozinka"
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-500"
          />
        </div>

        {stanje?.greska && (
          <p
            role="alert"
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {stanje.greska}
          </p>
        )}

        <button
          type="submit"
          disabled={ceka}
          className="w-full rounded-md bg-zinc-900 px-4 py-2.5 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {ceka ? "Провјера…" : "Пријави се"}
        </button>
      </form>
    </main>
  );
}
