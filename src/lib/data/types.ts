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
  photo?: string; // the camera frame from this pass, when one was kept
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
  kind: "pothole" | "bump" | "rough";
  severity: Severity | null; // null once repaired
  status: Status;
  firstSeen: string;
  lastSeen: string;
  sightings: Sighting[]; // oldest first
  seed: number; // drives the drawn placeholder when a frame couldn't be kept (e.g. people in shot)
  photo?: string; // rider camera frame
};

// A pothole complaint from NYC 311 open data. Riders add photos to it, so one spot ends up with many pictures.
export type CityReport = {
  id: string; lat: number; lng: number; place: string; borough: string; createdAt: string; status: string;
  photoCount: number; lastPhotoAt: string | null;
  kind: "pothole" | "bump" | "rough" | null; severity: Severity | null; size: "small" | "medium" | "large" | null; lane: string | null;
  cover: string | null; // newest photo, for thumbnails
};
export type CityPhoto = { id: string; at: string; rider: string | null; photo: string | null; present: boolean; severity: Severity | null; note: string };
export type CityReportDetail = CityReport & { photos: CityPhoto[] };
// A suggested route past a few 311 reports that need photos.
export type Mission = { stops: CityReport[]; line: [number, number][]; distanceM: number; routed: boolean };

export type Stats = {
  tracked: number; // hazards riders have reported themselves
  newThisWeek: number;
  ridesThisWeek: number;
  citySpots: number; // open 311 reports
  cityPhotographed: number; // ...that have at least one rider photo
  cityPhotos: number; // rider photos on 311 reports, in total
  daily: { day: string; photos: number; reports: number }[];
  topSpots: { id: string; place: string; borough: string; photos: number }[];
  latest: { id: string; place: string; borough: string; at: string }[];
};
