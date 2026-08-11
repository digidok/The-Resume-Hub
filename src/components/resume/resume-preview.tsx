import type { ResumeContent } from "@/types/database";

type TemplateConfig = {
  id: string;
  label: string;
  layout: "single" | "sidebar";
  photo: boolean;
  font: "font-serif" | "font-sans";
  compact?: boolean;
  accent: string;
  accentSoft: string;
};

export const RESUME_TEMPLATES: TemplateConfig[] = [
  { id: "classic", label: "Classic", layout: "single", photo: false, font: "font-serif", accent: "#0f172a", accentSoft: "#f1f5f9" },
  { id: "classic-photo", label: "Classic with Photo", layout: "single", photo: true, font: "font-serif", accent: "#0f172a", accentSoft: "#f1f5f9" },
  { id: "modern", label: "Modern Turquoise", layout: "single", photo: false, font: "font-sans", accent: "#0d9488", accentSoft: "#eafffc" },
  { id: "modern-photo", label: "Modern Turquoise with Photo", layout: "single", photo: true, font: "font-sans", accent: "#0d9488", accentSoft: "#eafffc" },
  { id: "minimal", label: "Minimal", layout: "single", photo: false, font: "font-sans", accent: "#64748b", accentSoft: "#f8fafc" },
  { id: "bold-coral", label: "Bold Coral", layout: "single", photo: false, font: "font-sans", accent: "#f2602c", accentSoft: "#fff3ee" },
  { id: "compact", label: "Compact", layout: "single", photo: false, font: "font-sans", compact: true, accent: "#334155", accentSoft: "#f8fafc" },
  { id: "sidebar-professional", label: "Sidebar Professional", layout: "sidebar", photo: true, font: "font-sans", accent: "#0d9488", accentSoft: "#eafffc" },
  { id: "sidebar-charcoal", label: "Sidebar Charcoal", layout: "sidebar", photo: true, font: "font-sans", accent: "#1e293b", accentSoft: "#f1f5f9" },
  { id: "sidebar-coral", label: "Sidebar Coral", layout: "sidebar", photo: true, font: "font-sans", accent: "#f2602c", accentSoft: "#fff3ee" },
];

function formatRange(start?: string, end?: string, current?: boolean) {
  const parts = [start, current ? "Present" : end].filter(Boolean);
  return parts.join(" — ");
}

