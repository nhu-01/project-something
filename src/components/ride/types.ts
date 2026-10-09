export type RideEventKind = "new" | "confirmed" | "worse" | "better" | "repaired";
export type Sev = 1 | 2 | 3 | 4 | 5;

export type Hazard = "pothole" | "bump" | "rough";

export type Upcoming = { id: string; hazard: Hazard; street: string; lane: string; severity: Sev; startFt: number };
// `shot` is the camera frame that was checked (an object URL), with the camera's width/height in `shotAspect`.
export type RideEvent = { id: string; kind: RideEventKind; hazard: Hazard; street: string; lane: string; severity: Sev | null; at: number; shot?: string; shotAspect?: number };
export type Phase = "intro" | "starting" | "riding" | "recap";
export type GpsState = "waiting" | "ok" | "denied";
