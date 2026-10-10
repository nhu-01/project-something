import type { Severity } from "@/lib/data/types";

// Colors only. All words come from the translation catalog (src/lib/i18n), e.g. t(`sev.${n}`), t(`hazard.${kind}`).
export const SEV_VAR: Record<Severity, string> = {
  1: "var(--sev-1)", 2: "var(--sev-2)", 3: "var(--sev-3)", 4: "var(--sev-4)", 5: "var(--sev-5)",
};

// Severity is shown as a letter grade, like a NYC restaurant sign: A is the mildest, E the worst.
export const GRADE: Record<Severity, string> = { 1: "A", 2: "B", 3: "C", 4: "D", 5: "E" };
export const gradeOf = (n: number) => GRADE[(Math.min(5, Math.max(1, Math.round(n))) as Severity)];

// Yellow and lime are too light for white text.
export const SEV_DARK_TEXT: Record<Severity, boolean> = { 1: true, 2: true, 3: false, 4: false, 5: false };
