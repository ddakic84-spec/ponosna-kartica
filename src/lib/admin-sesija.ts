import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  KOLACIC,
  TRAJANJE_SEKUNDI,
  napraviToken,
  tokenJeValjan,
} from "@/lib/admin-token";

// Постављање и провјера админ сесије кроз колачић.

export async function postaviSesiju(): Promise<void> {
  const kolacici = await cookies();
  kolacici.set(KOLACIC, napraviToken(), {
    httpOnly: true, // недоступан JavaScript-у у прегледачу
    secure: process.env.NODE_ENV === "production", // само преко https у продукцији
    sameSite: "lax",
    path: "/",
    maxAge: TRAJANJE_SEKUNDI,
  });
}

export async function obrisiSesiju(): Promise<void> {
  const kolacici = await cookies();
  kolacici.delete(KOLACIC);
}

export async function daLiJePrijavljen(): Promise<boolean> {
  const kolacici = await cookies();
  return tokenJeValjan(kolacici.get(KOLACIC)?.value);
}

// Позива се на врху сваке админ странице / акције. Ако корисник није
// пријављен, одмах га шаље на страницу за пријаву.
export async function zahtijevajAdmina(): Promise<void> {
  if (!(await daLiJePrijavljen())) {
    redirect("/admin/prijava");
  }
}
