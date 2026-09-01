import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Поносна картица 2026–2028 — захтјев за Нестро е-картицу",
  description:
    "Јавна форма за подношење захтјева за Нестро е-картицу у оквиру програма Поносна картица 2026–2028.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sr" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        {children}
      </body>
    </html>
  );
}
