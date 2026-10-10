"use client";
import type { Sighting } from "@/lib/data/types";
import { gradeOf } from "@/lib/tokens";
import { useI18n } from "@/lib/i18n/client";
import type { Key } from "@/lib/i18n";
import { fmtDate, fmtTime } from "@/lib/format";

// Every pass over this pothole, newest first: what the rider saw and how it changed.
// `activeId` marks the pass whose photo is currently being shown beside the timeline.
// (The one-line notes come from the AI at the time of the pass and stay in the language they were written in.)
export default function Timeline({ sightings, activeId }: { sightings: Sighting[]; activeId?: string }) {
  const { t, lang } = useI18n();
  const list = [...sightings].reverse();
  return (
    <ol className="relative space-y-6 border-s border-line ps-6">
      {list.map((s) => {
        const good = s.kind === "repaired" || s.kind === "better";
        return (
          <li key={s.id} className={`relative rounded-2xl transition-colors duration-500 ${activeId === s.id ? "-mx-3 bg-sage/50 px-3 py-2" : ""}`} aria-current={activeId === s.id || undefined}>
            <span className="absolute -start-[31px] top-1.5 grid h-3 w-3 place-items-center rounded-full border border-ink bg-paper" aria-hidden>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: good ? "var(--repaired)" : "var(--ink)" }} />
            </span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium">{t(`kind.${s.kind}` as Key)}</span>
              {s.severity && <span className="text-sm text-muted">{t("common.severityN", { n: gradeOf(s.severity), word: t(`sev.${s.severity}` as Key) })}</span>}
              <span className="text-sm text-muted">{fmtDate(s.at, lang)}, {fmtTime(s.at, lang)} · {t("common.rider", { id: s.rider })}</span>
            </div>
            <p className="mt-0.5 text-[15px] text-muted" dir="auto">{s.note}</p>
          </li>
        );
      })}
    </ol>
  );
}
