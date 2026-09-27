import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SarkariPrep",
    short_name: "SarkariPrep",
    description: "Indian government exams, jobs and official recruitment updates.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",
    lang: "en-IN",
    icons: [],
  };
}
