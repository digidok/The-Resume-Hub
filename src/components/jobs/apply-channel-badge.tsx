import { classifyApplyChannel, APPLY_CHANNEL_META } from "@/lib/jobs/apply-channel";
import type { Job } from "@/types/database";

export function ApplyChannelBadge({
  job,
  className = "",
}: {
  job: Pick<Job, "employer_id" | "application_url">;
  className?: string;
}) {
  const channel = classifyApplyChannel(job);
  const meta = APPLY_CHANNEL_META[channel];
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.className} ${className}`}
    >
      {meta.label}
    </span>
  );
}
