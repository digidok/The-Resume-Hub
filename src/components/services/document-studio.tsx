"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, FileUp, ImagePlus, Loader2, MessageCircle, Mic, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { whatsappLink } from "@/lib/whatsapp-contacts";
import {
  DOCUMENT_GROUPS,
  TEMPLATE_STYLES,
  UPLOAD_RULES,
  documentLabel,
  type FileDescriptor,
  type UploadKind,
} from "@/lib/studio/catalog";

type Picked = { kind: UploadKind; file: File };

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";
const labelClass = "mb-1 block text-sm font-medium text-slate-700";

function formatSize(bytes: number) {
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

function StepTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-3 text-base font-semibold text-slate-900">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-900 text-xs font-bold text-accent-400">
        {n}
      </span>
      {children}
    </h3>
  );
}

export function DocumentStudio() {
  const [documentType, setDocumentType] = useState("");
  const [templateStyle, setTemplateStyle] = useState(TEMPLATE_STYLES[0].id);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [deadline, setDeadline] = useState("");
  const [brief, setBrief] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [picked, setPicked] = useState<Picked[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ reference: string; failed: string[] } | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const style = TEMPLATE_STYLES.find((t) => t.id === templateStyle) ?? TEMPLATE_STYLES[0];
  const isTranscription = documentType === "transcription";
  const wantsRecording = isTranscription || documentType === "minutes";
  const logoFile = picked.find((p) => p.kind === "logo")?.file;
  const recordingFile = picked.find((p) => p.kind === "recording")?.file;
  const supporting = picked.filter((p) => p.kind === "supporting");

  const logoUrl = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : null), [logoFile]);
  useEffect(() => {
    return () => {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
    };
  }, [logoUrl]);

  const docTitle = useMemo(() => (documentType ? documentLabel(documentType) : "Your document"), [documentType]);

  function addFiles(kind: UploadKind, list: FileList | null) {
    if (!list || list.length === 0) return;
    const rules = UPLOAD_RULES[kind];
    setError(null);
    const next = picked.filter((p) => (kind === "supporting" ? true : p.kind !== kind));
    let count = next.filter((p) => p.kind === kind).length;
    for (const file of Array.from(list)) {
      if (file.size > rules.maxBytes) {
        setError(`"${file.name}" is too large. ${rules.label} files must be under ${Math.round(rules.maxBytes / 1048576)}MB.`);
        continue;
      }
      if (!rules.mimes.includes(file.type)) {
        setError(`"${file.name}" is not a supported ${rules.label.toLowerCase()} file type.`);
        continue;
      }
      if (count >= rules.maxFiles) {
        setError(`You can add up to ${rules.maxFiles} ${rules.label.toLowerCase()} file${rules.maxFiles > 1 ? "s" : ""}.`);
        break;
      }
      next.push({ kind, file });
      count += 1;
    }
    setPicked(next);
  }

  function removeFile(target: File) {
    setPicked((prev) => prev.filter((p) => p.file !== target));
  }

  async function submit() {
    setError(null);
    if (!documentType) return setError("Please choose the document you need.");
    if (isTranscription && !recordingFile) return setError("Please upload the recording to be transcribed.");
    if (!companyName.trim() || !contactName.trim()) return setError("Please enter your company and your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Please enter a valid email address.");

    setBusy(true);
    try {
      const descriptors: FileDescriptor[] = picked.map((p) => ({
        kind: p.kind,
        name: p.file.name,
        size: p.file.size,
        type: p.file.type,
      }));
      const res = await fetch("/api/studio-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          templateStyle,
          companyName,
          contactName,
          email,
          phone,
          deadline,
          brief,
          website,
          files: descriptors,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");

      const supabase = createClient();
      const failed: string[] = [];
      for (const up of data.uploads as { kind: UploadKind; name: string; path: string; token: string }[]) {
        const match = picked.find((p) => p.kind === up.kind && p.file.name === up.name);
        if (!match) continue;
        const { error: upError } = await supabase.storage
          .from("studio-uploads")
          .uploadToSignedUrl(up.path, up.token, match.file, { contentType: match.file.type });
        if (upError) failed.push(up.name);
      }
      const expected = descriptors.length;
      if ((data.uploads as unknown[]).length < expected) {
        for (const d of descriptors) {
          if (!(data.uploads as { name: string }[]).some((u) => u.name === d.name) && !failed.includes(d.name)) {
            failed.push(d.name);
          }
        }
      }
      setDone({ reference: data.reference, failed });
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    const followUp = whatsappLink("corporate", `Hi, I've submitted Document Studio request ${done.reference}.`);
    return (
      <div ref={formRef} className="rounded-md border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-brand-900 text-accent-400">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="mt-5 text-2xl font-bold text-slate-900">Request received</h3>
        <p className="mt-2 text-slate-600">
          Your reference is{" "}
          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono font-semibold text-slate-900">{done.reference}</span>.
          Your assistant will review your brief and reply to {email} with a scope and quote.
        </p>
        {done.failed.length > 0 && (
          <p className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {done.failed.length === 1 ? "One file" : `${done.failed.length} files`} did not upload ({done.failed.join(", ")}).
            Please send {done.failed.length === 1 ? "it" : "them"} to us on WhatsApp quoting your reference.
          </p>
        )}
        <a
          href={followUp}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <MessageCircle className="h-4 w-4" />
          Message us about {done.reference}
        </a>
      </div>
    );
  }

  return (
    <div ref={formRef} className="grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="space-y-8">
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <StepTitle n={1}>Choose your document</StepTitle>
          <div className="mt-5 space-y-5">
            {DOCUMENT_GROUPS.map((group) => (
              <fieldset key={group.id}>
                <legend className="text-xs font-semibold uppercase tracking-widest text-slate-500">{group.label}</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {group.options.map((opt) => {
                    const active = documentType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setDocumentType(opt.id)}
                        aria-pressed={active}
                        className={`rounded-md border p-3 text-left transition-colors ${
                          active
                            ? "border-brand-700 bg-brand-50 ring-1 ring-brand-700"
                            : "border-slate-200 hover:border-brand-300"
                        }`}
                      >
                        <span className="block text-sm font-semibold text-slate-900">{opt.label}</span>
                        <span className="mt-0.5 block text-xs text-slate-600">{opt.description}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <StepTitle n={2}>Select a template style</StepTitle>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TEMPLATE_STYLES.map((t) => {
              const active = templateStyle === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateStyle(t.id)}
                  aria-pressed={active}
                  className={`rounded-md border p-2 text-left transition-colors ${
                    active ? "border-brand-700 ring-1 ring-brand-700" : "border-slate-200 hover:border-brand-300"
                  }`}
                >
                  <span className="block h-20 overflow-hidden rounded-sm border border-slate-200" style={{ background: t.paper }}>
                    <span className="block h-4" style={{ background: t.primary }} />
                    <span className="mx-2 mt-2 block h-1.5 w-2/3 rounded-sm" style={{ background: t.primary }} />
                    <span className="mx-2 mt-1 block h-0.5 w-8" style={{ background: t.accent }} />
                    <span className="mx-2 mt-2 block h-1 rounded-sm bg-slate-200" />
                    <span className="mx-2 mt-1 block h-1 w-5/6 rounded-sm bg-slate-200" />
                  </span>
                  <span className="mt-2 block text-sm font-semibold text-slate-900">{t.label}</span>
                  <span className="block text-[11px] leading-snug text-slate-500">{t.note}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <StepTitle n={3}>Add your branding and material</StepTitle>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className={labelClass}>Company logo</p>
              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-600 hover:border-brand-400">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Your logo" className="h-10 w-10 rounded object-contain" />
                ) : (
                  <ImagePlus className="h-6 w-6 text-slate-400" />
                )}
                <span className="flex-1 truncate">{logoFile ? logoFile.name : "PNG, JPG, SVG or WebP, up to 5MB"}</span>
                {logoFile && (
                  <button
                    type="button"
                    aria-label="Remove logo"
                    onClick={(e) => {
                      e.preventDefault();
                      removeFile(logoFile);
                    }}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <input type="file" className="sr-only" accept={UPLOAD_RULES.logo.accept} onChange={(e) => { addFiles("logo", e.target.files); e.target.value = ""; }} />
              </label>
            </div>

            {wantsRecording && (
              <div>
                <p className={labelClass}>
                  Meeting recording{isTranscription ? " (required)" : " (optional)"}
                </p>
                <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-600 hover:border-brand-400">
                  <Mic className="h-6 w-6 text-slate-400" />
                  <span className="flex-1 truncate">{recordingFile ? `${recordingFile.name} (${formatSize(recordingFile.size)})` : "MP3, M4A, WAV or MP4, up to 50MB"}</span>
                  {recordingFile && (
                    <button type="button" aria-label="Remove recording" onClick={(e) => { e.preventDefault(); removeFile(recordingFile); }} className="text-slate-400 hover:text-slate-700">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <input type="file" className="sr-only" accept={UPLOAD_RULES.recording.accept} onChange={(e) => { addFiles("recording", e.target.files); e.target.value = ""; }} />
                </label>
                <p className="mt-1 text-xs text-slate-500">Transcribed by our team and treated as confidential.</p>
              </div>
            )}

            <div className="sm:col-span-2">
              <p className={labelClass}>Supporting documents (up to 3)</p>
              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-600 hover:border-brand-400">
                <FileUp className="h-6 w-6 text-slate-400" />
                <span className="flex-1">PDF, Word, Excel, PowerPoint or text, up to 20MB each</span>
                <input type="file" multiple className="sr-only" accept={UPLOAD_RULES.supporting.accept} onChange={(e) => { addFiles("supporting", e.target.files); e.target.value = ""; }} />
              </label>
              {supporting.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {supporting.map((p) => (
                    <li key={p.file.name + p.file.size} className="flex items-center justify-between rounded bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                      <span className="truncate">{p.file.name} ({formatSize(p.file.size)})</span>
                      <button type="button" aria-label={`Remove ${p.file.name}`} onClick={() => removeFile(p.file)} className="text-slate-400 hover:text-slate-700">
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <StepTitle n={4}>Tell us about the request</StepTitle>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="studio-company" className={labelClass}>Company</label>
              <input id="studio-company" className={inputClass} value={companyName} onChange={(e) => setCompanyName(e.target.value)} autoComplete="organization" maxLength={160} />
            </div>
            <div>
              <label htmlFor="studio-name" className={labelClass}>Your name</label>
              <input id="studio-name" className={inputClass} value={contactName} onChange={(e) => setContactName(e.target.value)} autoComplete="name" maxLength={120} />
            </div>
            <div>
              <label htmlFor="studio-email" className={labelClass}>Email</label>
              <input id="studio-email" type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={200} />
            </div>
            <div>
              <label htmlFor="studio-phone" className={labelClass}>Phone or WhatsApp (optional)</label>
              <input id="studio-phone" type="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" maxLength={40} />
            </div>
            <div>
              <label htmlFor="studio-deadline" className={labelClass}>Needed by (optional)</label>
              <input id="studio-deadline" type="date" className={inputClass} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="studio-brief" className={labelClass}>Brief</label>
              <textarea id="studio-brief" rows={5} className={inputClass} value={brief} onChange={(e) => setBrief(e.target.value)} maxLength={4000} placeholder="What is the document for, who will read it, and what must it cover?" />
            </div>
            <div className="hidden" aria-hidden="true">
              <label htmlFor="studio-website">Website</label>
              <input id="studio-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-md bg-brand-800 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy ? "Sending…" : "Submit request"}
            </button>
            <p className="max-w-md text-xs text-slate-500">
              Files are stored privately and used only to prepare your document. We reply with a scope and quote before any work begins.
            </p>
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Live preview</p>
        <div
          className="mt-3 aspect-[1/1.35] overflow-hidden rounded-md border border-slate-300 shadow-md"
          style={{ background: style.paper }}
        >
          <div className="flex h-14 items-center justify-between px-5" style={{ background: style.primary }}>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/80">
              {companyName.trim() || "Your company"}
            </span>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-8 max-w-[5rem] rounded-sm bg-white/90 object-contain p-0.5" />
            ) : (
              <span className="rounded-sm border border-dashed border-white/40 px-2 py-1 text-[10px] text-white/60">Logo</span>
            )}
          </div>
          <div className="px-5 pt-8">
            <p
              className="text-2xl font-bold leading-tight"
              style={{ color: style.primary, fontFamily: style.serif ? "Georgia, 'Times New Roman', serif" : undefined }}
            >
              {docTitle}
            </p>
            <span className="mt-3 block h-0.5 w-12" style={{ background: style.accent }} />
            <p className="mt-3 text-[11px] uppercase tracking-widest text-slate-500">
              Prepared for {companyName.trim() || "your company"}
            </p>
            <div className="mt-8 space-y-2">
              {[100, 92, 96, 70, 100, 88, 60].map((w, i) => (
                <span key={i} className="block h-1.5 rounded-sm bg-slate-200" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Indicative preview of the {style.label} style. Your assistant applies your logo and brand colours to the final document.
        </p>
      </aside>
    </div>
  );
}
