export type RideEventKind = "new" | "confirmed" | "worse" | "better" | "repaired" | "photo" | "not_found";
export type Sev = 1 | 2 | 3 | 4 | 5;
export type Hazard = "pothole" | "bump" | "rough";

// `shot` is the camera frame that was checked (an object URL), with the camera's width/height in `shotAspect`.
// source "311": a photo added to a city report (potholeId is its 311 number); "rider": a hazard riders logged.
export type RideEvent = {
  id: string; kind: RideEventKind; source: "311" | "rider"; hazard: Hazard; spotId: string; street: string; lane: string;
  severity: Sev | null; at: number; shot?: string; shotAspect?: number;
};
export type Phase = "intro" | "riding" | "recap";
export type GpsState = "waiting" | "ok" | "denied";

export type Spot = { id: string; lat: number; lng: number; place: string; borough?: string; photos?: number };
export type NearbyHazard = { id: string; lat: number; lng: number; place: string; severity: number; kind: string };
export type Pos = { lat: number; lng: number; heading: number | null; accuracy: number | null; speed: number };

// What the rider is being sent to, and how far away it is.
export type NavTarget = Spot & { meters: number; bearing: number; atSpot: boolean; photosHere: number; needed: number };
// Something else close by (another 311 spot or a rider-logged pothole): the "near you" arrow.
export type NearAlert = { id: string; place: string; meters: number; bearing: number };
