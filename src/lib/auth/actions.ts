"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isFreeEmailDomain } from "@/lib/auth/free-email-domains";
import type { ProfileRole } from "@/types/database";

export type AuthActionState = {
  error?: string;
  message?: string;
};

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const surname = String(formData.get("surname") ?? "").trim();
  const fullName = [firstName, surname].filter(Boolean).join(" ");
  const phoneNumber = String(formData.get("phone_number") ?? "").trim();
  const role = String(formData.get("role") ?? "candidate") as ProfileRole;
  const redirectTo = String(formData.get("redirect") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (!firstName || !surname) {
    return { error: "Name and surname are required." };
  }
  if (!phoneNumber) {
    return { error: "Phone number is required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (role !== "candidate" && role !== "employer") {
    return { error: "Invalid account type." };
  }
  if (role === "employer" && isFreeEmailDomain(email)) {
    return {
      error:
        "Please sign up with your company email address — personal email addresses (Gmail, Yahoo, Outlook, etc.) aren't allowed for employer accounts.",
    };
  }

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const siteUrl = `${protocol}://${host}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, title: title || null, phone_number: phoneNumber, role },
      emailRedirectTo: `${siteUrl}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return {
      message:
        "Check your email to confirm your account before signing in.",
    };
  }

  redirect(redirectTo);
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  redirect(redirectTo);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Enter your email address." };
  }

  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const siteUrl = `${protocol}://${host}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?redirect=${encodeURIComponent("/auth/reset-password")}`,
  });

  // Supabase doesn't reveal whether the email exists, so this message stays
  // generic either way — that's what keeps it from leaking which emails
  // have accounts.
  if (error) {
    return { error: error.message };
  }
  return { message: "If an account exists for that email, we've sent a password reset link." };
}

export async function updatePassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "This reset link has expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
