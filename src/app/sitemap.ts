import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = "https://www.resumehub.co.za";

const STATIC_ROUTES = [
  "",
  "/jobs",
  "/pricing",
  "/faq",
  "/blog",
  "/student-discount",
  "/privacy",
  "/terms",
  "/login",
  "/signup",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route}`,
    changeFrequency: route === "" || route === "/jobs" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));

  try {
    const supabase = await createClient();
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, posted_at")
      .eq("status", "open")
      .order("posted_at", { ascending: false })
      .limit(1000);

    const jobEntries: MetadataRoute.Sitemap = (jobs ?? []).map((job) => ({
      url: `${BASE_URL}/jobs/${job.id}`,
      lastModified: job.posted_at,
      changeFrequency: "daily",
      priority: 0.6,
    }));

    return [...staticEntries, ...jobEntries];
  } catch {
    return staticEntries;
  }
}
