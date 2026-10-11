import SubmitForm from "@/components/submit/SubmitForm";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "submit a photo · spotholes" };

export default async function SubmitPage() {
  const { t } = await getT();
  return (
    <div className="wrap py-10 sm:py-16">
      <div className="mx-auto max-w-lg">
        <p className="eyebrow">{t("report.eyebrow")}</p>
        <h1 className="h2 mt-2">{t("report.title")}</h1>
        <p className="mt-3 text-muted">{t("report.body")}</p>
        <div className="mt-8"><SubmitForm /></div>
      </div>
    </div>
  );
}
