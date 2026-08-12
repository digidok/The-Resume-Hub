"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";

const initialState: AuthActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  if (state.message) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-slate-700">{state.message}</p>
        <Link href="/login" className="text-sm font-medium text-brand-600 hover:text-brand-500">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-slate-600">
        <Link href="/login" className="font-medium text-brand-600 hover:text-brand-500">
          Back to login
        </Link>
      </p>
    </form>
  );
}
