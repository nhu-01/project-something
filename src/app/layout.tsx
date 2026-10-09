import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk } from "next/font/google";
import Footer from "@/components/ui/Footer";
import Nav from "@/components/ui/Nav";
import "./globals.css";

const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" });

export const metadata: Metadata = {
  title: "spotholes: ride, and the city remembers",
  description: "A pothole copilot for new york. Ride with it, get warned about what's ahead, and help the next rider.",
};
export const viewport: Viewport = { themeColor: "#fafaf7", viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={hanken.variable}>
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
