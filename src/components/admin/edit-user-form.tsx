"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Label } from "@/components/ui/field";
import { updateUserProfile, setUserPassword } from "@/lib/admin/actions";
import type { ProfileRole, ProfilePlan } from "@/types/database";

const ROLE_OPTIONS: ProfileRole[] = ["candidate", "employer", "admin"];
const PLAN_OPTIONS: ProfilePlan[] = ["free", "pro"];

export function EditUserForm({
  userId,
  fullName,
  email,
  phoneNumber,
  role,
  plan,
  creditsRemaining,
}: {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: ProfileRole;
  plan: ProfilePlan;
  creditsRemaining: number;
}) {
  const router = useRouter();
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [isSavingProfile, startSavingProfile] = useTransition();

  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [isSavingPassword, startSavingPassword] = useTransition();

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Edit profile</h2>
        <form
          action={(formData: FormData) => {
            setProfileError(null);
            setProfileStatus(null);
            startSavingProfile(async () => {
              const result = await updateUserProfile(userId, {
                full_name: String(formData.get("full_name") ?? ""),
                email: String(formData.get("email") ?? ""),
                phone_number: String(formData.get("phone_number") ?? ""),
                role: formData.get("role") as ProfileRole,
                plan: formData.get("plan") as ProfilePlan,
                credits_remaining: Number(formData.get("credits_remaining") ?? 0),
              });
              if (result.error) {
                setProfileError(result.error);
                return;
              }
              setProfileStatus("Saved.");
              router.refresh();
            });
          }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div>
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" defaultValue={fullName} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={email} required />
          </div>
          <div>
            <Label htmlFor="phone_number">Phone number</Label>
            <Input id="phone_number" name="phone_number" defaultValue={phoneNumber} />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select id="role" name="role" defaultValue={role}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="plan">Plan</Label>
            <Select id="plan" name="plan" defaultValue={plan}>
              {PLAN_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="credits_remaining">AI credits</Label>
            <Input
              id="credits_remaining"
              name="credits_remaining"
              type="number"
              min={0}
              defaultValue={creditsRemaining}
            />
          </div>
          <div className="flex items-end gap-3 sm:col-span-2">
            <Button type="submit" disabled={isSavingProfile}>
              {isSavingProfile ? "Saving…" : "Save changes"}
            </Button>
            {profileStatus && <p className="text-sm text-emerald-600">{profileStatus}</p>}
            {profileError && <p className="text-sm text-red-600">{profileError}</p>}
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="mb-1 text-sm font-semibold text-slate-900">Reset password</h2>
        <p className="mb-4 text-xs text-slate-500">
          Sets this account&apos;s password directly — useful for WhatsApp-sourced leads who don&apos;t
          reliably receive email. Share the new password with them yourself.
        </p>
        <form
          action={() => {
            setPasswordError(null);
            setPasswordStatus(null);
            startSavingPassword(async () => {
              const result = await setUserPassword(userId, newPassword);
              if (result.error) {
                setPasswordError(result.error);
                return;
              }
              setPasswordStatus("Password updated.");
              setNewPassword("");
            });
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <div>
            <Label htmlFor="new_password">New password</Label>
            <Input
              id="new_password"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-64"
            />
          </div>
          <Button type="submit" variant="outline" disabled={isSavingPassword || newPassword.length < 8}>
            {isSavingPassword ? "Saving…" : "Set password"}
          </Button>
          {passwordStatus && <p className="text-sm text-emerald-600">{passwordStatus}</p>}
          {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
        </form>
      </Card>
    </div>
  );
}
