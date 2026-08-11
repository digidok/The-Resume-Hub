"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUp, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import type { ProfileRole } from "@/types/database";

const initialState: AuthActionState = {};

export function SignupForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const [role, setRole] = useState<ProfileRole>("candidate");

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
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {option === "candidate" ? "Job seeker" : "Employer"}
            </button>
          ))}
        </div>
        <input type="hidden" name="role" value={role} />
      </div>
      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" autoComplete="name" required />
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
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Sign in
        </Link>
      </p>
    </form>
  );
}
