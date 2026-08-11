import { SiteHeader } from "@/components/site-header";

export default function JobsLayout({ children }: LayoutProps<"/jobs">) {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1 bg-slate-50">{children}</main>
    </div>
  );
}
