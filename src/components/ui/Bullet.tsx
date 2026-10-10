"use client";
import type { Severity } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/client";
import type { Key } from "@/lib/i18n";
import { SEV_DARK_TEXT, SEV_VAR } from "@/lib/tokens";

// Subway-style bullet. Decorative by default; give it a label when it carries meaning on its own.
export function Bullet({ children, color, dark, large, label }: { children: React.ReactNode; color: string; dark?: boolean; large?: boolean; label?: string }) {
  return (
    <span className={`bullet${large ? " bullet-lg" : ""}${dark ? " bullet-dark" : ""}`} style={{ background: color }} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {children}
    </span>
  );
}

export function SeverityBullet({ value, large }: { value: Severity; large?: boolean }) {
  const { t } = useI18n();
  return <Bullet color={SEV_VAR[value]} dark={SEV_DARK_TEXT[value]} large={large} label={t("common.severityN", { n: value, word: t(`sev.${value}` as Key) })}>{value}</Bullet>;
}
