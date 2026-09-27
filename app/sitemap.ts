import type { MetadataRoute } from "next";
import { exams } from "@/lib/exams";

const base = "https://sarkariprep.online";
const lastModified = new Date("2026-09-27T00:00:00Z");

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

  return [
    ...staticPages.map((p) => ({ url: base + p.path, lastModified, priority: p.priority, changeFrequency: p.changeFrequency })),
    ...exams.map((exam) => ({
      url: `${base}/exams/${exam.slug}`,
      lastModified: exam.lastVerified ? new Date(exam.lastVerified) : lastModified,
      priority: exam.dataStatus === "official-verified" ? 0.9 : 0.75,
      changeFrequency: "weekly" as const,
    })),
  ];
}
