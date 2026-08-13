import { MapPin, Sparkles } from "lucide-react";
import type { ResumeContent } from "@/types/database";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PublicProfileHeader({
  content,
  photoUrl,
  headline,
  openToWork,
}: {
  content: ResumeContent;
  photoUrl?: string | null;
  headline?: string | null;
  openToWork?: boolean;
}) {
  const name = content.full_name || "Candidate";
  const mostRecentRole = content.experience[0];
  const derivedHeadline =
    headline ||
    (mostRecentRole
      ? [mostRecentRole.title, mostRecentRole.company].filter(Boolean).join(" at ")
      : null);
  const photo = photoUrl || content.photo_url;

  return (
    <div className="mx-auto mb-0 w-full max-w-[8.5in] overflow-hidden rounded-t-xl bg-white shadow-sm print:hidden">
      <div className="h-28 bg-gradient-to-r from-brand-700 via-brand-600 to-teal-500 sm:h-36" />
      <div className="px-6 pb-6 sm:px-10">
        <div className="-mt-14 flex flex-col items-start gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt=""
              className="h-28 w-28 shrink-0 rounded-full border-4 border-white object-cover shadow-md sm:h-32 sm:w-32"
            />
          ) : (
            <span className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-white bg-brand-600 text-3xl font-semibold text-white shadow-md sm:h-32 sm:w-32">
              {initials(name)}
            </span>
          )}
          {openToWork && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 ring-1 ring-green-200 sm:mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Open to work
            </span>
          )}
        </div>

        <div className="mt-4">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{name}</h1>
          {derivedHeadline && <p className="mt-1 text-base text-slate-600">{derivedHeadline}</p>}
          {content.location && (
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {content.location}
            </p>
          )}
        </div>

        {content.summary && (
          <div className="mt-5 border-t border-slate-100 pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">About</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {content.summary}
            </p>
          </div>
        )}

        {content.skills.length > 0 && (
          <div className="mt-5 border-t border-slate-100 pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Skills</h2>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {content.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-100"
                >
                  <Sparkles className="h-3 w-3 text-brand-400" />
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
