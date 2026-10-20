import Link from "next/link";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { ServicesMark } from "@/components/services/services-header";

export function ServicesFooter({ whatsappUrl }: { whatsappUrl: string }) {
  return (
    <footer className="bg-brand-950 text-slate-400">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <ServicesMark />
              <div className="leading-tight">
                <p className="text-lg font-bold text-white">Resume Document Hub</p>
                <p className="text-[11px] font-medium uppercase tracking-widest text-accent-400">
                  Single Point of Contact
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm">
              Virtual assistants for business administration, executive secretariat, board support
              and governance documentation, delivered with precision, discretion and
              accountability.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-300">Services</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#corporate" className="hover:text-white">
                  Corporate &amp; boards
                </a>
              </li>
              <li>
                <a href="#studio" className="hover:text-white">
                  Document Studio
                </a>
              </li>
              <li>
                <a href="#small-business" className="hover:text-white">
                  Small business &amp; start-ups
                </a>
              </li>
              <li>
                <a href="#process" className="hover:text-white">
                  How it works
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-300">Contact</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                Sandton, Johannesburg
              </li>
              <li>
                <a href="mailto:info@resumehub.co.za" className="flex items-start gap-2 hover:text-white">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                  info@resumehub.co.za
                </a>
              </li>
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-2 hover:text-white"
                >
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-accent-400" />
                  WhatsApp us
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Resume Document Hub</p>
          <p>
            Looking for a CV or job search help?{" "}
            <Link href="/" className="text-slate-300 underline-offset-2 hover:text-white hover:underline">
              Visit Resume Hub
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
