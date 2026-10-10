"use client";
import { useI18n } from "@/lib/i18n/client";
import { LANGS } from "@/lib/voice";
import { openLanguagePicker } from "./LanguageGate";

export default function LanguageButton({ className }: { className?: string }) {
  const { t, lang } = useI18n();
  return (
    <button type="button" onClick={openLanguagePicker} aria-label={`${t("nav.language")}: ${LANGS[lang].name}`} className={className}>
      <span lang={LANGS[lang].bcp47}>{LANGS[lang].name}</span>
    </button>
  );
}
