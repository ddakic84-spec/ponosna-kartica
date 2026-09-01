"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function Turnstile({
  siteKey,
  onToken,
}: {
  siteKey: string;
  onToken: (token: string) => void;
}) {
  const kontejner = useRef<HTMLDivElement>(null);
  const idWidgeta = useRef<string | null>(null);

  useEffect(() => {
    let i = 0;
    function nacrtaj() {
      if (idWidgeta.current) {
        window.clearInterval(i);
        return;
      }
      if (!kontejner.current || !window.turnstile) return;
      idWidgeta.current = window.turnstile.render(kontejner.current, {
        sitekey: siteKey,
        callback: (t: string) => onToken(t),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
      window.clearInterval(i);
    }
    i = window.setInterval(nacrtaj, 200);
    nacrtaj();
    return () => window.clearInterval(i);
  }, [siteKey, onToken]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div ref={kontejner} />
    </>
  );
}
