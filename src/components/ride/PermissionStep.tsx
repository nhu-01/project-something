"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Camera, Mic, Navigate, Pin } from "@/components/ui/Icons";
import { useI18n } from "@/lib/i18n/client";
import type { Key } from "@/lib/i18n";
import { requestCompass } from "./compass";

export type Need = "location" | "camera" | "mic" | "compass";
type Result = "granted" | "denied";
const DONE_KEY = "spotholes-permissions-asked";

const ASK: Record<Need, () => Promise<Result>> = {
  location: () => new Promise((res) => {
    if (!navigator.geolocation) return res("denied");
    navigator.geolocation.getCurrentPosition(() => res("granted"), () => res("denied"), { timeout: 15000, maximumAge: 60000 });
  }),
  // camera and microphone are requested together so there is one prompt, then released straight away
  camera: async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      s.getTracks().forEach((t) => t.stop());
      return "granted";
    } catch { return "denied"; }
  },
  mic: async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach((t) => t.stop());
      return "granted";
    } catch { return "denied"; }
  },
  compass: async () => ((await requestCompass()) ? "granted" : "denied"),
};

const ICON: Record<Need, ReactNode> = { location: <Pin />, camera: <Camera />, mic: <Mic />, compass: <Navigate /> };

// iOS shows the motion/compass prompt only from a tap and has no permission query for camera, so "asked once" is
// remembered; every other browser is checked for real.
async function allGranted(needs: Need[]) {
  try { if (localStorage.getItem(DONE_KEY)) return true; } catch { /* storage blocked */ }
  const names: Partial<Record<Need, string>> = { location: "geolocation", camera: "camera", mic: "microphone" };
  for (const n of needs) {
    if (n === "compass") { if (typeof DeviceOrientationEvent !== "undefined" && "requestPermission" in DeviceOrientationEvent) return false; continue; }
    try {
      const s = await navigator.permissions.query({ name: names[n] as PermissionName });
      if (s.state !== "granted") return false;
    } catch { return false; }
  }
  return true;
}

// One screen that asks for everything the next step uses (location, camera, microphone, compass), so nothing pops up
// mid-way. Skipping or refusing is fine: each feature has a fallback.
export function usePermissionStep() {
  const [pending, setPending] = useState<{ needs: Need[]; then: () => void } | null>(null);
  const ask = useCallback((needs: Need[], then: () => void) => {
    void allGranted(needs).then((ok) => (ok ? then() : setPending({ needs, then })));
  }, []);
  const dialog = pending ? <PermissionDialog needs={pending.needs} onDone={() => { const t = pending.then; setPending(null); t(); }} onCancel={() => setPending(null)} /> : null;
  return { ask, dialog };
}

function PermissionDialog({ needs, onDone, onCancel }: { needs: Need[]; onDone: () => void; onCancel: () => void }) {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [state, setState] = useState<Partial<Record<Need, Result>>>({});
  const [busy, setBusy] = useState(false);
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => { first.current?.focus(); }, []);

  const allow = async () => {
    setBusy(true);
    // the compass prompt must come from this tap, so it goes first
    for (const n of [...needs].sort((a) => (a === "compass" ? -1 : 0))) {
      const r = await ASK[n]();
      setState((s) => ({ ...s, [n]: r }));
    }
    try { localStorage.setItem(DONE_KEY, String(Date.now())); } catch { /* storage blocked */ }
    setBusy(false);
    setTimeout(onDone, 700);
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[3600] grid place-items-end bg-ink/45 p-3 sm:place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <motion.section role="dialog" aria-modal="true" aria-labelledby="perm-title" initial={{ opacity: 0, y: reduce ? 0 : 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md rounded-[28px] bg-paper p-5 text-ink shadow-[0_18px_60px_rgb(0_0_0/0.35)]">
          <h2 id="perm-title" className="text-xl font-medium tracking-tight">{t("perm.title")}</h2>
          <p className="mt-1 text-sm text-muted">{t("perm.body")}</p>
          <ul className="mt-4 space-y-2">
            {needs.map((n) => (
              <li key={n} className="card flex items-center gap-3 p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-paper" aria-hidden>{ICON[n]}</span>
                <span className="min-w-0 flex-1"><span className="block text-[15px] font-medium">{t(`perm.${n}` as Key)}</span><span className="block text-xs text-muted">{t(`perm.${n}Why` as Key)}</span></span>
                {state[n] && <span className="rounded-full border border-line px-2.5 py-1 text-xs">{state[n] === "granted" ? t("perm.granted") : t("perm.denied")}</span>}
              </li>
            ))}
          </ul>
          <button ref={first} type="button" onClick={() => void allow()} disabled={busy} className="pill pill-ink mt-5 w-full disabled:opacity-60">{busy ? t("perm.working") : t("perm.allow")}</button>
          <button type="button" onClick={onCancel} className="tap mt-2 block w-full text-center text-sm text-muted underline underline-offset-4">{t("perm.skip")}</button>
          <p className="mt-3 text-xs text-muted">{t("perm.note")}</p>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  );
}
