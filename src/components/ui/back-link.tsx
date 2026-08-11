import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
