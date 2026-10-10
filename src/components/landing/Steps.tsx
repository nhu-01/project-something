import { Bullet } from "@/components/ui/Bullet";
import Reveal from "@/components/ui/Reveal";
import type { Key, T } from "@/lib/i18n";

const STEPS = [{ n: "1", glyph: "phone" }, { n: "2", glyph: "wave" }, { n: "3", glyph: "link" }] as const;

function Glyph({ kind }: { kind: (typeof STEPS)[number]["glyph"] }) {
  const p = { width: 44, height: 44, viewBox: "0 0 44 44", fill: "none", stroke: "var(--ink)", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
  if (kind === "phone") return (<svg {...p}><rect x="13" y="5" width="18" height="34" rx="5" /><path d="M19 10h6" /><circle cx="22" cy="30" r="2.2" fill="var(--line-red)" stroke="none" /></svg>);
  if (kind === "wave") return (<svg {...p}><path d="M6 22h6l3-9 5 18 4-14 3 5h11" /></svg>);
  return (<svg {...p}><circle cx="12" cy="22" r="5" /><circle cx="32" cy="22" r="5" fill="var(--line-red)" stroke="none" /><path d="M17 22h10" strokeDasharray="2 3" /></svg>);
}

export default function Steps({ t }: { t: T }) {
  return (
    <section className="wrap mt-28" aria-labelledby="how">
      <Reveal><h2 id="how" className="h2">{t("steps.title")}</h2></Reveal>
      <ol className="mt-10 grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.n}>
            <Reveal delay={i * 0.08} className="card h-full p-7">
              <div className="flex items-center justify-between"><Glyph kind={s.glyph} /><Bullet color="var(--line-red)">{s.n}</Bullet></div>
              <h3 className="mt-8 text-xl font-medium tracking-tight">{t(`steps.${s.n}.title` as Key)}</h3>
              <p className="mt-2 text-muted">{t(`steps.${s.n}.body` as Key)}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
