"use client";
import { useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Navigate } from "@/components/ui/Icons";
import { distance } from "@/lib/format";
import { useI18n } from "@/lib/i18n/client";
import { plural, type Key } from "@/lib/i18n";
import type { NavState, TurnKind } from "./navigation";
import type { NavTarget, NearAlert, NearbyHazard, Pos, Spot } from "./types";

const RideMap = dynamic(() => import("./RideMap"), { ssr: false });

// Smallest signed turn from where the phone points to where the spot is, so the arrow takes the short way round.
const turn = (to: number, from: number) => ((((to - from) % 360) + 540) % 360) - 180;

// how far the maneuver arrow is turned from straight ahead
const TURN: Record<TurnKind, number> = { straight: 0, bearLeft: -35, left: -90, sharpLeft: -135, bearRight: 35, right: 90, sharpRight: 135, uturn: 180, arrive: 0 };

type Props = {
  pos: Pos | null; compass: number | null; target: NavTarget | null; alert: NearAlert | null; nav: NavState;
  spots: Spot[]; hazards: NearbyHazard[]; finished: boolean; free: boolean;
  quiet: boolean; // a result card is on screen: the direction card and mini-map step aside
};

// The see-through navigation layer on top of the camera: an arrow to the next 311 spot (like Find My), how far it
// is, a small live map, and a second arrow when another pothole is close. Glass panels keep the road visible.
export default function NavOverlay({ pos, compass, target, alert, nav, spots, hazards, finished, free, quiet }: Props) {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [big, setBig] = useState(false);
  const facing = compass ?? pos?.heading ?? null;
  const rot = (to: number) => (facing == null ? to : turn(to, facing));
  const glass = "bg-ink/35 text-paper backdrop-blur-md border border-paper/25";

  return (
    <div className={`transition-opacity duration-300 ${quiet ? "pointer-events-none opacity-0" : "opacity-100"}`}>
      {/* arrow + distance, top centre under the status bar */}
      <div className="pointer-events-none absolute inset-x-0 flex flex-col items-center gap-2 px-4" style={{ top: "calc(env(safe-area-inset-top) + 76px)" }}>
        {target ? (
          <div className={`pointer-events-auto w-full max-w-md rounded-[28px] p-4 ${glass}`} role="status"
            aria-label={t("hud.arrowLabel", { place: target.place, distance: distance(target.meters) })}>
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-paper/40" aria-hidden>
                <span className="block" style={{ transform: `rotate(${rot(target.bearing)}deg)`, transition: reduce ? "none" : "transform 300ms linear" }}>
                  <Navigate className="h-9 w-9" />
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-paper/75">{target.atSpot ? t("hud.arrived") : t("hud.go")}</p>
                <p className="truncate text-lg font-medium leading-tight">{target.place}</p>
                <p className="text-3xl font-medium tabular-nums leading-tight tracking-tight">{distance(target.meters)}</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-paper/80">{t("hud.photosHere", { n: target.photosHere, total: target.needed })}{target.photos ? ` · ${plural(t, "hud.photoCount", target.photos)}` : ""}</p>
            {nav.step && !target.atSpot && (
              <p className="mt-3 flex items-center gap-3 rounded-2xl bg-paper/15 px-3 py-2 text-[15px]" aria-live="polite">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper text-ink" aria-hidden>
                  <span className="block" style={{ transform: `rotate(${TURN[nav.step.kind]}deg)` }}><Navigate className="h-5 w-5" /></span>
                </span>
                <span>{t(`nav.step.${nav.step.kind}` as Key, { road: nav.step.road || t("nav.street"), distance: distance(nav.step.meters) })}</span>
              </p>
            )}
            {nav.failed && !target.atSpot && <p className="mt-2 text-xs text-paper/70">{t("nav.noRoute")}</p>}
          </div>
        ) : (
          <p className={`pointer-events-auto max-w-md rounded-full px-5 py-3 text-center text-[15px] ${glass}`} role="status">
            {finished ? t("hud.allDone") : free ? t("hud.freeMode") : pos ? t("hud.noneNear") : t("hud.searching")}
          </p>
        )}
        {facing == null && target && <p className="rounded-full bg-ink/35 px-3 py-1 text-xs text-paper backdrop-blur">{t("hud.northUp")}</p>}

        {alert && (
          <div className={`pointer-events-none flex items-center gap-3 rounded-full py-2 pe-5 ps-2 ${glass}`} role="status" aria-live="polite">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-paper text-ink" aria-hidden>
              <span className="block" style={{ transform: `rotate(${rot(alert.bearing)}deg)`, transition: reduce ? "none" : "transform 300ms linear" }}><Navigate className="h-5 w-5" /></span>
            </span>
            <span className="text-sm">{t("hud.near")} · {distance(alert.meters)}</span>
          </div>
        )}
      </div>

      {/* live map, bottom left; tap to enlarge */}
      <div className={`absolute start-3 overflow-hidden rounded-[22px] border-2 border-paper/70 shadow-[0_8px_24px_rgb(0_0_0/0.4)] transition-[width,height] duration-300 ${big ? "h-[46dvh] w-[calc(100%-1.5rem)]" : "h-[132px] w-[132px]"}`}
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 84px)", opacity: 0.92 }}>
        <RideMap pos={pos} target={target} spots={spots} hazards={hazards} route={nav.coords} label={t("hud.map")} />
        <button type="button" onClick={() => setBig((b) => !b)} aria-label={big ? t("hud.mapSmall") : t("hud.mapBig")} className="absolute end-1 top-1 h-11 w-11 rounded-full bg-paper/80 text-ink">{big ? "–" : "+"}</button>
      </div>
    </div>
  );
}
