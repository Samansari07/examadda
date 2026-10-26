import type { MetadataRoute } from "next";
import { exams } from "@/lib/exams";
import { seoLandings } from "@/lib/seo-landings";
import { autoExamData } from "@/lib/auto-exam-data";
import { getApplicationState, getExamState } from "@/lib/exam-status";

const base = "https://sarkariprep.online";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { path: "", priority: 1, changeFrequency: "daily" as const },
    { path: "/exams", priority: 0.95, changeFrequency: "daily" as const },
    { path: "/jobs", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/notifications", priority: 0.95, changeFrequency: "daily" as const },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/disclaimer", priority: 0.4, changeFrequency: "yearly" as const },
  ];

  // Keep sitemap focused on canonical English URLs. Hinglish URLs remain accessible
  // through the site, but are not duplicated here until distinct-language metadata
  // (including hreflang/canonical handling) is confirmed.
  const examUrls = exams
    .filter(exam => exam.status !== "family")
    .map(exam => {
      const override = autoExamData[exam.slug];
      const app = getApplicationState(exam, override);
      const examStatus = getExamState(exam, override);
      const isOfficial = exam.dataStatus === "official-verified" ||
        (!!override && override.confidence === "high" && override.evidenceCount >= 2 && !override.stale && override.refreshedThisCycle !== false);
      const isPriority = app === "open" || examStatus === "ongoing";
      const isUpcoming = examStatus === "upcoming";
      return {
        url: base + "/exams/" + exam.slug,
        ...(exam.lastVerified ? { lastModified: new Date(exam.lastVerified) } : {}),
        priority: isPriority ? 1 : isOfficial ? 0.95 : isUpcoming ? 0.9 : 0.7,
        changeFrequency: isPriority || isOfficial ? "daily" as const : "weekly" as const,
      };
    });

  const landingUrls = seoLandings.map(page => ({
    url: base + "/" + page.slug,
    priority: 0.85,
    changeFrequency: "weekly" as const,
  }));

  return [
    ...staticPages.map(page => ({
      url: base + page.path,
      priority: page.priority,
      changeFrequency: page.changeFrequency,
    })),
    ...landingUrls,
    ...examUrls,
  ];
}
