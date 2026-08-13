import type { ResumeContent } from "@/types/database";

type TemplateConfig = {
  id: string;
  label: string;
  layout: "single" | "sidebar" | "executive" | "portfolio";
  photo: boolean;
  font: "font-serif" | "font-sans";
  compact?: boolean;
  accent: string;
  accentSoft: string;
  /** Secondary accent (e.g. a gold highlight) — only used by the executive/portfolio layouts. */
  accent2?: string;
  /** "pro" templates are only selectable on a Pro subscription — see hasUnlimitedCredits. */
  tier: "free" | "pro";
};

export const RESUME_TEMPLATES: TemplateConfig[] = [
  {
    id: "professional",
    label: "Professional",
    layout: "executive",
    photo: true,
    font: "font-serif",
    accent: "#0f1e38",
    accentSoft: "#f3ead9",
    accent2: "#b8933f",
    tier: "free",
  },
  { id: "classic", label: "Classic", layout: "single", photo: false, font: "font-serif", accent: "#0f172a", accentSoft: "#f1f5f9", tier: "free" },
  { id: "classic-photo", label: "Classic with Photo", layout: "single", photo: true, font: "font-serif", accent: "#0f172a", accentSoft: "#f1f5f9", tier: "free" },
  { id: "minimal", label: "Minimal", layout: "single", photo: false, font: "font-sans", accent: "#64748b", accentSoft: "#f8fafc", tier: "free" },
  { id: "modern", label: "Modern Turquoise", layout: "single", photo: false, font: "font-sans", accent: "#0d9488", accentSoft: "#eafffc", tier: "pro" },
  { id: "modern-photo", label: "Modern Turquoise with Photo", layout: "single", photo: true, font: "font-sans", accent: "#0d9488", accentSoft: "#eafffc", tier: "pro" },
  { id: "bold-coral", label: "Bold Coral", layout: "single", photo: false, font: "font-sans", accent: "#f2602c", accentSoft: "#fff3ee", tier: "pro" },
  { id: "compact", label: "Compact", layout: "single", photo: false, font: "font-sans", compact: true, accent: "#334155", accentSoft: "#f8fafc", tier: "pro" },
  { id: "sidebar-professional", label: "Sidebar Professional", layout: "sidebar", photo: true, font: "font-sans", accent: "#0d9488", accentSoft: "#eafffc", tier: "pro" },
  { id: "sidebar-charcoal", label: "Sidebar Charcoal", layout: "sidebar", photo: true, font: "font-sans", accent: "#1e293b", accentSoft: "#f1f5f9", tier: "pro" },
  { id: "sidebar-coral", label: "Sidebar Coral", layout: "sidebar", photo: true, font: "font-sans", accent: "#f2602c", accentSoft: "#fff3ee", tier: "pro" },
  {
    id: "executive-portfolio",
    label: "Executive Portfolio",
    layout: "portfolio",
    photo: true,
    font: "font-serif",
    accent: "#0f1e38",
    accentSoft: "#f3ead9",
    accent2: "#b8933f",
    tier: "pro",
  },
  {
    id: "executive-portfolio-no-photo",
    label: "Executive Portfolio (No Photo)",
    layout: "portfolio",
    photo: false,
    font: "font-serif",
    accent: "#0f1e38",
    accentSoft: "#f3ead9",
    accent2: "#b8933f",
    tier: "pro",
  },
];

function formatRange(start?: string, end?: string, current?: boolean) {
  const parts = [start, current ? "Present" : end].filter(Boolean);
  return parts.join(" — ");
}

function extractYear(dateStr?: string): number | null {
  if (!dateStr) return null;
  const match = dateStr.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : null;
}

/** Best-effort span in years across all experience entries — dates are free-text, so this
 * only returns a number when at least two distinct years can actually be parsed out. */
function computeYearsExperience(experience: ResumeContent["experience"]): number | null {
  const years = experience.flatMap((exp) => {
    const start = extractYear(exp.start_date);
    const end = exp.current ? new Date().getFullYear() : extractYear(exp.end_date);
    return [start, end].filter((y): y is number => y !== null);
  });
  if (years.length < 2) return null;
  const span = Math.max(...years) - Math.min(...years);
  return span > 0 ? span : null;
}

