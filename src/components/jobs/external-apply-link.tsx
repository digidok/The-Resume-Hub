import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { classifyApplyChannel } from "@/lib/jobs/apply-channel";

export function ExternalApplyLink({ url, source }: { url: string; source: string | null }) {
  const channel = classifyApplyChannel({ employer_id: null, application_url: url });

  return (
    <div>
      <p className="mb-3 text-sm text-slate-600">
        {channel === "employer_site"
          ? `Sourced from ${source ?? "an external listing"} — this link goes to the employer's own site, not through another agent.`
          : `This role is sourced from ${source ?? "an external job board"} — applications go through their site, not through Resume Hub.`}
      </p>
      <a href={url} target="_blank" rel="noreferrer">
        <Button type="button">
          {channel === "employer_site" ? "Apply on employer's site" : `Apply on ${source ?? "external site"}`}
          <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </a>
    </div>
  );
}
