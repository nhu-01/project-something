import MapExplorer from "@/components/map/MapExplorer";
import { getPotholes, IS_SAMPLE_DATA } from "@/lib/data";

export const metadata = { title: "map · spotholes" };

export default async function MapPage() {
  const potholes = await getPotholes();
  return <MapExplorer potholes={potholes} sample={IS_SAMPLE_DATA} />;
}
