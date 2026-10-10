import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, League_Gothic } from "next/font/google";
import Footer from "@/components/ui/Footer";
import LanguageGate from "@/components/ui/LanguageGate";
import Nav from "@/components/ui/Nav";
import { I18nProvider } from "@/lib/i18n/client";
import { dictFor, RTL } from "@/lib/i18n";
import { getLang } from "@/lib/i18n/server";
import { LANGS } from "@/lib/voice";
import "./globals.css";

// Latin, plus the scripts the site is translated into where this typeface has them; other scripts use system fonts.
// Tall, condensed sign-painter headline face (Latin only; other scripts fall back to the body font). General street-sign
// feel, not any one campaign's lettering.
const gothic = League_Gothic({ subsets: ["latin"], variable: "--font-gothic" });
const hanken = Hanken_Grotesk({ subsets: ["latin", "latin-ext", "cyrillic-ext", "vietnamese"], variable: "--font-hanken" });

export const metadata: Metadata = {
  title: "spotholes: find a pothole, snap it",
  description: "Find the nearest reported pothole in new york, film it as you ride or snap a photo, and help the city see what's broken.",
};
export const viewport: Viewport = { themeColor: "#fafaf7", viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, chosen } = await getLang();
  return (
    <html lang={LANGS[lang].bcp47} dir={RTL.has(lang) ? "rtl" : "ltr"} className={`${hanken.variable} ${gothic.variable}`}>
      <body>
        <I18nProvider dict={dictFor(lang)} lang={lang}>
          <Nav />
          <main>{children}</main>
          <Footer />
          <LanguageGate firstVisit={!chosen} />
        </I18nProvider>
      </body>
    </html>
  );
}
