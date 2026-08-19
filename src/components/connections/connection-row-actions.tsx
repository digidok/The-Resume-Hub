"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { acceptConnectionRequest, removeConnection } from "@/lib/connections/actions";

export function ConnectionRowActions({
  connectionId,
  variant,
}: {
  connectionId: string;
  variant: "incoming" | "sent" | "connected";
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (variant === "incoming") {
    return (
      <div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => run(() => acceptConnectionRequest(connectionId))}
            disabled={isPending}
          >
            Accept
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => run(() => removeConnection(connectionId))}
            disabled={isPending}
          >
            Decline
          </Button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (variant === "sent") {
    return (
      <div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => run(() => removeConnection(connectionId))}
          disabled={isPending}
        >
          Cancel request
        </Button>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Link href={`/dashboard/connections/${connectionId}/chat`}>
          <Button type="button" size="sm" variant="outline">
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
            Message
          </Button>
        </Link>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => run(() => removeConnection(connectionId))}
          disabled={isPending}
        >
          Remove
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
