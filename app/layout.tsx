import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Inter is the template's specified substitute for BMW Type Next Latin.
const inter = Inter({ variable: "--font-body", subsets: ["latin"], weight: ["300", "400", "500", "700"] });
const mono = JetBrains_Mono({ variable: "--font-jbmono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chatnode for n8n",
  description:
    "The secure, branded chat frontend for n8n workflows. Hidden webhooks, rate limiting, signed sessions.",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
