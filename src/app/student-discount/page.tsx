import Link from "next/link";
import { GraduationCap, MessageCircle, Mail, Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PERKS = [
  "50% off Candidate Pro for the length of your studies",
  "Full access to AI resume review, auto-apply, and mock interviews",
  "Priority WhatsApp support from our human CV team",
];

export const metadata = {
  title: "Student Discount — Resume Hub",
};

export default function StudentDiscountPage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-brand-500 to-accent-500 py-16 text-white">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
              <GraduationCap className="h-6 w-6" />
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Student discount</h1>
            <p className="mx-auto mt-3 max-w-xl text-white/90">
              Still studying or a recent graduate? Get half off Resume Hub Pro while you&apos;re job
              hunting and building your career.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16">
          <Card className="p-8">
            <h2 className="text-lg font-semibold text-slate-900">What you get</h2>
            <ul className="mt-4 space-y-2.5">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  {perk}
                </li>
              ))}
            </ul>

            <h2 className="mt-8 text-lg font-semibold text-slate-900">How to redeem</h2>
            <p className="mt-2 text-sm text-slate-600">
              Send us a photo of your valid student card, proof of enrolment, or graduation
              certificate (within the last 12 months) via WhatsApp or email, and our team will send
              you a discount code to apply at checkout.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="https://wa.me/27693391915" target="_blank" rel="noreferrer">
                <Button size="lg">
                  <MessageCircle className="h-4 w-4" />
                  Send proof on WhatsApp
                </Button>
              </a>
              <a href="mailto:info@resumehub.co.za?subject=Student%20discount">
                <Button size="lg" variant="outline">
                  <Mail className="h-4 w-4" />
                  Email us instead
                </Button>
              </a>
            </div>
            <p className="mt-6 text-xs text-slate-400">
              One discount code per student, valid for the duration of your studies. We manually
              verify each request — expect a reply within a business day.
            </p>
          </Card>
          <p className="mt-6 text-center text-sm text-slate-500">
            Not a student?{" "}
            <Link href="/dashboard/subscription" className="font-medium text-brand-700 hover:text-brand-600">
              See our regular plans
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
