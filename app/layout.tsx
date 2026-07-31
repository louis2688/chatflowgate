import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import CookieNotice from "@/components/CookieNotice";
import Analytics from "@/components/Analytics";

// Inter is the template's specified substitute for BMW Type Next Latin.
const inter = Inter({ variable: "--font-body", subsets: ["latin"], weight: ["300", "400", "500", "700"] });
const mono = JetBrains_Mono({ variable: "--font-jbmono", subsets: ["latin"] });

export const metadata: Metadata = {
  // Without this, every relative canonical and OG url resolves against whatever
  // host rendered the page -- localhost in dev, the *.vercel.app preview URL in
  // preview builds -- and share cards end up pointing at the wrong site. www,
  // not the apex, because the apex 308s here and canonicals must not redirect.
  metadataBase: new URL("https://www.chatflowgate.com"),
  title: "ChatFlowGate for n8n",
  description:
    "The secure, branded chat frontend for n8n workflows. Hidden webhooks, rate limiting, signed sessions.",
  openGraph: {
    siteName: "ChatFlowGate",
    type: "website",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <CookieNotice />
        <Analytics />
      </body>
    </html>
  );
}
