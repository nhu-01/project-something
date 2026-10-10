"use client";
import type { Severity as Sev, Status } from "@/lib/data/types";
import { useI18n } from "@/lib/i18n/client";
import type { Key } from "@/lib/i18n";
import { GRADE } from "@/lib/tokens";
import { SeverityBullet } from "./Bullet";

export function SeverityMeter({ value }: { value: Sev | null }) {
  const { t } = useI18n();
  if (!value) return <span className="text-sm text-muted">{t("common.noLonger")}</span>;
  return (
    <span className="inline-flex items-center gap-3">
      <SeverityBullet value={value} />
      <span className="text-sm font-medium" aria-hidden>{t("common.sevOf", { word: t(`sev.${value}` as Key), n: GRADE[value] })}</span>
    </span>
  );
}

export function StatusChip({ status }: { status: Status }) {
  const { t } = useI18n();
  const repaired = status === "repaired";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-[13px]" style={{ borderColor: repaired ? "var(--repaired)" : "var(--line)" }}>
      <span className="h-2 w-2 rounded-full" style={{ background: repaired ? "var(--repaired)" : "var(--ink)" }} aria-hidden />
      {repaired ? t("common.repaired") : t("common.open")}
    </span>
  );
}
