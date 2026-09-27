import type { MetadataRoute } from "next";
import { exams } from "@/lib/exams";

const base = "https://sarkariprep.online";
const lastModified = new Date("2026-09-27T00:00:00Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, lastModified, priority: 1, changeFrequency: "daily" },
    { url: `${base}/exams`, lastModified, priority: 0.95, changeFrequency: "daily" },
    { url: `${base}/jobs`, lastModified, priority: 0.9, changeFrequency: "daily" },
    { url: `${base}/notifications`, lastModified, priority: 0.95, changeFrequency: "daily" },
    ...exams.map((exam) => ({
      url: `${base}/exams/${exam.slug}`,
      lastModified: exam.lastVerified ? new Date(exam.lastVerified) : lastModified,
      priority: exam.dataStatus === "official-verified" ? 0.9 : 0.75,
      changeFrequency: "weekly" as const,
    })),
  ];
}
