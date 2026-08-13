"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUp, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import type { ProfileRole } from "@/types/database";

const TITLE_OPTIONS = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Prof"];

const initialState: AuthActionState = {};

export function SignupForm({
  redirectTo,
  initialError,
}: {
  redirectTo: string;
  initialError?: string;
}) {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const [role, setRole] = useState<ProfileRole>("candidate");
  const error = state.error ?? initialError;

  if (state.message) {
    return <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">{state.message}</p>;
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect" value={redirectTo} />
      <div>
        <Label>I am a…</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["candidate", "employer"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRole(option)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                role === option
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {option === "candidate" ? "Job seeker" : "Employer"}
            </button>
          ))}
        </div>
        <input type="hidden" name="role" value={role} />
      </div>

      <OAuthButtons redirectTo={redirectTo} role={role as "candidate" | "employer"} />

      <div>
        <Label htmlFor="title">Title</Label>
        <Select id="title" name="title" defaultValue="">
          <option value="">Prefer not to say</option>
          {TITLE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="first_name">Name</Label>
          <Input id="first_name" name="first_name" autoComplete="given-name" required />
        </div>
        <div>
          <Label htmlFor="surname">Surname</Label>
          <Input id="surname" name="surname" autoComplete="family-name" required />
        </div>
      </div>
      <div>
        <Label htmlFor="phone_number">Phone</Label>
        <Input
          id="phone_number"
          name="phone_number"
          type="tel"
          autoComplete="tel"
          placeholder="e.g. 082 123 4567"
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-500">
          Sign in
        </Link>
      </p>
    </form>
  );
}
