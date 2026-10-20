import { Button } from "@/components/ui/button";
import { formatDate, type MessageRow } from "@/lib/business/format";

/** Conversation between a client and their assigned contact. `action` is a bound server action taking FormData. */
export function MessageThread({
  messages,
  viewer,
  action,
}: {
  messages: MessageRow[];
  viewer: "client" | "team";
  action: (form: FormData) => Promise<void>;
}) {
  return (
    <div className="mt-3">
      {messages.length === 0 ? (
        <p className="text-sm text-slate-500">
          {viewer === "client" ? "No messages yet. Ask your contact anything about this request." : "No messages yet."}
        </p>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => {
            const mine = m.sender_role === viewer;
            return (
              <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    mine ? "bg-brand-900 text-white" : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.body}</p>
                  <p className={`mt-1 text-[11px] ${mine ? "text-slate-300" : "text-slate-500"}`}>
                    {m.sender_role === "team" ? "Resume Document Hub" : m.sender_email} · {formatDate(m.created_at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <form action={action} className="mt-4 flex gap-2">
        <textarea
          name="body"
          required
          rows={2}
          maxLength={4000}
          placeholder={viewer === "client" ? "Write a message to your contact" : "Reply to the client"}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <Button type="submit" className="self-end">
          Send
        </Button>
      </form>
    </div>
  );
}
