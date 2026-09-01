import Image from "next/image";
import logoFondacija from "@/assets/logo-fondacija.png";
import logoTtd from "@/assets/logo-ttd.png";

export function Zaglavlje() {
  return (
    <header className="mb-10 flex items-center justify-center gap-8 border-b border-zinc-200 pb-8">
      <Image
        src={logoFondacija}
        alt="Фондација „За породицу“"
        className="h-24 w-auto"
        priority
      />
      <Image
        src={logoTtd}
        alt="Transforming to Digital Ltd"
        className="h-10 w-auto"
      />
    </header>
  );
}