/** First bullet line from each of the most recent few experience entries, for a
 * "career highlights" strip — never invents text, only reuses what's already there. */
function getCareerHighlights(experience: ResumeContent["experience"], max = 4): string[] {
  return experience
    .map((exp) => exp.description?.split("\n").map((l) => l.trim()).find(Boolean))
    .filter((line): line is string => Boolean(line))
    .slice(0, max);
}

/** Splits a summary paragraph into standalone sentences for a bulleted "profile" list —
 * never rewrites or invents text, only breaks it at existing sentence boundaries. */
function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
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
              <div key={exp.id} className="break-inside-avoid">
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
              <div key={edu.id} className="break-inside-avoid">
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
              <div key={project.id} className="break-inside-avoid">
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

      {content.certifications.length > 0 && (
        <section className={config.compact ? "mt-3" : "mt-5"}>
          <Heading accent={config.accent}>Certifications</Heading>
          <p className="mt-2 text-sm text-slate-700">{content.certifications.join(" · ")}</p>
        </section>
      )}

      {content.awards.length > 0 && (
        <section className={config.compact ? "mt-3" : "mt-5"}>
          <Heading accent={config.accent}>Awards & Honors</Heading>
          <p className="mt-2 text-sm text-slate-700">{content.awards.join(" · ")}</p>
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
        {content.certifications.length > 0 && (
          <div>
            <Heading accent={config.accent}>Certifications</Heading>
            <p className="mt-2 text-xs text-slate-700">{content.certifications.join(" · ")}</p>
          </div>
        )}
        {content.awards.length > 0 && (
          <div>
            <Heading accent={config.accent}>Awards & Honors</Heading>
            <p className="mt-2 text-xs text-slate-700">{content.awards.join(" · ")}</p>
          </div>
        )}
      </aside>
      <main className="flex-1 p-8">
        <Sections content={content} accent={config.accent} />
      </main>
    </div>
  );
}

function ExecutiveHeading({ children, gold }: { children: React.ReactNode; gold: string }) {
  return (
    <h2
      className="border-b-2 pb-1 text-xs font-bold uppercase tracking-wide text-[#0f1e38]"
      style={{ borderColor: gold }}
    >
      {children}
    </h2>
  );
}

