import type { MetadataRoute } from "next";
import { exams } from "@/lib/exams";

const base = "https://sarkariprep.in";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, priority: 1, changeFrequency: "daily" },
    { url: `${base}/exams`, priority: 0.95, changeFrequency: "daily" },
    { url: `${base}/jobs`, priority: 0.9, changeFrequency: "weekly" },
    { url: `${base}/notifications`, priority: 0.95, changeFrequency: "daily" },
    ...exams.map((exam) => ({
      url: `${base}/exams/${exam.slug}`,
      priority: 0.8,
      changeFrequency: "weekly" as const,
    })),
  ];
}
