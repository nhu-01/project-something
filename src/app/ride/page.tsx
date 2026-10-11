import RideScreen from "@/components/ride/RideScreen";

export const metadata = { title: "ride · spotholes" };

// The camera screen. (There is no demo mode: a visit always uses the real camera and location.)
export default function RidePage() {
  return <RideScreen />;
}
