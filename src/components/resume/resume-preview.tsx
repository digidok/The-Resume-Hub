import type { ResumeContent } from "@/types/database";

export const RESUME_TEMPLATES = [
  { id: "classic", label: "Classic" },
  { id: "modern", label: "Modern" },
  { id: "minimal", label: "Minimal" },
] as const;

const templateStyles: Record<
  string,
  { font: string; accent: string; heading: string }
> = {
  classic: {
    font: "font-serif",
    accent: "text-slate-900 border-slate-900",
    heading: "uppercase tracking-wide text-sm font-bold border-b border-slate-300 pb-1",
  },
  modern: {
    font: "font-sans",
    accent: "text-indigo-600 border-indigo-600",
    heading: "uppercase tracking-wide text-sm font-bold text-indigo-600 pb-1",
  },
  minimal: {
    font: "font-sans",
    accent: "text-slate-700 border-slate-200",
    heading: "text-xs font-semibold uppercase tracking-widest text-slate-500 pb-1",
  },
};

function formatRange(start?: string, end?: string, current?: boolean) {
  const parts = [start, current ? "Present" : end].filter(Boolean);
  return parts.join(" — ");
}

export function ResumePreview({
  content,
  template,
}: {
  content: ResumeContent;
  template: string;
}) {
  const style = templateStyles[template] ?? templateStyles.classic;

  return (
    <div
      id="resume-preview"
      className={`mx-auto w-full max-w-[8.5in] bg-white p-10 text-slate-900 print:p-0 ${style.font}`}
    >
      <header className={`border-b-2 pb-4 ${style.accent}`}>
        <h1 className="text-3xl font-bold">{content.full_name || "Your Name"}</h1>
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600">
          {[content.email, content.phone, content.location, content.website]
            .filter(Boolean)
            .map((item, i) => (
              <span key={i}>{item}</span>
            ))}
        </p>
      </header>

      {content.summary && (
        <section className="mt-5">
          <h2 className={style.heading}>Summary</h2>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">
            {content.summary}
          </p>
        </section>
      )}

      {content.experience.length > 0 && (
        <section className="mt-5">
          <h2 className={style.heading}>Experience</h2>
          <div className="mt-2 space-y-4">
            {content.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className="text-sm font-semibold">
                    {exp.title || "Role"}
                    {exp.company ? ` · ${exp.company}` : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatRange(exp.start_date, exp.end_date, exp.current)}
                  </p>
                </div>
                {exp.location && (
                  <p className="text-xs text-slate-500">{exp.location}</p>
                )}
                {exp.description && (
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-slate-700">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {content.education.length > 0 && (
        <section className="mt-5">
          <h2 className={style.heading}>Education</h2>
          <div className="mt-2 space-y-3">
            {content.education.map((edu) => (
              <div key={edu.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className="text-sm font-semibold">
                    {edu.school || "School"}
                    {edu.degree ? ` · ${edu.degree}` : ""}
                    {edu.field ? ` in ${edu.field}` : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatRange(edu.start_date, edu.end_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {content.projects.length > 0 && (
        <section className="mt-5">
          <h2 className={style.heading}>Projects</h2>
          <div className="mt-2 space-y-3">
            {content.projects.map((project) => (
              <div key={project.id}>
                <p className="text-sm font-semibold">
                  {project.name}
                  {project.url && (
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      {project.url}
                    </span>
                  )}
                </p>
                {project.description && (
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">
                    {project.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {content.skills.length > 0 && (
        <section className="mt-5">
          <h2 className={style.heading}>Skills</h2>
          <p className="mt-2 text-sm text-slate-700">{content.skills.join(" · ")}</p>
        </section>
      )}
    </div>
  );
}
