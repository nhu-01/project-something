"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { saveLang, useI18n } from "@/lib/i18n/client";
import { LANG_CODES, LANGS, type Lang } from "@/lib/voice";

// Language comes first: on a first visit this covers the page until one is picked. It is also what the
// "language" button in the menu opens. Picking one reloads the page text in that language.
export default function LanguageGate({ firstVisit }: { firstVisit: boolean }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(firstVisit);
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("spotholes:language", onOpen);
    return () => window.removeEventListener("spotholes:language", onOpen);
  }, []);
  useEffect(() => { if (open) first.current?.focus(); }, [open]);
  useEffect(() => {
    if (!open || firstVisit) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, firstVisit]);

  if (!open) return null;
  const choose = (l: Lang) => { saveLang(l); setOpen(false); router.refresh(); };
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="lang-title" className="fixed inset-0 z-[5000] flex items-center justify-center overflow-y-auto bg-paper/95 p-5 backdrop-blur" onClick={() => { if (!firstVisit) setOpen(false); }}>
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 text-[17px] font-medium tracking-tight">
          <span className="grid h-6 w-6 place-items-center rounded-full border border-ink" aria-hidden><span className="logo-dot h-2.5 w-2.5 rounded-full" /></span>
          spotholes
        </div>
        <h2 id="lang-title" className="h2 mt-6">{t("lang.title")}</h2>
        <p className="mt-3 text-muted">{t("lang.body")}</p>
        <div className="mt-8 grid grid-cols-2 gap-2">
          {LANG_CODES.map((code, i) => (
            <button key={code} ref={i === 0 ? first : undefined} type="button" lang={LANGS[code].bcp47} dir="auto" onClick={() => choose(code)} aria-pressed={!firstVisit && lang === code}
              className="chip !min-h-12 justify-center text-[16px]">{LANGS[code].name}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Opens the picker from anywhere (the menu, the ride setup).
export const openLanguagePicker = () => window.dispatchEvent(new Event("spotholes:language"));
