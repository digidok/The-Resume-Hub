import type { Instrumentation } from "next";

/**
 * Captures every server-side error (Server Components, Route Handlers,
 * Server Actions) to error_logs for admin visibility — see
 * /dashboard/admin/errors. Skipped on the Edge runtime (e.g. proxy/
 * middleware) since the service-role Supabase client isn't Edge-safe.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { logServerError } = await import("@/lib/errors/log");

  const message = err instanceof Error ? err.message : String(err);
  const digest =
    typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined;

  await logServerError({
    message,
    digest,
    routePath: context.routePath,
    routeType: context.routeType,
    requestPath: request.path,
    requestMethod: request.method,
  });
};