function Photo({ url, size = 80 }: { url?: string; size?: number }) {
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

function Heading({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <h2
      className="border-b pb-1 text-xs font-bold uppercase tracking-wide"
      style={{ color: accent, borderColor: accent }}
    >
      {children}
    </h2>
  );
}

function ContactLine({ content }: { content: ResumeContent }) {
  return (
    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600">
      {[content.email, content.phone, content.location, content.website]
        .filter(Boolean)
        .map((item, i) => (
          <span key={i}>{item}</span>
        ))}
    </p>
  );
}

function InternationalDetails({ content }: { content: ResumeContent }) {
  const rows = [
    content.nationality && ["Nationality", content.nationality],
    content.visa_status && ["Visa status", content.visa_status],
    content.date_of_birth && ["Date of birth", content.date_of_birth],
    content.marital_status && ["Marital status", content.marital_status],
  ].filter(Boolean) as [string, string][];

  if (rows.length === 0) return null;
  return (
    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
      {rows.map(([label, value], i) => (
        <span key={i}>
          {label}: {value}
        </span>
      ))}
    </p>
  );
}

function Sections({
  content,
  accent,
  compact,
}: {
  content: ResumeContent;
  accent: string;
  compact?: boolean;
}) {
  const gap = compact ? "mt-3" : "mt-5";
  const textSize = compact ? "text-xs" : "text-sm";
  return (
    <>
      {content.summary && (
        <section className={gap}>
          <Heading accent={accent}>Summary</Heading>
          <p className={`mt-2 ${textSize} leading-relaxed whitespace-pre-line`}>{content.summary}</p>
        </section>
      )}

      {content.experience.length > 0 && (
        <section className={gap}>
          <Heading accent={accent}>Experience</Heading>
          <div className={`mt-2 ${compact ? "space-y-2" : "space-y-4"}`}>
            {content.experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className={`${textSize} font-semibold`}>
                    {exp.title || "Role"}
                    {exp.company ? ` · ${exp.company}` : ""}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatRange(exp.start_date, exp.end_date, exp.current)}
                  </p>
                </div>
                {exp.location && <p className="text-xs text-slate-500">{exp.location}</p>}
                {exp.description && (
                  <p className={`mt-1 ${textSize} leading-relaxed whitespace-pre-line text-slate-700`}>
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {content.education.length > 0 && (
        <section className={gap}>
          <Heading accent={accent}>Education</Heading>
          <div className="mt-2 space-y-3">
            {content.education.map((edu) => (
              <div key={edu.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className={`${textSize} font-semibold`}>
                    {edu.school || "School"}
                    {edu.degree ? ` · ${edu.degree}` : ""}
                    {edu.field ? ` in ${edu.field}` : ""}
                  </p>
                  <p className="text-xs text-slate-500">{formatRange(edu.start_date, edu.end_date)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {content.projects.length > 0 && (
        <section className={gap}>
          <Heading accent={accent}>Projects</Heading>
          <div className="mt-2 space-y-3">
            {content.projects.map((project) => (
              <div key={project.id}>
                <p className={`${textSize} font-semibold`}>
                  {project.name}
                  {project.url && (
                    <span className="ml-2 text-xs font-normal text-slate-500">{project.url}</span>
                  )}
                </p>
                {project.description && (
                  <p className={`mt-1 ${textSize} leading-relaxed text-slate-700`}>
                    {project.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function SingleLayout({ content, config }: { content: ResumeContent; config: TemplateConfig }) {
  return (
    <div
      id="resume-preview"
      className={`mx-auto w-full max-w-[8.5in] bg-white p-10 text-slate-900 print:p-0 ${config.font}`}
    >
      <header
        className="flex items-start justify-between gap-4 border-b-2 pb-4"
        style={{ borderColor: config.accent }}
      >
        <div>
          <h1 className="text-3xl font-bold">{content.full_name || "Your Name"}</h1>
          <ContactLine content={content} />
          <InternationalDetails content={content} />
        </div>
        {config.photo && <Photo url={content.photo_url} />}
      </header>

      <Sections content={content} accent={config.accent} compact={config.compact} />

      {content.skills.length > 0 && (
        <section className={config.compact ? "mt-3" : "mt-5"}>
          <Heading accent={config.accent}>Skills</Heading>
          <p className="mt-2 text-sm text-slate-700">{content.skills.join(" · ")}</p>
        </section>
      )}

      {content.languages.length > 0 && (
        <section className={config.compact ? "mt-3" : "mt-5"}>
          <Heading accent={config.accent}>Languages</Heading>
          <p className="mt-2 text-sm text-slate-700">{content.languages.join(" · ")}</p>
        </section>
      )}
    </div>
  );
}

function SidebarLayout({ content, config }: { content: ResumeContent; config: TemplateConfig }) {
  return (
    <div
      id="resume-preview"
      className={`mx-auto flex w-full max-w-[8.5in] bg-white text-slate-900 print:p-0 ${config.font}`}
    >
      <aside
        className="w-[34%] shrink-0 space-y-5 p-6"
        style={{ backgroundColor: config.accentSoft }}
      >
        <div className="flex flex-col items-center text-center">
          <Photo url={content.photo_url} size={96} />
          <h1 className="mt-3 text-xl font-bold">{content.full_name || "Your Name"}</h1>
        </div>
        <div className="space-y-1 text-xs text-slate-600">
          {[content.email, content.phone, content.location, content.website]
            .filter(Boolean)
            .map((item, i) => (
              <p key={i} className="break-words">
                {item}
              </p>
            ))}
          {[
            content.nationality && `Nationality: ${content.nationality}`,
            content.visa_status && `Visa: ${content.visa_status}`,
            content.date_of_birth && `DOB: ${content.date_of_birth}`,
            content.marital_status && `Marital status: ${content.marital_status}`,
          ]
            .filter(Boolean)
            .map((item, i) => (
              <p key={i} className="break-words text-slate-500">
                {item}
              </p>
            ))}
        </div>
        {content.skills.length > 0 && (
          <div>
            <Heading accent={config.accent}>Skills</Heading>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {content.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        {content.languages.length > 0 && (
          <div>
            <Heading accent={config.accent}>Languages</Heading>
            <p className="mt-2 text-xs text-slate-700">{content.languages.join(" · ")}</p>
          </div>
        )}
      </aside>
      <main className="flex-1 p-8">
        <Sections content={content} accent={config.accent} />
      </main>
    </div>
  );
}

export function ResumePreview({
  content,
  template,
}: {
  content: ResumeContent;
  template: string;
}) {
  const config = RESUME_TEMPLATES.find((t) => t.id === template) ?? RESUME_TEMPLATES[0];

  if (config.layout === "sidebar") {
    return <SidebarLayout content={content} config={config} />;
  }
  return <SingleLayout content={content} config={config} />;
}
