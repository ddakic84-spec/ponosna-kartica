import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { KOLACIC } from "@/lib/admin-konstante";

// „Proxy" (раније се звало middleware) трчи прије сваке админ странице.
// Овдје радимо само БРЗУ провјеру: ако колачић уопште не постоји, одмах
// шаљемо посјетиоца на страницу за пријаву — да не учитава админ странице
// без потребе. ПРАВА провјера потписа колачића ради се у самим страницама
// (`zahtijevajAdmina()`), гдје имамо пуно серверско окружење.

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const jeAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const jeStranicaZaPrijavu = pathname === "/admin/prijava";

  if (jeAdmin && !jeStranicaZaPrijavu) {
    const imaKolacic = Boolean(request.cookies.get(KOLACIC)?.value);
    if (!imaKolacic) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/prijava";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
