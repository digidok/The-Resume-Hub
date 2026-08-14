"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SUBSCRIPTION_PACKAGES } from "@/lib/payfast/config";

export async function requestInvoice(input: {
  packageId: string;
  companyName: string;
  contactPerson: string;
  billingEmail: string;
  vatNumber?: string;
  billingAddress?: string;
  notes?: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "employer") {
    return { error: "Only employer accounts can request an invoice." };
  }

  const pkg = SUBSCRIPTION_PACKAGES.find((p) => p.id === input.packageId && p.role === "employer");
  if (!pkg) {
    return { error: "Unknown product." };
  }

  const companyName = input.companyName.trim();
  const contactPerson = input.contactPerson.trim();
  const billingEmail = input.billingEmail.trim();
  if (!companyName || !contactPerson || !billingEmail) {
    return { error: "Company name, contact person, and billing email are required." };
  }

  const { error } = await supabase.from("invoice_requests").insert({
    employer_id: user.id,
    package_id: pkg.id,
    amount_zar: pkg.amountZar,
    company_name: companyName,
    contact_person: contactPerson,
    billing_email: billingEmail,
    vat_number: input.vatNumber?.trim() || null,
    billing_address: input.billingAddress?.trim() || null,
    notes: input.notes?.trim() || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/subscription");
  return {};
}
