import Image from "next/image";
import logoFondacija from "@/assets/logo-fondacija.png";

export function Zaglavlje() {
  return (
    <header className="mb-10 flex justify-center border-b border-zinc-200 pb-8">
      <Image
        src={logoFondacija}
        alt="Фондација „За породицу“"
        className="h-24 w-auto"
        priority
      />
    </header>
  );
}
