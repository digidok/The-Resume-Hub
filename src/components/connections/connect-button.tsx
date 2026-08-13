"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  removeConnection,
} from "@/lib/connections/actions";
import type { ConnectionRelation } from "@/lib/connections/queries";

export function ConnectButton({
  targetUserId,
  relation,
}: {
  targetUserId: string;
  relation: ConnectionRelation;
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

  if (relation.status === "none") {
    return (
      <div>
        <Button
          type="button"
          size="sm"
          onClick={() => run(() => sendConnectionRequest(targetUserId))}
          disabled={isPending}
        >
          <UserPlus className="mr-1.5 h-3.5 w-3.5" />
          {isPending ? "Sending…" : "Connect"}
        </Button>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (relation.status === "pending_sent") {
    return (
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            Request sent
          </span>
          <button
            type="button"
            onClick={() => run(() => removeConnection(relation.connectionId))}
            disabled={isPending}
            className="text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            Cancel
          </button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  if (relation.status === "pending_received") {
    return (
      <div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => run(() => acceptConnectionRequest(relation.connectionId))}
            disabled={isPending}
          >
            Accept
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => run(() => removeConnection(relation.connectionId))}
            disabled={isPending}
          >
            Decline
          </Button>
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 ring-1 ring-green-200">
          <Check className="h-3.5 w-3.5" />
          Connected
        </span>
        <button
          type="button"
          onClick={() => run(() => removeConnection(relation.connectionId))}
          disabled={isPending}
          className="text-xs font-medium text-slate-400 hover:text-slate-600"
        >
          Remove
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
