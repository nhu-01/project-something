// SAMPLE DATA: every record here is made up for building the frontend. Remove when the backend is wired.
import type { Pothole } from "@/lib/data/types";

export const SAMPLE_POTHOLES: Pothole[] = [
 {
  "id": "p01",
  "lat": 40.7102,
  "lng": -73.95933,
  "street": "Bedford Ave",
  "borough": "Brooklyn",
  "direction": "northbound",
  "lane": "crosswalk",
  "size": "medium",
  "severity": 3,
  "status": "open",
  "firstSeen": "2026-08-31T12:00:00Z",
  "lastSeen": "2026-09-03T14:00:00Z",
  "sightings": [
   {
    "id": "s1-0",
    "at": "2026-08-31T12:00:00Z",
    "rider": "r-4fdr",
    "kind": "first_seen",
    "severity": 3,
    "note": "first seen by a rider heading northbound."
   },
   {
    "id": "s1-1",
    "at": "2026-09-03T14:00:00Z",
    "rider": "r-cu47",
    "kind": "confirmed",
    "severity": 3,
    "note": "still there, about the same."
   }
  ],
  "seed": 7919
 },
 {
  "id": "p02",
  "lat": 40.70547,
  "lng": -73.95637,
  "street": "Bedford Ave",
  "borough": "Brooklyn",
  "direction": "northbound",
  "lane": "right lane, near curb",
  "size": "medium",
  "severity": 3,
  "status": "open",
  "firstSeen": "2026-09-26T23:00:00Z",
  "lastSeen": "2026-09-26T23:00:00Z",
  "sightings": [
   {
    "id": "s2-0",
    "at": "2026-09-26T23:00:00Z",
    "rider": "r-bbg7",
    "kind": "first_seen",
    "severity": 3,
    "note": "first seen by a rider heading northbound."
   }
  ],
  "seed": 15838
 },
 {
  "id": "p03",
  "lat": 40.6998,
  "lng": -73.95506,
  "street": "Bedford Ave",
  "borough": "Brooklyn",
  "direction": "northbound",
  "lane": "right lane",
  "size": "medium",
  "severity": null,
  "status": "repaired",
  "firstSeen": "2026-09-25T02:00:00Z",
  "lastSeen": "2026-10-02T15:00:00Z",
  "sightings": [
   {
    "id": "s3-0",
    "at": "2026-09-25T02:00:00Z",
    "rider": "r-crxj",
    "kind": "first_seen",
    "severity": 3,
    "note": "first seen by a rider heading northbound."
   },
   {
    "id": "s3-1",
    "at": "2026-09-29T10:00:00Z",
    "rider": "r-85cz",
    "kind": "confirmed",
    "severity": 3,
    "note": "still there, about the same."
   },
   {
    "id": "s3-2",
    "at": "2026-10-02T15:00:00Z",
    "rider": "r-3htk",
    "kind": "repaired",
    "severity": null,
    "note": "smooth surface where it used to be. looks repaired."
   }
  ],
  "seed": 23757
 },
 {
  "id": "p04",
  "lat": 40.69602,
  "lng": -73.95424,
  "street": "Bedford Ave",
  "borough": "Brooklyn",
  "direction": "northbound",
  "lane": "right lane, near curb",
  "size": "medium",
  "severity": 5,
  "status": "open",
  "firstSeen": "2026-09-13T16:00:00Z",
  "lastSeen": "2026-09-25T03:00:00Z",
  "sightings": [
   {
    "id": "s4-0",
    "at": "2026-09-13T16:00:00Z",
    "rider": "r-spzp",
    "kind": "first_seen",
    "severity": 4,
    "note": "first seen by a rider heading northbound."
   },
   {
    "id": "s4-1",
    "at": "2026-09-17T17:00:00Z",
    "rider": "r-vxg3",
    "kind": "worse",
    "severity": 5,
    "note": "edges have broken down, it looks bigger."
   },
   {
    "id": "s4-2",
    "at": "2026-09-23T21:00:00Z",
    "rider": "r-mckm",
    "kind": "confirmed",
    "severity": 5,
    "note": "still there, about the same."
   },
   {
    "id": "s4-3",
    "at": "2026-09-25T03:00:00Z",
    "rider": "r-38de",
    "kind": "confirmed",
    "severity": 5,
    "note": "still there, about the same."
   }
  ],
  "seed": 31676
 },
 {
  "id": "p05",
  "lat": 40.68753,
  "lng": -73.95363,
  "street": "Bedford Ave",
  "borough": "Brooklyn",
  "direction": "northbound",
  "lane": "right lane, near curb",
  "size": "medium",
  "severity": null,
  "status": "repaired",
  "firstSeen": "2026-09-02T12:00:00Z",
  "lastSeen": "2026-09-16T04:00:00Z",
  "sightings": [
   {
    "id": "s5-0",
    "at": "2026-09-02T12:00:00Z",
    "rider": "r-xpdp",
    "kind": "first_seen",
    "severity": 3,
    "note": "first seen by a rider heading northbound."
   },
   {
    "id": "s5-1",
    "at": "2026-09-06T15:00:00Z",
    "rider": "r-aj64",
    "kind": "confirmed",
    "severity": 3,
    "note": "still there, about the same."
   },
   {
    "id": "s5-2",
    "at": "2026-09-11T19:00:00Z",
    "rider": "r-7agf",
    "kind": "worse",
    "severity": 4,
    "note": "edges have broken down, it looks bigger."
   },
   {
    "id": "s5-3",
    "at": "2026-09-16T04:00:00Z",
    "rider": "r-xvdb",
    "kind": "repaired",
    "severity": null,
    "note": "smooth surface where it used to be. looks repaired."
   }
  ],
  "seed": 39595
 },
 {
  "id": "p06",
  "lat": 40.73308,
  "lng": -74.01022,
  "street": "Hudson River Greenway",
  "borough": "Manhattan",
  "direction": "northbound",
  "lane": "bike lane",
  "size": "medium",
  "severity": null,
  "status": "repaired",
  "firstSeen": "2026-09-13T16:00:00Z",
  "lastSeen": "2026-09-16T21:00:00Z",
  "sightings": [
   {
    "id": "s6-0",
    "at": "2026-09-13T16:00:00Z",
    "rider": "r-xhaw",
    "kind": "first_seen",
    "severity": 4,
    "note": "first seen by a rider heading northbound."
   },
   {
    "id": "s6-1",
    "at": "2026-09-16T21:00:00Z",
    "rider": "r-wre9",
    "kind": "repaired",
    "severity": null,
    "note": "smooth surface where it used to be. looks repaired."
   }
  ],
  "seed": 47514
 },
 {
  "id": "p07",
  "lat": 40.74416,
  "lng": -74.00743,
  "street": "Hudson River Greenway",
  "borough": "Manhattan",
  "direction": "northbound",
  "lane": "bike lane",
  "size": "small",
  "severity": 3,
  "status": "open",
  "firstSeen": "2026-09-28T09:00:00Z",
  "lastSeen": "2026-10-05T23:00:00Z",
  "sightings": [
   {
    "id": "s7-0",
    "at": "2026-09-28T09:00:00Z",
    "rider": "r-9ugy",
    "kind": "first_seen",
    "severity": 2,
    "note": "first seen by a rider heading northbound."
   },
   {
    "id": "s7-1",
    "at": "2026-10-02T16:00:00Z",
    "rider": "r-wcqb",
    "kind": "worse",
    "severity": 3,
    "note": "edges have broken down, it looks bigger."
   },
   {
    "id": "s7-2",
    "at": "2026-10-03T17:00:00Z",
    "rider": "r-bt9j",
    "kind": "confirmed",
    "severity": 3,
    "note": "still there, about the same."
   },
   {
    "id": "s7-3",
    "at": "2026-10-05T23:00:00Z",
    "rider": "r-jq57",
    "kind": "confirmed",
    "severity": 3,
    "note": "still there, about the same."
   }
  ],
  "seed": 55433
 },
 {
  "id": "p08",
  "lat": 40.75768,
  "lng": -73.99908,
  "street": "Hudson River Greenway",
  "borough": "Manhattan",
  "direction": "northbound",
  "lane": "left lane",
  "size": "large",
  "severity": null,
  "status": "repaired",
  "firstSeen": "2026-09-29T11:00:00Z",
  "lastSeen": "2026-10-09T13:00:00Z",
  "sightings": [
   {
    "id": "s8-0",
    "at": "2026-09-29T11:00:00Z",
    "rider": "r-g88g",
    "kind": "first_seen",
    "severity": 5,
    "note": "first seen by a rider heading northbound."
   },
   {
    "id": "s8-1",
    "at": "2026-10-05T11:00:00Z",
    "rider": "r-cjqr",
    "kind": "confirmed",
    "severity": 5,
    "note": "still there, about the same."
   },
   {
    "id": "s8-2",
    "at": "2026-10-07T11:00:00Z",
    "rider": "r-bfkn",
    "kind": "confirmed",
    "severity": 5,
    "note": "still there, about the same."
   },
   {
    "id": "s8-3",
    "at": "2026-10-09T13:00:00Z",
    "rider": "r-cne7",
    "kind": "repaired",
    "severity": null,
    "note": "smooth surface where it used to be. looks repaired."
   }
  ],
  "seed": 63352
 },
 {
  "id": "p09",
  "lat": 40.77679,
  "lng": -73.99346,
  "street": "Hudson River Greenway",
  "borough": "Manhattan",
  "direction": "northbound",
  "lane": "right lane",
  "size": "medium",
  "severity": null,
  "status": "repaired",
  "firstSeen": "2026-09-29T00:00:00Z",
  "lastSeen": "2026-09-30T00:00:00Z",
  "sightings": [
   {
    "id": "s9-0",
    "at": "2026-09-29T00:00:00Z",
    "rider": "r-8nzk",
    "kind": "first_seen",
    "severity": 3,
    "note": "first seen by a rider heading northbound."
   },
   {
    "id": "s9-1",
    "at": "2026-09-30T00:00:00Z",
    "rider": "r-wxcs",
    "kind": "repaired",
    "severity": null,
    "note": "smooth surface where it used to be. looks repaired."
   }
  ],
  "seed": 71271
 },
 {
  "id": "p10",
  "lat": 40.74224,
  "lng": -73.91948,
  "street": "Queens Blvd",
  "borough": "Queens",
  "direction": "eastbound",
  "lane": "right lane",
  "size": "medium",
  "severity": 5,
  "status": "open",
  "firstSeen": "2026-09-14T17:00:00Z",
  "lastSeen": "2026-09-24T17:00:00Z",
  "sightings": [
   {
    "id": "s10-0",
    "at": "2026-09-14T17:00:00Z",
    "rider": "r-ncys",
    "kind": "first_seen",
    "severity": 3,
    "note": "first seen by a rider heading eastbound."
   },
   {
    "id": "s10-1",
    "at": "2026-09-15T23:00:00Z",
    "rider": "r-94a6",
    "kind": "worse",
    "severity": 4,
    "note": "edges have broken down, it looks bigger."
   },
   {
    "id": "s10-2",
    "at": "2026-09-20T08:00:00Z",
    "rider": "r-awyp",
    "kind": "worse",
    "severity": 5,
    "note": "edges have broken down, it looks bigger."
   },
   {
    "id": "s10-3",
    "at": "2026-09-24T17:00:00Z",
    "rider": "r-awcc",
    "kind": "worse",
    "severity": 5,
    "note": "edges have broken down, it looks bigger."
   }
  ],
  "seed": 79190
 },
 {
  "id": "p11",
  "lat": 40.738,
  "lng": -73.90592,
  "street": "Queens Blvd",
  "borough": "Queens",
  "direction": "eastbound",
  "lane": "left lane",
  "size": "medium",
  "severity": 3,
  "status": "open",
  "firstSeen": "2026-09-13T00:00:00Z",
  "lastSeen": "2026-09-15T14:00:00Z",
  "sightings": [
   {
    "id": "s11-0",
    "at": "2026-09-13T00:00:00Z",
    "rider": "r-takw",
    "kind": "first_seen",
    "severity": 3,
    "note": "first seen by a rider heading eastbound."
   },
   {
    "id": "s11-1",
    "at": "2026-09-14T07:00:00Z",
    "rider": "r-ah9z",
    "kind": "confirmed",
    "severity": 3,
    "note": "still there, about the same."
   },
   {
    "id": "s11-2",
    "at": "2026-09-15T14:00:00Z",
    "rider": "r-3wy8",
    "kind": "confirmed",
    "severity": 3,
    "note": "still there, about the same."
   }
  ],
  "seed": 87109
 },
 {
  "id": "p12",
  "lat": 40.73413,
  "lng": -73.89689,
  "street": "Queens Blvd",
  "borough": "Queens",
  "direction": "eastbound",
  "lane": "left lane",
  "size": "medium",
  "severity": 2,
  "status": "open",
  "firstSeen": "2026-09-25T02:00:00Z",
  "lastSeen": "2026-09-28T08:00:00Z",
  "sightings": [
   {
    "id": "s12-0",
    "at": "2026-09-25T02:00:00Z",
    "rider": "r-rs7h",
    "kind": "first_seen",
    "severity": 3,
    "note": "first seen by a rider heading eastbound."
   },
   {
    "id": "s12-1",
    "at": "2026-09-28T08:00:00Z",
    "rider": "r-yjgx",
    "kind": "better",
    "severity": 2,
    "note": "partly filled, a bit smaller."
   }
  ],
  "seed": 95028
 },
 {
  "id": "p13",
  "lat": 40.7285,
  "lng": -73.87484,
  "street": "Queens Blvd",
  "borough": "Queens",
  "direction": "eastbound",
  "lane": "left lane",
  "size": "small",
  "severity": 2,
  "status": "open",
  "firstSeen": "2026-09-23T00:00:00Z",
  "lastSeen": "2026-10-04T13:00:00Z",
  "sightings": [
   {
    "id": "s13-0",
    "at": "2026-09-23T00:00:00Z",
    "rider": "r-bzc9",
    "kind": "first_seen",
    "severity": 2,
    "note": "first seen by a rider heading eastbound."
   },
   {
    "id": "s13-1",
    "at": "2026-09-26T02:00:00Z",
    "rider": "r-drsj",
    "kind": "confirmed",
    "severity": 2,
    "note": "still there, about the same."
   },
   {
    "id": "s13-2",
    "at": "2026-09-28T08:00:00Z",
    "rider": "r-pxts",
    "kind": "confirmed",
    "severity": 2,
    "note": "still there, about the same."
   },
   {
    "id": "s13-3",
    "at": "2026-10-04T13:00:00Z",
    "rider": "r-z55w",
    "kind": "confirmed",
    "severity": 2,
    "note": "still there, about the same."
   }
  ],
  "seed": 102947
 },
 {
  "id": "p14",
  "lat": 40.7252,
  "lng": -73.86438,
  "street": "Queens Blvd",
  "borough": "Queens",
  "direction": "eastbound",
  "lane": "right lane, near curb",
  "size": "medium",
  "severity": 3,
  "status": "open",
  "firstSeen": "2026-09-20T00:00:00Z",
  "lastSeen": "2026-09-22T00:00:00Z",
  "sightings": [
   {
    "id": "s14-0",
    "at": "2026-09-20T00:00:00Z",
    "rider": "r-xepr",
    "kind": "first_seen",
    "severity": 3,
    "note": "first seen by a rider heading eastbound."
   },
   {
    "id": "s14-1",
    "at": "2026-09-22T00:00:00Z",
    "rider": "r-35jh",
    "kind": "confirmed",
    "severity": 3,
    "note": "still there, about the same."
   }
  ],
  "seed": 110866
 },
 {
  "id": "p15",
  "lat": 40.71799,
  "lng": -73.84384,
  "street": "Queens Blvd",
  "borough": "Queens",
  "direction": "eastbound",
  "lane": "left lane",
  "size": "small",
  "severity": null,
  "status": "repaired",
  "firstSeen": "2026-09-02T22:00:00Z",
  "lastSeen": "2026-09-15T08:00:00Z",
  "sightings": [
   {
    "id": "s15-0",
    "at": "2026-09-02T22:00:00Z",
    "rider": "r-5sjf",
    "kind": "first_seen",
    "severity": 1,
    "note": "first seen by a rider heading eastbound."
   },
   {
    "id": "s15-1",
    "at": "2026-09-08T22:00:00Z",
    "rider": "r-3suz",
    "kind": "confirmed",
    "severity": 1,
    "note": "still there, about the same."
   },
   {
    "id": "s15-2",
    "at": "2026-09-10T00:00:00Z",
    "rider": "r-hj3n",
    "kind": "confirmed",
    "severity": 1,
    "note": "still there, about the same."
   },
   {
    "id": "s15-3",
    "at": "2026-09-15T08:00:00Z",
    "rider": "r-tw3f",
    "kind": "repaired",
    "severity": null,
    "note": "smooth surface where it used to be. looks repaired."
   }
  ],
  "seed": 118785
 },
 {
  "id": "p16",
  "lat": 40.81934,
  "lng": -73.92512,
  "street": "Grand Concourse",
  "borough": "Bronx",
  "direction": "northbound",
  "lane": "right lane",
  "size": "medium",
  "severity": 2,
  "status": "open",
  "firstSeen": "2026-09-29T04:00:00Z",
  "lastSeen": "2026-10-08T12:00:00Z",
  "sightings": [
   {
    "id": "s16-0",
    "at": "2026-09-29T04:00:00Z",
    "rider": "r-vx7t",
    "kind": "first_seen",
    "severity": 3,
    "note": "first seen by a rider heading northbound."
   },
   {
    "id": "s16-1",
    "at": "2026-10-02T11:00:00Z",
    "rider": "r-mxgd",
    "kind": "confirmed",
    "severity": 3,
    "note": "still there, about the same."
   },
   {
    "id": "s16-2",
    "at": "2026-10-08T12:00:00Z",
    "rider": "r-gh7p",
    "kind": "better",
    "severity": 2,
    "note": "partly filled, a bit smaller."
   }
  ],
  "seed": 126704
 },
 {
  "id": "p17",
  "lat": 40.82862,
  "lng": -73.92051,
  "street": "Grand Concourse",
  "borough": "Bronx",
  "direction": "northbound",
  "lane": "right lane, near curb",
  "size": "small",
  "severity": 2,
  "status": "open",
  "firstSeen": "2026-10-06T07:00:00Z",
  "lastSeen": "2026-10-08T20:00:00Z",
  "sightings": [
   {
    "id": "s17-0",
    "at": "2026-10-06T07:00:00Z",
    "rider": "r-js8a",
    "kind": "first_seen",
    "severity": 2,
    "note": "first seen by a rider heading northbound."
   },
   {
    "id": "s17-1",
    "at": "2026-10-08T08:00:00Z",
    "rider": "r-q4bf",
    "kind": "confirmed",
    "severity": 2,
    "note": "still there, about the same."
   },
   {
    "id": "s17-2",
    "at": "2026-10-08T20:00:00Z",
    "rider": "r-48es",
    "kind": "confirmed",
    "severity": 2,
    "note": "still there, about the same."
   }
  ],
  "seed": 134623
 },
 {
  "id": "p18",
  "lat": 40.83669,
  "lng": -73.91574,
  "street": "Grand Concourse",
  "borough": "Bronx",
  "direction": "northbound",
  "lane": "bike lane",
  "size": "medium",
  "severity": 5,
  "status": "open",
  "firstSeen": "2026-09-09T03:00:00Z",
  "lastSeen": "2026-09-19T09:00:00Z",
  "sightings": [
   {
    "id": "s18-0",
    "at": "2026-09-09T03:00:00Z",
    "rider": "r-uk52",
    "kind": "first_seen",
    "severity": 3,
    "note": "first seen by a rider heading northbound."
   },
   {
    "id": "s18-1",
    "at": "2026-09-14T05:00:00Z",
    "rider": "r-tt58",
    "kind": "worse",
    "severity": 4,
    "note": "edges have broken down, it looks bigger."
   },
   {
    "id": "s18-2",
    "at": "2026-09-19T09:00:00Z",
    "rider": "r-kyp9",
    "kind": "worse",
    "severity": 5,
    "note": "edges have broken down, it looks bigger."
   }
  ],
  "seed": 142542
 },
 {
  "id": "p19",
  "lat": 40.84,
  "lng": -73.91315,
  "street": "Grand Concourse",
  "borough": "Bronx",
  "direction": "northbound",
  "lane": "bike lane",
  "size": "medium",
  "severity": 3,
  "status": "open",
  "firstSeen": "2026-09-01T03:00:00Z",
  "lastSeen": "2026-09-02T11:00:00Z",
  "sightings": [
   {
    "id": "s19-0",
    "at": "2026-09-01T03:00:00Z",
    "rider": "r-wpau",
    "kind": "first_seen",
    "severity": 3,
    "note": "first seen by a rider heading northbound."
   },
   {
    "id": "s19-1",
    "at": "2026-09-02T11:00:00Z",
    "rider": "r-8pu4",
    "kind": "confirmed",
    "severity": 3,
    "note": "still there, about the same."
   }
  ],
  "seed": 150461
 },
 {
  "id": "p20",
  "lat": 40.84644,
  "lng": -73.90921,
  "street": "Grand Concourse",
  "borough": "Bronx",
  "direction": "northbound",
  "lane": "crosswalk",
  "size": "medium",
  "severity": 5,
  "status": "open",
  "firstSeen": "2026-09-08T05:00:00Z",
  "lastSeen": "2026-09-18T13:00:00Z",
  "sightings": [
   {
    "id": "s20-0",
    "at": "2026-09-08T05:00:00Z",
    "rider": "r-mq75",
    "kind": "first_seen",
    "severity": 4,
    "note": "first seen by a rider heading northbound."
   },
   {
    "id": "s20-1",
    "at": "2026-09-12T13:00:00Z",
    "rider": "r-mdgq",
    "kind": "worse",
    "severity": 5,
    "note": "edges have broken down, it looks bigger."
   },
   {
    "id": "s20-2",
    "at": "2026-09-17T13:00:00Z",
    "rider": "r-8jez",
    "kind": "confirmed",
    "severity": 5,
    "note": "still there, about the same."
   },
   {
    "id": "s20-3",
    "at": "2026-09-18T13:00:00Z",
    "rider": "r-geha",
    "kind": "confirmed",
    "severity": 5,
    "note": "still there, about the same."
   }
  ],
  "seed": 158380
 },
 {
  "id": "p21",
  "lat": 40.8553,
  "lng": -73.90413,
  "street": "Grand Concourse",
  "borough": "Bronx",
  "direction": "northbound",
  "lane": "bike lane",
  "size": "medium",
  "severity": 3,
  "status": "open",
  "firstSeen": "2026-09-06T00:00:00Z",
  "lastSeen": "2026-09-10T00:00:00Z",
  "sightings": [
   {
    "id": "s21-0",
    "at": "2026-09-06T00:00:00Z",
    "rider": "r-gzt7",
    "kind": "first_seen",
    "severity": 3,
    "note": "first seen by a rider heading northbound."
   },
   {
    "id": "s21-1",
    "at": "2026-09-10T00:00:00Z",
    "rider": "r-pxq5",
    "kind": "confirmed",
    "severity": 3,
    "note": "still there, about the same."
   }
  ],
  "seed": 166299
 },
 {
  "id": "p22",
  "lat": 40.67759,
  "lng": -73.98381,
  "street": "4th Ave",
  "borough": "Brooklyn",
  "direction": "southbound",
  "lane": "right lane",
  "size": "medium",
  "severity": 4,
  "status": "open",
  "firstSeen": "2026-09-04T12:00:00Z",
  "lastSeen": "2026-09-12T02:00:00Z",
  "sightings": [
   {
    "id": "s22-0",
    "at": "2026-09-04T12:00:00Z",
    "rider": "r-4n7f",
    "kind": "first_seen",
    "severity": 3,
    "note": "first seen by a rider heading southbound."
   },
   {
    "id": "s22-1",
    "at": "2026-09-07T21:00:00Z",
    "rider": "r-m78g",
    "kind": "confirmed",
    "severity": 3,
    "note": "still there, about the same."
   },
   {
    "id": "s22-2",
    "at": "2026-09-10T00:00:00Z",
    "rider": "r-7de7",
    "kind": "worse",
    "severity": 4,
    "note": "edges have broken down, it looks bigger."
   },
   {
    "id": "s22-3",
    "at": "2026-09-12T02:00:00Z",
    "rider": "r-2cjp",
    "kind": "confirmed",
    "severity": 4,
    "note": "still there, about the same."
   }
  ],
  "seed": 174218
 },
 {
  "id": "p23",
  "lat": 40.67281,
  "lng": -73.98806,
  "street": "4th Ave",
  "borough": "Brooklyn",
  "direction": "southbound",
  "lane": "right lane",
  "size": "medium",
  "severity": 4,
  "status": "open",
  "firstSeen": "2026-09-25T06:00:00Z",
  "lastSeen": "2026-10-01T15:00:00Z",
  "sightings": [
   {
    "id": "s23-0",
    "at": "2026-09-25T06:00:00Z",
    "rider": "r-n859",
    "kind": "first_seen",
    "severity": 3,
    "note": "first seen by a rider heading southbound."
   },
   {
    "id": "s23-1",
    "at": "2026-09-28T07:00:00Z",
    "rider": "r-ztx3",
    "kind": "worse",
    "severity": 4,
    "note": "edges have broken down, it looks bigger."
   },
   {
    "id": "s23-2",
    "at": "2026-10-01T15:00:00Z",
    "rider": "r-y5g4",
    "kind": "confirmed",
    "severity": 4,
    "note": "still there, about the same."
   }
  ],
  "seed": 182137
 },
 {
  "id": "p24",
  "lat": 40.66621,
  "lng": -73.99272,
  "street": "4th Ave",
  "borough": "Brooklyn",
  "direction": "southbound",
  "lane": "left lane",
  "size": "medium",
  "severity": null,
  "status": "repaired",
  "firstSeen": "2026-09-01T03:00:00Z",
  "lastSeen": "2026-09-13T11:00:00Z",
  "sightings": [
   {
    "id": "s24-0",
    "at": "2026-09-01T03:00:00Z",
    "rider": "r-5fk8",
    "kind": "first_seen",
    "severity": 3,
    "note": "first seen by a rider heading southbound."
   },
   {
    "id": "s24-1",
    "at": "2026-09-07T04:00:00Z",
    "rider": "r-vbe9",
    "kind": "confirmed",
    "severity": 3,
    "note": "still there, about the same."
   },
   {
    "id": "s24-2",
    "at": "2026-09-13T11:00:00Z",
    "rider": "r-c3dm",
    "kind": "repaired",
    "severity": null,
    "note": "smooth surface where it used to be. looks repaired."
   }
  ],
  "seed": 190056
 },
 {
  "id": "p25",
  "lat": 40.65967,
  "lng": -73.99892,
  "street": "4th Ave",
  "borough": "Brooklyn",
  "direction": "southbound",
  "lane": "crosswalk",
  "size": "medium",
  "severity": 4,
  "status": "open",
  "firstSeen": "2026-10-06T22:00:00Z",
  "lastSeen": "2026-10-08T13:00:00Z",
  "sightings": [
   {
    "id": "s25-0",
    "at": "2026-10-06T22:00:00Z",
    "rider": "r-2np8",
    "kind": "first_seen",
    "severity": 3,
    "note": "first seen by a rider heading southbound."
   },
   {
    "id": "s25-1",
    "at": "2026-10-09T07:00:00Z",
    "rider": "r-fdt4",
    "kind": "worse",
    "severity": 4,
    "note": "edges have broken down, it looks bigger."
   },
   {
    "id": "s25-2",
    "at": "2026-10-08T13:00:00Z",
    "rider": "r-c45z",
    "kind": "confirmed",
    "severity": 4,
    "note": "still there, about the same."
   }
  ],
  "seed": 197975
 },
 {
  "id": "p26",
  "lat": 40.6504,
  "lng": -74.0075,
  "street": "4th Ave",
  "borough": "Brooklyn",
  "direction": "southbound",
  "lane": "left lane",
  "size": "medium",
  "severity": 3,
  "status": "open",
  "firstSeen": "2026-09-16T10:00:00Z",
  "lastSeen": "2026-09-18T15:00:00Z",
  "sightings": [
   {
    "id": "s26-0",
    "at": "2026-09-16T10:00:00Z",
    "rider": "r-f58p",
    "kind": "first_seen",
    "severity": 3,
    "note": "first seen by a rider heading southbound."
   },
   {
    "id": "s26-1",
    "at": "2026-09-18T15:00:00Z",
    "rider": "r-7uzn",
    "kind": "confirmed",
    "severity": 3,
    "note": "still there, about the same."
   }
  ],
  "seed": 205894
 },
 {
  "id": "p27",
  "lat": 40.64412,
  "lng": -74.01278,
  "street": "4th Ave",
  "borough": "Brooklyn",
  "direction": "southbound",
  "lane": "left lane",
  "size": "small",
  "severity": 1,
  "status": "open",
  "firstSeen": "2026-09-16T09:00:00Z",
  "lastSeen": "2026-09-27T15:00:00Z",
  "sightings": [
   {
    "id": "s27-0",
    "at": "2026-09-16T09:00:00Z",
    "rider": "r-wbhj",
    "kind": "first_seen",
    "severity": 1,
    "note": "first seen by a rider heading southbound."
   },
   {
    "id": "s27-1",
    "at": "2026-09-22T13:00:00Z",
    "rider": "r-mgyp",
    "kind": "confirmed",
    "severity": 1,
    "note": "still there, about the same."
   },
   {
    "id": "s27-2",
    "at": "2026-09-27T15:00:00Z",
    "rider": "r-ucpt",
    "kind": "confirmed",
    "severity": 1,
    "note": "still there, about the same."
   }
  ],
  "seed": 213813
 }
];
