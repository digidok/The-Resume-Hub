import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExternalApplyLink({ url, source }: { url: string; source: string | null }) {
  return (
    <div>
      <p className="mb-3 text-sm text-slate-600">
        This role is sourced from {source ?? "an external job board"} — applications go through their
        site, not through Resume Hub.
      </p>
      <a href={url} target="_blank" rel="noreferrer">
        <Button type="button">
          Apply on {source ?? "external site"}
          <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </a>
    </div>
  );
}
