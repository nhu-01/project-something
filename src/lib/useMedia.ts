"use client";
import { useSyncExternalStore } from "react";

// True while the viewport matches the query. Server and first paint assume the desktop answer (false).
export function useMedia(query: string) {
  return useSyncExternalStore(
    (notify) => { const m = window.matchMedia(query); m.addEventListener("change", notify); return () => m.removeEventListener("change", notify); },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
