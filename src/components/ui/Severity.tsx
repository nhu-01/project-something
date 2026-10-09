import type { Severity as Sev, Status } from "@/lib/data/types";
import { SEV_WORD } from "@/lib/tokens";
import { SeverityBullet } from "./Bullet";

export function SeverityMeter({ value }: { value: Sev | null }) {
  if (!value) return <span className="text-sm text-muted">no longer an issue</span>;
  return (
    <span className="inline-flex items-center gap-3">
      <SeverityBullet value={value} />
      <span className="text-sm font-medium" aria-hidden>{SEV_WORD[value]} · {value} of 5</span>
    </span>
  );
}

export function StatusChip({ status }: { status: Status }) {
  const repaired = status === "repaired";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-[13px]" style={{ borderColor: repaired ? "var(--repaired)" : "var(--line)" }}>
      <span className="h-2 w-2 rounded-full" style={{ background: repaired ? "var(--repaired)" : "var(--ink)" }} aria-hidden />
      {repaired ? "appears repaired" : "open"}
    </span>
  );
}
