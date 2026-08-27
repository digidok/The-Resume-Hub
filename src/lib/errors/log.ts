import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Records one server-side error to error_logs for admin visibility (see
 * /dashboard/admin/errors). Best-effort and never throws — a logging
 * failure must never mask or replace the original error.
 */
export async function logServerError(params: {
  message: string;
  digest?: string;
  routePath?: string;
  routeType?: string;
  requestPath?: string;
  requestMethod?: string;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("error_logs").insert({
      message: params.message.slice(0, 2000),
      digest: params.digest ?? null,
      route_path: params.routePath ?? null,
      route_type: params.routeType ?? null,
      request_path: params.requestPath ?? null,
      request_method: params.requestMethod ?? null,
    });
  } catch (err) {
    console.error("logServerError: failed to record error log", err);
  }
}
