export type RideEventKind = "new" | "confirmed" | "worse" | "repaired";

export type Upcoming = { id: string; street: string; lane: string; severity: 1 | 2 | 3 | 4 | 5; known: boolean; startFt: number };
export type RideEvent = { id: string; kind: RideEventKind; street: string; lane: string; severity: 1 | 2 | 3 | 4 | 5 | null; at: number };
export type Phase = "intro" | "starting" | "riding" | "recap";
