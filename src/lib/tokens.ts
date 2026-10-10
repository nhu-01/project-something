import type { Severity } from "@/lib/data/types";

// Colors only. All words come from the translation catalog (src/lib/i18n), e.g. t(`sev.${n}`), t(`hazard.${kind}`).
export const SEV_VAR: Record<Severity, string> = {
  1: "var(--sev-1)", 2: "var(--sev-2)", 3: "var(--sev-3)", 4: "var(--sev-4)", 5: "var(--sev-5)",
};

// Yellow and lime are too light for white text.
export const SEV_DARK_TEXT: Record<Severity, boolean> = { 1: true, 2: true, 3: false, 4: false, 5: false };
