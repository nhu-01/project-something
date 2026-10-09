import type { Severity, SightingKind } from "@/lib/data/types";

export const SEV_VAR: Record<Severity, string> = {
  1: "var(--sev-1)", 2: "var(--sev-2)", 3: "var(--sev-3)", 4: "var(--sev-4)", 5: "var(--sev-5)",
};

export const SEV_WORD: Record<Severity, string> = { 1: "minor", 2: "light", 3: "moderate", 4: "serious", 5: "severe" };

export const KIND_LABEL: Record<SightingKind, string> = {
  first_seen: "first seen", confirmed: "confirmed", worse: "got worse", better: "looks better", not_found: "not found", repaired: "repaired",
};
