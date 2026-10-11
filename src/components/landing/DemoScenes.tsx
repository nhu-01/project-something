"use client";
import { useEffect, useState } from "react";
import { Navigate } from "@/components/ui/Icons";
import { useI18n } from "@/lib/i18n/client";

// Phone-sized illustrations for the walkthrough. They are drawings of the real screens, built from the same tokens,
// so they stay in step with the app. Photos, when we have any, are real frames riders took.
type Scene = { photos: string[] };

const SPOT_ID = "70471984";

// counts from `from` down to `to` over `ms`, for the arrow card's distance
function useCountdown(from: number, to: number, ms: number) {
  const [v, setV] = useState(from);
  useEffect(() => {
    const t0 = performance.now();
    const id = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms);
      setV(Math.round(from + (to - from) * k));
      if (k >= 1) clearInterval(id);
    }, 120);
    return () => clearInterval(id);
  }, [from, to, ms]);
  return v;
}

const glass = "border border-paper/25 bg-ink/40 text-paper backdrop-blur-md";
const delay = (s: number) => ({ animationDelay: `${s}s` });

function Road() {
  // a dark road with a dashed center line, standing in for the camera feed
  return <div className="absolute inset-0 bg-[linear-gradient(180deg,#2b2c28,#1a1b19)]" aria-hidden><div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-[repeating-linear-gradient(180deg,rgba(250,250,247,.5)_0_26px,transparent_26px_52px)]" /></div>;
}

