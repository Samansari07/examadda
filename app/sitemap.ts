import type { MetadataRoute } from "next";
import { exams } from "@/lib/exams";
import { seoLandings } from "@/lib/seo-landings";
import { autoNotificationMeta } from "@/lib/auto-notifications";
import { autoExamData } from "@/lib/auto-exam-data";
import { getApplicationState, getExamState } from "@/lib/exam-status";

const base = "https://sarkariprep.online";

function latestExamUpdate() {
  const dates = exams.map(e => e.lastVerified).filter(Boolean).map(x => new Date(x as string).getTime()).filter(Number.isFinite);
  const generated = new Date(autoNotificationMeta.generatedAt + "T00:00:00Z").getTime();
  return new Date(Math.max(...dates, generated));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const latest = latestExamUpdate();
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

  const hinglishStatic = ["/hinglish", "/hinglish/exams", "/hinglish/jobs", "/hinglish/notifications"];
  const hinglishExamUrls = exams.map(exam => "/hinglish/exams/" + exam.slug);
  const hinglishLandingUrls = seoLandings.map(p => "/hinglish/" + p.slug);

  const examUrls = exams.map(exam => {
    const override = autoExamData[exam.slug];
    const app = getApplicationState(exam, override);
    const examStatus = getExamState(exam, override);
    const isOfficial = exam.dataStatus === "official-verified" || (!!override && override.confidence === "high" && override.evidenceCount >= 2 && !override.stale && override.refreshedThisCycle !== false);
    const isPriority = app === "open" || examStatus === "ongoing";
    const isUpcoming = examStatus === "upcoming";
    return {
      url: base + "/exams/" + exam.slug,
      lastModified: exam.lastVerified ? new Date(exam.lastVerified) : latest,
      priority: isPriority ? 1 : isOfficial ? 0.95 : isUpcoming ? 0.9 : exam.dataStatus === "official-verified" ? 0.85 : 0.7,
      changeFrequency: isPriority || isOfficial ? "daily" as const : "weekly" as const,
    };
  });

  return [
    ...staticPages.map(p => ({ url: base + p.path, lastModified: latest, priority: p.priority, changeFrequency: p.changeFrequency })),
    ...seoLandings.map(p => ({ url: base + "/" + p.slug, lastModified: latest, priority: 0.85, changeFrequency: "daily" as const })),
    ...[...hinglishStatic, ...hinglishExamUrls, ...hinglishLandingUrls].map(path => ({ url: base + path, lastModified: latest, priority: 0.8, changeFrequency: "daily" as const })),
    ...examUrls,
  ];
}
