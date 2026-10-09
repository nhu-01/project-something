import ReportForm from "@/components/report/ReportForm";

export const metadata = { title: "report a spot · spotholes" };

export default function ReportPage() {
  return (
    <div className="wrap py-10 sm:py-16">
      <div className="mx-auto max-w-lg">
        <p className="eyebrow">not riding right now?</p>
        <h1 className="h2 mt-2">report a spot by photo.</h1>
        <p className="mt-3 text-muted">snap a pothole, bump or stretch of broken pavement and tell us where it is. it joins the map and riders get warned.</p>
        <div className="mt-8"><ReportForm /></div>
      </div>
    </div>
  );
}