function ExecutiveLayout({ content, config }: { content: ResumeContent; config: TemplateConfig }) {
  const navy = config.accent;
  const gold = config.accent2 ?? "#b8933f";
  const cream = config.accentSoft;

  const roleTags = [...new Set(content.experience.map((e) => e.title).filter(Boolean))].slice(
    0,
    3
  ) as string[];
  const yearsExperience = computeYearsExperience(content.experience);
  const stats = [
    yearsExperience !== null && { value: `${yearsExperience}+`, label: "Years Experience" },
    content.experience.length > 0 && { value: String(content.experience.length), label: "Employers" },
    content.skills.length > 0 && { value: String(content.skills.length), label: "Core Skills" },
  ].filter(Boolean) as { value: string; label: string }[];
  const highlights = getCareerHighlights(content.experience);

  return (
    <div
      id="resume-preview"
      className={`mx-auto w-full max-w-[8.5in] bg-white text-slate-900 print:p-0 ${config.font}`}
    >
      <header
        className="flex flex-wrap items-center gap-5 px-10 py-8"
        style={{ backgroundColor: navy }}
      >
        {config.photo && content.photo_url && (
          <div className="shrink-0 rounded-full p-1" style={{ backgroundColor: gold }}>
            <Photo url={content.photo_url} size={80} />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wide text-white">
            {(content.full_name ?? "Your Name").split(" ").slice(0, -1).join(" ")}{" "}
            <span style={{ color: gold }}>
              {(content.full_name ?? "Your Name").split(" ").slice(-1)}
            </span>
          </h1>
          {roleTags.length > 0 && (
            <p className="mt-1 text-sm italic text-white/80">{roleTags.join("  |  ")}</p>
          )}
        </div>
      </header>

      <div
        className="flex flex-wrap justify-center gap-x-6 gap-y-1 px-10 py-3 text-center text-sm font-medium text-slate-700"
        style={{ backgroundColor: cream }}
      >
        {[content.location, content.phone, content.email, content.website, content.nationality]
          .filter(Boolean)
          .map((item, i) => (
            <span key={i}>{item}</span>
          ))}
      </div>

      <div className="px-10 py-6">
        {content.summary && (
          <p className="text-sm leading-relaxed whitespace-pre-line">{content.summary}</p>
        )}
        {content.skills.length > 0 && (
          <p className="mt-3 text-sm italic text-slate-600">
            {content.skills.slice(0, 6).join("  |  ")}
          </p>
        )}
      </div>

      {stats.length > 0 && (
        <div className="flex flex-wrap justify-around gap-4 px-10 py-5 text-center" style={{ backgroundColor: navy }}>
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold" style={{ color: gold }}>
                {stat.value}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-white/70">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-6 px-10 py-6">
        {highlights.length > 0 && (
          <section>
            <ExecutiveHeading gold={gold}>Career Highlights</ExecutiveHeading>
            <div className="mt-3 space-y-2">
              {highlights.map((line, i) => (
                <p
                  key={i}
                  className="border-l-4 py-2 pl-3 text-sm leading-relaxed"
                  style={{ backgroundColor: cream, borderColor: gold }}
                >
                  {line}
                </p>
              ))}
            </div>
          </section>
        )}

        {content.skills.length > 0 && (
          <section className="-mx-10 px-10 py-6" style={{ backgroundColor: navy }}>
            <h2 className="border-b-2 pb-1 text-xs font-bold uppercase tracking-wide text-white" style={{ borderColor: gold }}>
              Core Competencies
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-center text-sm text-white sm:grid-cols-3">
              {content.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
          </section>
        )}

        {content.experience.length > 0 && (
          <section>
            <ExecutiveHeading gold={gold}>Professional Experience</ExecutiveHeading>
            <div className="mt-3 space-y-4">
              {content.experience.map((exp) => (
                <div key={exp.id} className="break-inside-avoid">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <p className="text-sm font-bold">{exp.title || "Role"}</p>
                    <p className="text-xs font-semibold" style={{ color: gold }}>
                      {formatRange(exp.start_date, exp.end_date, exp.current)}
                    </p>
                  </div>
                  {exp.company && (
                    <p className="text-sm italic text-slate-600">
                      {exp.company}
                      {exp.location ? ` — ${exp.location}` : ""}
                    </p>
                  )}
                  {exp.description && (
                    <ul className="mt-1.5 space-y-1">
                      {exp.description
                        .split("\n")
                        .map((l) => l.trim())
                        .filter(Boolean)
                        .map((line, i) => (
                          <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: gold }} />
                            {line}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {content.education.length > 0 && (
          <section>
            <ExecutiveHeading gold={gold}>Education</ExecutiveHeading>
            <div className="mt-3 space-y-2">
              {content.education.map((edu) => (
                <div key={edu.id} className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className="text-sm font-semibold">
                    {edu.degree ? `${edu.degree}${edu.field ? `: ${edu.field}` : ""}` : edu.school}
                  </p>
                  <p className="text-xs font-semibold" style={{ color: gold }}>
                    {formatRange(edu.start_date, edu.end_date)}
                  </p>
                  {edu.degree && <p className="w-full text-xs text-slate-500">{edu.school}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {(content.certifications.length > 0 || content.awards.length > 0) && (
          <section>
            <ExecutiveHeading gold={gold}>Certifications & Awards</ExecutiveHeading>
            <p className="mt-3 text-sm text-slate-700">
              {[...content.certifications, ...content.awards].join("  |  ")}
            </p>
          </section>
        )}

        {(content.languages.length > 0 ||
          content.nationality ||
          content.visa_status ||
          content.marital_status) && (
          <section>
            <ExecutiveHeading gold={gold}>Additional Information</ExecutiveHeading>
            <div className="mt-3 space-y-1 text-sm text-slate-700">
              {content.languages.length > 0 && (
                <p>
                  <span className="font-semibold">Languages: </span>
                  {content.languages.join(", ")}
                </p>
              )}
              {content.nationality && (
                <p>
                  <span className="font-semibold">Nationality: </span>
                  {content.nationality}
                </p>
              )}
              {content.visa_status && (
                <p>
                  <span className="font-semibold">Visa status: </span>
                  {content.visa_status}
                </p>
              )}
              {content.marital_status && (
                <p>
                  <span className="font-semibold">Marital status: </span>
                  {content.marital_status}
                </p>
              )}
            </div>
          </section>
        )}
      </div>

      <div className="border-t-2 px-10 py-3 text-center text-xs text-slate-500" style={{ borderColor: gold }}>
        {[content.full_name, content.phone, content.email].filter(Boolean).join("  |  ")}
      </div>
    </div>
  );
}

function PortfolioLayout({ content, config }: { content: ResumeContent; config: TemplateConfig }) {
  const navy = config.accent;
  const gold = config.accent2 ?? "#b8933f";
  const cream = config.accentSoft;

  const roleTags = [...new Set(content.experience.map((e) => e.title).filter(Boolean))].slice(
    0,
    3
  ) as string[];
  const yearsExperience = computeYearsExperience(content.experience);
  const profileBullets = content.summary ? splitIntoSentences(content.summary) : [];
  const highlights = getCareerHighlights(content.experience);
  const credentials = [...content.certifications, ...content.awards];

  return (
    <div
      id="resume-preview"
      className={`mx-auto w-full max-w-[8.5in] bg-white text-slate-900 print:p-0 ${config.font}`}
    >
      <header className="flex flex-wrap items-center justify-between gap-5 px-10 pb-6 pt-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: gold }}>
            Executive Portfolio
          </p>
          <h1 className="mt-1 text-3xl font-bold uppercase tracking-wide" style={{ color: navy }}>
            {content.full_name || "Your Name"}
          </h1>
          {roleTags.length > 0 && (
            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {roleTags.join("  •  ")}
            </p>
          )}
        </div>
        {config.photo && content.photo_url && (
          <div className="shrink-0 rounded-full p-1" style={{ backgroundColor: gold }}>
            <Photo url={content.photo_url} size={88} />
          </div>
        )}
      </header>

      <div className="border-t" style={{ borderColor: gold }} />

      {content.skills.length > 0 && (
        <div className="px-10 py-5" style={{ backgroundColor: cream }}>
          <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-center text-sm font-semibold sm:grid-cols-3" style={{ color: navy }}>
            {content.skills.slice(0, 9).map((skill) => (
              <span key={skill}>{skill}</span>
            ))}
          </div>
        </div>
      )}

      {yearsExperience !== null && (
        <div className="px-10 py-4 text-center" style={{ backgroundColor: gold }}>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-white">
            {yearsExperience}+ Years of Professional Experience
          </p>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 px-10 py-3 text-center text-sm text-slate-600">
        {[content.location, content.phone, content.email, content.website]
          .filter(Boolean)
          .map((item, i) => (
            <span key={i}>{item}</span>
          ))}
      </div>

      <div className="space-y-6 px-10 pb-8">
        {profileBullets.length > 0 && (
          <section>
            <ExecutiveHeading gold={gold}>Executive Profile</ExecutiveHeading>
            <ul className="mt-3 space-y-1.5">
              {profileBullets.map((line, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: gold }} />
                  {line}
                </li>
              ))}
            </ul>
          </section>
        )}

        {highlights.length > 0 && (
          <section className="border-l-4 py-3 pl-4" style={{ backgroundColor: cream, borderColor: gold }}>
            <h2 className="text-xs font-bold uppercase tracking-wide" style={{ color: navy }}>
              Career Highlights
            </h2>
            <ul className="mt-2 space-y-1.5">
              {highlights.map((line, i) => (
                <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: gold }} />
                  {line}
                </li>
              ))}
            </ul>
          </section>
        )}

        {content.skills.length > 0 && (
          <section>
            <ExecutiveHeading gold={gold}>Core Competencies</ExecutiveHeading>
            <div
              className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 rounded-md border p-4 text-center text-sm sm:grid-cols-3"
              style={{ borderColor: gold, color: navy }}
            >
              {content.skills.map((skill) => (
                <span key={skill} className="font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {content.experience.length > 0 && (
          <section>
            <ExecutiveHeading gold={gold}>Professional Experience</ExecutiveHeading>
            <div className="mt-3 space-y-5">
              {content.experience.map((exp) => (
                <div key={exp.id} className="border-l-4 pl-4 break-inside-avoid" style={{ borderColor: gold }}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <p className="text-sm font-bold" style={{ color: navy }}>
                      {exp.title || "Role"}
                    </p>
                    <p className="text-xs font-semibold" style={{ color: gold }}>
                      {formatRange(exp.start_date, exp.end_date, exp.current)}
                    </p>
                  </div>
                  {exp.company && (
                    <p className="text-sm italic text-slate-600">
                      {exp.company}
                      {exp.location ? ` — ${exp.location}` : ""}
                    </p>
                  )}
                  {exp.description && (
                    <ul className="mt-1.5 space-y-1">
                      {exp.description
                        .split("\n")
                        .map((l) => l.trim())
                        .filter(Boolean)
                        .map((line, i) => (
                          <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                            <span style={{ color: gold }}>—</span>
                            {line}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {content.education.length > 0 && (
          <section>
            <ExecutiveHeading gold={gold}>Education</ExecutiveHeading>
            <div className="mt-3 space-y-2">
              {content.education.map((edu) => (
                <div key={edu.id} className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className="text-sm font-semibold">
                    {edu.degree ? `${edu.degree}${edu.field ? `: ${edu.field}` : ""}` : edu.school}
                  </p>
                  <p className="text-xs font-semibold" style={{ color: gold }}>
                    {formatRange(edu.start_date, edu.end_date)}
                  </p>
                  {edu.degree && <p className="w-full text-xs text-slate-500">{edu.school}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {credentials.length > 0 && (
          <section className="border-l-4 py-3 pl-4" style={{ backgroundColor: cream, borderColor: gold }}>
            <h2 className="text-xs font-bold uppercase tracking-wide" style={{ color: navy }}>
              Certifications &amp; Awards
            </h2>
            <ul className="mt-2 space-y-1">
              {credentials.map((item, i) => (
                <li key={i} className="text-sm font-semibold text-slate-700">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {(content.languages.length > 0 ||
          content.nationality ||
          content.visa_status ||
          content.marital_status) && (
          <section>
            <ExecutiveHeading gold={gold}>Additional Information</ExecutiveHeading>
            <div className="mt-3 space-y-1 text-sm text-slate-700">
              {content.languages.length > 0 && (
                <p>
                  <span className="font-semibold">Languages: </span>
                  {content.languages.join(", ")}
                </p>
              )}
              {content.nationality && (
                <p>
                  <span className="font-semibold">Nationality: </span>
                  {content.nationality}
                </p>
              )}
              {content.visa_status && (
                <p>
                  <span className="font-semibold">Visa status: </span>
                  {content.visa_status}
                </p>
              )}
              {content.marital_status && (
                <p>
                  <span className="font-semibold">Marital status: </span>
                  {content.marital_status}
                </p>
              )}
            </div>
          </section>
        )}
      </div>

      <div className="border-t-2 px-10 py-3 text-center text-xs text-slate-500" style={{ borderColor: gold }}>
        {[content.full_name, content.phone, content.email].filter(Boolean).join("  |  ")}
      </div>
    </div>
  );
}

function PreviewWatermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 flex flex-wrap content-around justify-around overflow-hidden opacity-[0.08]"
    >
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className="-rotate-[30deg] whitespace-nowrap text-lg font-bold uppercase tracking-widest text-slate-900"
        >
          Upgrade to download
        </span>
      ))}
    </div>
  );
}

export function ResumePreview({
  content,
  template,
  watermark = false,
}: {
  content: ResumeContent;
  template: string;
  /** Shown for free-plan candidates on the live preview, since print/PDF
   * export is Pro-gated but the on-screen preview still can't be stopped
   * from being screenshotted — this makes a screenshot low-value instead. */
  watermark?: boolean;
}) {
  const config = RESUME_TEMPLATES.find((t) => t.id === template) ?? RESUME_TEMPLATES[0];

  const layout =
    config.layout === "sidebar" ? (
      <SidebarLayout content={content} config={config} />
    ) : config.layout === "executive" ? (
      <ExecutiveLayout content={content} config={config} />
    ) : config.layout === "portfolio" ? (
      <PortfolioLayout content={content} config={config} />
    ) : (
      <SingleLayout content={content} config={config} />
    );

  if (!watermark) return layout;

  return (
    <div className="relative">
      {layout}
      <PreviewWatermark />
    </div>
  );
}
