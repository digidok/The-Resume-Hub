import type { Connection } from "@/types/database";

export type ConnectionRelation =
  | { status: "none" }
  | { status: "pending_sent"; connectionId: string }
  | { status: "pending_received"; connectionId: string }
  | { status: "connected"; connectionId: string };

/** Turns a raw connections row (or none) between the viewer and some other
 * user into the relation the UI needs to decide which buttons to show. */
export function deriveRelation(
  connection: Pick<Connection, "id" | "requester_id" | "status"> | null | undefined,
  viewerId: string
): ConnectionRelation {
  if (!connection) return { status: "none" };
  if (connection.status === "accepted") {
    return { status: "connected", connectionId: connection.id };
  }
  return connection.requester_id === viewerId
    ? { status: "pending_sent", connectionId: connection.id }
    : { status: "pending_received", connectionId: connection.id };
}
