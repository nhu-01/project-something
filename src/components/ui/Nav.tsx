import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { SpotButton } from "@/components/ride/SpotActions";
import LanguageButton from "./LanguageButton";

export default async function Nav() {
  const { t } = await getT();
  return (
    <header className="sticky top-0 z-[1500] border-b border-transparent bg-paper/80 backdrop-blur-md">
      <nav className="wrap flex h-16 items-center justify-between gap-2" aria-label="Main">
        <Link href="/" className="tap flex items-center gap-2 text-[17px] font-medium tracking-tight">
          <span className="grid h-6 w-6 place-items-center rounded-full border border-ink" aria-hidden>
            <span className="logo-dot h-2.5 w-2.5 rounded-full" />
          </span>
          spotholes
        </Link>
        <div className="flex items-center gap-1 text-[15px]">
          <Link href="/map" className="rounded-full px-3 py-2 text-muted transition-colors hover:text-ink">{t("nav.map")}</Link>
          <LanguageButton className="rounded-full px-2 py-2 text-sm text-muted transition-colors hover:text-ink sm:px-3 sm:text-[15px]" />
          <SpotButton className="pill pill-ink ms-2 !min-h-10 !px-4 whitespace-nowrap text-sm">{t("nav.start")}</SpotButton>
        </div>
      </nav>
    </header>
  );
}
