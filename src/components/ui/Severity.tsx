import type { Severity as Sev, Status } from "@/lib/data/types";
import { SEV_VAR, SEV_WORD } from "@/lib/tokens";

export function SeverityMeter({ value }: { value: Sev | null }) {
  if (!value) return <span className="text-sm text-muted">no longer an issue</span>;
  return (
    <span className="inline-flex items-center gap-3">
      <span className="flex gap-1" aria-hidden>
        {([1, 2, 3, 4, 5] as Sev[]).map((i) => (
          <span key={i} className="h-2 w-6 rounded-full" style={{ background: i <= value ? SEV_VAR[value] : "var(--line)" }} />
        ))}
      </span>
      <span className="text-sm font-medium">{value} of 5 · {SEV_WORD[value]}</span>
    </span>
  );
}

export function StatusChip({ status }: { status: Status }) {
  const repaired = status === "repaired";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[13px]" style={{ borderColor: repaired ? "var(--moss)" : "var(--line)", background: repaired ? "var(--sage)" : "var(--card)" }}>
      <span className="h-2 w-2 rounded-full" style={{ background: repaired ? "var(--moss)" : "var(--ink)" }} aria-hidden />
      {repaired ? "appears repaired" : "open"}
    </span>
  );
}
