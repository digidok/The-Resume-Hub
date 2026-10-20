import { BackLink } from "@/components/ui/back-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BusinessAdminNav } from "@/components/business/admin-nav";
import { RecruitmentNav } from "@/components/business/recruitment-nav";
import { requireStaff } from "@/lib/business/guard";
import { importTalentCsv } from "@/lib/business/recruitment-actions";

export const metadata = { title: "Import CVs — The Resume Document Hub" };

export default async function ImportPage({ searchParams }: { searchParams: Promise<{ error?: string; done?: string; skipped?: string }> }) {
  const sp = await searchParams;
  await requireStaff(["recruiter"]);
  return (
    <div className="mx-auto max-w-3xl">
      <BackLink href="/dashboard/admin" label="Platform overview" />
      <h1 className="text-3xl font-bold text-slate-900">Business hub</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">Bring an existing candidate database into the talent pool.</p>
      <BusinessAdminNav />
      <RecruitmentNav />

      {sp.done && (
        <p className="mb-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Imported {Number(sp.done).toLocaleString("en-ZA")} candidate{sp.done === "1" ? "" : "s"}.
          {Number(sp.skipped) > 0 ? ` ${sp.skipped} row${sp.skipped === "1" ? "" : "s"} were skipped (no name, bad email, or duplicates in the file).` : ""}
        </p>
      )}
      {sp.error && <p role="alert" className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{sp.error}</p>}

      <Card className="p-6">
        <form action={importTalentCsv} encType="multipart/form-data" className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-800" htmlFor="file">CSV file</label>
            <input id="file" name="file" type="file" accept=".csv,text/csv" required className="mt-1 block w-full text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-800" htmlFor="source">Where did this list come from?</label>
            <input id="source" name="source" maxLength={120} placeholder="e.g. Walk-in CVs 2024, Job fair" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" name="confirm" required className="mt-1" />
            <span>
              I confirm these people gave us their CV for work-finding purposes and may be kept in our database under POPIA. Only
              rows marked <strong>consent = yes</strong> in the file can be contacted; the rest are stored but cannot be messaged.
            </span>
          </label>
          <Button type="submit">Import</Button>
        </form>
      </Card>

      <Card className="mt-6 p-6 text-sm text-slate-700">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">File format</h2>
        <p className="mt-2">First row = column names. Recognised columns (any order, extra columns are ignored):</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong>name</strong> (or first name and surname), required</li>
          <li><strong>email</strong> and/or <strong>phone</strong>, at least one required</li>
          <li>location, headline (job title), skills (separated by ; or ,), experience (years), availability (immediate, 1 month, later)</li>
          <li><strong>consent</strong>: write yes for people who agreed to be contacted</li>
        </ul>
        <p className="mt-3 text-xs text-slate-500">Up to 6 MB and 25,000 rows per file. People already in the pool (same email) are left unchanged. This imports candidate details; CV documents themselves are not uploaded.</p>
      </Card>
    </div>
  );
}
