"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, User, CreditCard, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/actions";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AvatarMenu({
  name,
  email,
  role,
  avatarUrl,
}: {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const firstName = name.split(" ")[0] || name;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm hover:bg-slate-100"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
            {initials(name)}
          </span>
        )}
        <span className="hidden font-medium text-slate-700 sm:inline">{firstName}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10">
            <div className="px-2.5 py-2">
              <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
              <p className="truncate text-xs text-slate-500">{email}</p>
              <p className="mt-0.5 text-xs capitalize text-slate-400">{role}</p>
            </div>
            <div className="my-1 border-t border-slate-100" />
            <Link
              href="/dashboard/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <User className="h-4 w-4 text-slate-400" />
              Profile
            </Link>
            <Link
              href="/dashboard/subscription"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <CreditCard className="h-4 w-4 text-slate-400" />
              Subscription
            </Link>
            <div className="my-1 border-t border-slate-100" />
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4 text-slate-400" />
                Sign out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
