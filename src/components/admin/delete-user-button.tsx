"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteUser } from "@/lib/admin/actions";

export function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      `Permanently delete ${userName}? This removes their account, resumes, applications, and all other data. This cannot be undone.`
    );
    if (!confirmed) return;
    startTransition(async () => {
      await deleteUser(userId);
    });
  }

  return (
    <Button type="button" variant="danger" size="sm" onClick={handleDelete} disabled={isPending}>
      {isPending ? "Deleting…" : "Delete account"}
    </Button>
  );
}
