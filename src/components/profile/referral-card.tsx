import { Gift } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";

export function ReferralCard({
  referralCode,
  unredeemedDiscounts,
}: {
  referralCode: string;
  unredeemedDiscounts: number;
}) {
  const link = `https://resumehub.co.za/signup?ref=${referralCode}`;
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <Gift className="h-4 w-4 text-brand-600" />
        <p className="text-sm text-slate-500">
          Refer a friend to Resume Hub — when they complete a paid WhatsApp CV/LinkedIn order,
          you get 20% off your next one.
        </p>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {link}
        </code>
        <CopyButton text={link} />
      </div>
      {unredeemedDiscounts > 0 && (
        <p className="mt-2 text-xs font-medium text-emerald-700">
          You have {unredeemedDiscounts} unused discount code{unredeemedDiscounts === 1 ? "" : "s"} — mention
          one on your next WhatsApp order.
        </p>
      )}
    </div>
  );
}
