"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { postaviSesiju, obrisiSesiju } from "@/lib/admin-sesija";
import { dozvoljenPokusaj } from "@/lib/ogranicenje";

// Поређење двије вриједности отпорно на мјерење времена (да напад не може
// да „погоди" лозинку по томе колико дуго провјера траје).
function istiTekst(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export type StanjePrijave = { greska: string } | undefined;

export async function prijaviSe(
  _prethodno: StanjePrijave,
  formData: FormData,
): Promise<StanjePrijave> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const lozinka = String(formData.get("lozinka") ?? "");
  const tacanEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const tacnaLozinka = process.env.ADMIN_LOZINKA;

  if (!tacanEmail || !tacnaLozinka) {
    return { greska: "Админ подаци нису подешени на серверу (.env.local)." };
  }

  // Заштита од погађања лозинке: највише 5 покушаја у 15 минута по IP.
  if (!(await dozvoljenPokusaj("admin-prijava", 5, 15))) {
    return {
      greska: "Превише покушаја пријаве. Покушајте поново за 15 минута.",
    };
  }
  // Обје провјере се увијек изврше (без раног изласка), да напад не може да
  // закључи да ли је мејл тачан по томе колико провјера траје.
  const emailOk = email !== "" && istiTekst(email, tacanEmail);
  const lozinkaOk = lozinka !== "" && istiTekst(lozinka, tacnaLozinka);
  if (!emailOk || !lozinkaOk) {
    return { greska: "Погрешан мејл или лозинка." };
  }

  await postaviSesiju();
  redirect("/admin");
}

export async function odjaviSe(): Promise<void> {
  await obrisiSesiju();
  redirect("/admin/prijava");
}
