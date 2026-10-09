import "server-only";
import { JOIN_RADIUS_M } from "./core";
import { query } from "./db";
import { meters } from "./geo";

type Row = { id: number; lat: number; lng: number; status: string; severity: number | null; street: string };

// Folds hazards that sit within JOIN_RADIUS_M of an older one into that older one. Nothing is deleted: the duplicate
// row stays (hidden, pointing at the survivor) and its sightings move over, remembering where they came from.
export async function mergeDuplicates(apply: boolean) {
  const rows = await query<Row>("SELECT id, lat, lng, status, severity, street FROM potholes WHERE merged_into IS NULL ORDER BY id");
  const gone = new Set<number>();
  const plan: { keep: number; street: string; fold: { id: number; meters: number }[] }[] = [];
  for (const keep of rows) {
    if (gone.has(keep.id)) continue;
    const fold = rows
      .filter((r) => r.id > keep.id && !gone.has(r.id) && r.status === keep.status)
      .map((r) => ({ id: r.id, meters: Math.round(meters(keep.lat, keep.lng, r.lat, r.lng)) }))
      .filter((r) => r.meters <= JOIN_RADIUS_M);
    if (!fold.length) continue;
    fold.forEach((f) => gone.add(f.id));
    plan.push({ keep: keep.id, street: keep.street, fold });
  }
  if (apply) {
    for (const g of plan) {
      const ids = g.fold.map((f) => f.id);
      await query("UPDATE sightings SET orig_pothole_id = COALESCE(orig_pothole_id, pothole_id), pothole_id = $1 WHERE pothole_id = ANY($2::int[])", [g.keep, ids]);
      await query("UPDATE potholes SET merged_into = $1 WHERE id = ANY($2::int[])", [g.keep, ids]);
      // the survivor takes the worst severity and the full time span of everything folded into it
      await query(
        `UPDATE potholes k SET
           severity = (SELECT MAX(severity) FROM potholes WHERE id = k.id OR merged_into = k.id),
           first_seen = (SELECT MIN(first_seen) FROM potholes WHERE id = k.id OR merged_into = k.id),
           last_seen = (SELECT MAX(last_seen) FROM potholes WHERE id = k.id OR merged_into = k.id)
         WHERE k.id = $1`,
        [g.keep],
      );
    }
  }
  return { applied: apply, before: rows.length, after: rows.length - gone.size, groups: plan };
}