export function ChooseScene() {
  const { t } = useI18n();
  return (
    <div className="absolute inset-0 bg-paper">
      <div className="p-5 pt-12"><p className="font-[family-name:var(--font-display)] text-[34px] leading-[0.95]">{t("home.title1")}<br />{t("home.title2")}</p></div>
      <div className="absolute inset-0 bg-ink/35" aria-hidden />
      <div className="demo-anim demo-rise absolute inset-x-3 bottom-3 rounded-[24px] bg-paper p-4 text-ink shadow-[0_12px_40px_rgb(0_0_0/0.35)]">
        <p className="text-[15px] font-medium">{t("spotpick.title")}</p>
        <div className="mt-3 space-y-2">
          <div className="card flex items-center gap-3 p-3"><span className="h-8 w-8 rounded-full bg-ink" aria-hidden /><span className="text-[13px] font-medium">{t("spotpick.video")}</span></div>
          <div className="demo-anim demo-pick card relative flex items-center gap-3 p-3" style={delay(1.4)}>
            <span className="h-8 w-8 rounded-full bg-ink" aria-hidden /><span className="text-[13px] font-medium">{t("spotpick.route")}</span>
            <span className="demo-anim demo-tap absolute end-5 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-2 border-ink" style={delay(1.3)} aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FollowScene() {
  const { t } = useI18n();
  const ft = useCountdown(490, 10, 4200);
  return (
    <div className="absolute inset-0">
      <Road />
      <div className={`absolute inset-x-3 top-9 rounded-[22px] p-3 ${glass}`}>
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-paper/40" aria-hidden>
            <span className="demo-anim demo-turn block"><Navigate className="h-8 w-8" /></span>
          </span>
          <div className="min-w-0">
            <p className="text-[10px] text-paper/75">{ft <= 60 ? t("hud.arrived") : t("hud.go")}</p>
            <p className="truncate text-[13px] font-medium">{t("demo.place")}</p>
            <p className="text-2xl font-medium tabular-nums leading-tight">{ft} ft</p>
          </div>
        </div>
      </div>
      <div className="demo-anim demo-rise absolute inset-x-3 top-[132px] flex w-fit items-center gap-2 rounded-full bg-ink/40 py-1.5 pe-3 ps-1.5 text-[11px] text-paper backdrop-blur-md" style={delay(1.2)}>
        <span className="grid h-6 w-6 place-items-center rounded-full bg-paper text-ink" aria-hidden><Navigate className="h-3 w-3" /></span>{t("hud.near")}
      </div>
      <div className="absolute bottom-4 start-3 h-[104px] w-[104px] overflow-hidden rounded-[18px] border-2 border-paper/70 bg-paper">
        <svg viewBox="0 0 104 104" className="h-full w-full" aria-hidden>
          <path d="M0 30H104M0 66H104M28 0V104M70 0V104" stroke="var(--line)" strokeWidth="6" />
          <path d="M14 96C30 80 28 62 48 52S70 30 84 14" stroke="var(--line-blue)" strokeWidth="3" strokeDasharray="2 6" strokeLinecap="round" fill="none" />
          <rect x="76" y="6" width="16" height="16" rx="5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
          <rect x="52" y="64" width="10" height="10" rx="3" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
          <circle cx="16" cy="92" r="7" fill="var(--line-blue)" opacity=".3" /><circle cx="16" cy="92" r="4" fill="var(--line-blue)" stroke="#fff" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}

export function SnapScene({ photos }: Scene) {
  const { t } = useI18n();
  return (
    <div className="absolute inset-0">
      {photos[0] ? <img src={photos[0]} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <Road />}
      <div className="absolute inset-0 bg-ink/25" aria-hidden />
      <div className="absolute inset-[9%] rounded-[22px] border border-paper/40" aria-hidden />
      <div className="demo-anim demo-flash absolute inset-0 bg-paper" style={delay(1)} aria-hidden />
      {photos[0] && <img src={photos[0]} alt="" className="demo-anim demo-fly absolute end-3 top-24 w-[56px] rounded-[12px] border-2 border-paper object-cover shadow-[0_6px_18px_rgb(0_0_0/0.4)]" style={{ ...delay(1.2), aspectRatio: "9/16" }} />}
      <p className={`demo-anim demo-rise absolute inset-x-3 top-9 rounded-full px-4 py-2 text-center text-[12px] ${glass}`} style={delay(1.6)}>{t("hud.result.photo")}</p>
      <div className="demo-anim demo-rise absolute inset-x-3 bottom-5 flex items-center gap-3 rounded-[20px] bg-paper p-3 text-ink" style={delay(2.2)}>
        <span className="demo-anim demo-pop grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl font-bold text-paper" style={{ ...delay(2.5), background: "var(--sev-3)" }} aria-hidden>C</span>
        <div><p className="text-[13px] font-medium">{t("common.severityN", { n: "C", word: t("sev.3") })}</p><p className="text-[11px] text-muted">{t("hazard.pothole")} · {t("demo.place")}</p></div>
      </div>
      <div className="absolute inset-x-0 bottom-[84px] flex justify-center gap-1.5" aria-hidden>
        {["A", "B", "C", "D", "E"].map((g, i) => (
          <span key={g} className={`demo-anim demo-pop grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${g === "C" ? "text-paper" : "text-ink opacity-70"}`} style={{ ...delay(2.3 + i * 0.05), background: `var(--sev-${i + 1})` }}>{g}</span>
        ))}
      </div>
    </div>
  );
}

export function GrowScene({ photos }: Scene) {
  const { t } = useI18n();
  const n = useCountdown(2, 6, 3600);
  return (
    <div className="absolute inset-0 overflow-hidden bg-paper p-4 pt-10 text-ink">
      <p className="text-[10px] text-muted">{t("spot.eyebrow", { id: SPOT_ID })}</p>
      <p className="font-[family-name:var(--font-display)] text-[26px] leading-none">{t("demo.place")}</p>
      <p className="mt-1 text-[11px] text-muted">{n} {t("recap.photos")}</p>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="demo-anim demo-pop aspect-[4/5] overflow-hidden rounded-xl border border-line bg-card" style={delay(0.2 + i * 0.5)}>
            {photos[i % Math.max(1, photos.length)] ? <img src={photos[i % photos.length]} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center"><img src="/pothole-sign.png" alt="" className="h-7 w-7" /></span>}
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] font-medium">{t("street.title")}</p>
      <div className="mt-1.5 flex gap-1.5">
        {[0, 1, 2].map((i) => <div key={i} className="demo-anim demo-pop h-14 w-20 shrink-0 rounded-xl border border-line bg-[repeating-linear-gradient(135deg,var(--line)_0_6px,var(--card)_6px_12px)]" style={delay(3.2 + i * 0.2)} aria-hidden />)}
      </div>
      <p className="mt-1 text-[10px] text-muted">{t("street.credit")}</p>
    </div>
  );
}

export function MapScene() {
  const { t } = useI18n();
  const squares: [number, number][] = [[22, 24], [64, 18], [48, 50], [18, 66], [74, 70]];
  const circles: [number, number, string, string][] = [[36, 38, "B", "var(--sev-2)"], [60, 62, "D", "var(--sev-4)"], [30, 78, "A", "var(--sev-1)"]];
  return (
    <div className="absolute inset-0 bg-paper">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <path d="M0 22H100M0 48H100M0 74H100M20 0V100M52 0V100M82 0V100" stroke="var(--line)" strokeWidth="2.2" />
        <path d="M0 62C30 54 60 70 100 40" stroke="var(--line-blue)" strokeWidth=".9" strokeDasharray="1.5 2.5" fill="none" />
        <path d="M0 10C30 18 60 6 100 14" stroke="var(--line-green)" strokeWidth=".9" strokeDasharray="1.5 2.5" fill="none" />
      </svg>
      {squares.map(([x, y], i) => (
        <span key={i} className="demo-anim demo-pop absolute grid h-9 w-9 place-items-center rounded-[10px] border-2 border-dashed border-ink bg-paper" style={{ left: `${x}%`, top: `${y}%`, ...delay(0.2 + i * 0.25) }} aria-hidden><img src="/pothole-sign.png" alt="" className="h-6 w-6" /></span>
      ))}
      {circles.map(([x, y, g, c], i) => (
        <span key={g} className="demo-anim demo-pop absolute grid h-9 w-9 place-items-center rounded-full border-2 bg-paper" style={{ left: `${x}%`, top: `${y}%`, borderColor: c, ...delay(1.4 + i * 0.25) }} aria-hidden>
          <img src="/pothole-sign.png" alt="" className="h-6 w-6" /><span className="absolute -bottom-1 -end-1 grid h-4 w-4 place-items-center rounded-full border border-paper text-[9px] font-extrabold text-ink" style={{ background: c }}>{g}</span>
        </span>
      ))}
      <span className="absolute grid h-6 w-6 place-items-center" style={{ left: "46%", top: "86%" }} aria-hidden>
        <span className="me-pulse" /><span className="me-core" />
      </span>
      <div className="absolute inset-x-3 top-9 flex flex-wrap gap-1.5 text-[10px]">
        <span className="chip !min-h-7 !px-2.5"><span className="key-glyph key-city" aria-hidden />{t("map.layerCityPhoto", { n: 5 })}</span>
        <span className="chip !min-h-7 !px-2.5"><span className="key-glyph key-rider" aria-hidden />{t("map.layerRider", { n: 3 })}</span>
      </div>
    </div>
  );
}

// The phone the scenes are drawn in (shared by the homepage walkthrough and the end of the demo ride).
export function PhoneFrame({ label, children }: { label: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="relative aspect-[9/18.5] w-[270px] overflow-hidden rounded-[40px] border-[7px] border-ink bg-ink shadow-[0_24px_60px_rgb(32_33_30/0.25)]" role="img" aria-label={label}>
      {children}
      <span className="absolute left-1/2 top-2 h-4 w-16 -translate-x-1/2 rounded-full bg-ink" aria-hidden />
      <span className="absolute end-3 top-2.5 rounded-full bg-taxi px-2 py-0.5 text-[9px] font-semibold text-ink" aria-hidden>{t("demo.tag")}</span>
    </div>
  );
}
