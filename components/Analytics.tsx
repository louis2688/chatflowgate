"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CONSENT_KEY, CONSENT_EVENT } from "./CookieNotice";

const GA_ID = "G-R8KR9N6Z05";

/**
 * Google Analytics, loaded ONLY when both are true:
 *
 *  1. The visitor accepted cookies. gtag sets _ga cookies, which are not
 *     strictly necessary, so under GDPR/ePrivacy it must not run before opt-in.
 *     Rendering nothing means the script is never fetched at all -- not merely
 *     configured to hold off.
 *  2. We are not inside /widget. That route is embedded in an iframe on our
 *     customers' own sites; loading our tracker there would profile their
 *     visitors without their knowledge, which is the opposite of what this
 *     product sells.
 */
export default function Analytics() {
  const pathname = usePathname();
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    const read = () => {
      try {
        setConsented(localStorage.getItem(CONSENT_KEY) === "accepted");
      } catch {
        setConsented(false);
      }
    };
    read();
    // React to the banner without a page reload.
    window.addEventListener(CONSENT_EVENT, read);
    return () => window.removeEventListener(CONSENT_EVENT, read);
  }, []);

  if (!consented || pathname?.startsWith("/widget")) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}