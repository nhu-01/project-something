import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import LanguageButton from "./LanguageButton";

export default async function Footer() {
  const { t } = await getT();
  return (
    <footer className="mt-24 border-t border-line">
      {/* a quiet nod to the subway map */}
      <div className="wrap flex gap-1.5 pt-8" aria-hidden>
        {["red", "green", "purple", "blue", "orange", "lime", "brown", "gray", "yellow", "slate", "teal"].map((c) => <span key={c} className="h-2 w-2 rounded-full" style={{ background: `var(--line-${c})` }} />)}
      </div>
      <div className="wrap flex flex-col gap-3 pb-8 pt-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>{t("footer.independent")}</span>
        <span>
          <Link href="/report" className="underline underline-offset-4">{t("footer.reportLink")}</Link> · {t("footer.notes")} · <LanguageButton className="underline underline-offset-4" />
        </span>
      </div>
    </footer>
  );
}
