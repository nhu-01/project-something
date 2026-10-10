import type { Sighting } from "@/lib/data/types";
import { fmtDate, fmtTime } from "@/lib/format";
import { KIND_LABEL, SEV_WORD } from "@/lib/tokens";

// Every pass over this pothole, newest first: what the rider saw and how it changed.
// `activeId` marks the pass whose photo is currently being shown beside the timeline.
export default function Timeline({ sightings, activeId }: { sightings: Sighting[]; activeId?: string }) {
  const list = [...sightings].reverse();
  return (
    <ol className="relative space-y-6 border-l border-line pl-6">
      {list.map((s) => {
        const good = s.kind === "repaired" || s.kind === "better";
        return (
          <li key={s.id} className={`relative rounded-2xl transition-colors duration-500 ${activeId === s.id ? "-mx-3 bg-sage/50 px-3 py-2" : ""}`} aria-current={activeId === s.id || undefined}>
            <span className="absolute -left-[31px] top-1.5 grid h-3 w-3 place-items-center rounded-full border border-ink bg-paper" aria-hidden>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: good ? "var(--repaired)" : "var(--ink)" }} />
            </span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium">{KIND_LABEL[s.kind]}</span>
              {s.severity && <span className="text-sm text-muted">severity {s.severity} · {SEV_WORD[s.severity]}</span>}
              <span className="text-sm text-muted">{fmtDate(s.at)}, {fmtTime(s.at)} · rider {s.rider}</span>
            </div>
            <p className="mt-0.5 text-[15px] text-muted">{s.note}</p>
          </li>
        );
      })}
    </ol>
  );
}
