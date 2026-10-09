export type SightingKind = "first_seen" | "confirmed" | "worse" | "better" | "not_found" | "repaired";
export type Status = "open" | "repaired";
export type Severity = 1 | 2 | 3 | 4 | 5;

// One rider's pass over a pothole. Riders are anonymous short ids.
export type Sighting = {
  id: string;
  at: string; // ISO
  rider: string;
  kind: SightingKind;
  severity: Severity | null;
  note: string;
};

export type Pothole = {
  id: string;
  lat: number;
  lng: number;
  street: string;
  borough: string;
  direction: string;
  lane: string;
  size: "small" | "medium" | "large";
  severity: Severity | null; // null once repaired
  status: Status;
  firstSeen: string;
  lastSeen: string;
  sightings: Sighting[]; // oldest first
  seed: number; // drives the placeholder frame art until real photos exist
  photo?: string; // real frame URL once the backend is wired
};

export type Stats = {
  tracked: number;
  open: number;
  repaired: number;
  ridesThisWeek: number;
  newThisWeek: number;
  repairedThisWeek: number;
  daily: { day: string; found: number; repaired: number }[];
  worstStreets: { street: string; borough: string; open: number; avgSeverity: number }[];
};
