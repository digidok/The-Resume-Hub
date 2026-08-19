"use client";

import { useActionState } from "react";
import { updatePassword, type AuthActionState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";

const initialState: AuthActionState = {};

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="password">New password</Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" required />
      </div>
      <div>
        <Label htmlFor="confirm_password">Confirm new password</Label>
        <PasswordInput
          id="confirm_password"
          name="confirm_password"
          autoComplete="new-password"
          required
        />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
