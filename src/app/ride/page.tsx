import RideScreen from "@/components/ride/RideScreen";

export const metadata = { title: "ride · spotholes" };

export default async function RidePage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const { demo } = await searchParams;
  return <RideScreen demo={demo === "1"} />;
}
