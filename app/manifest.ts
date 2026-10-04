import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SarkariPrep",
    short_name: "SarkariPrep",
    description: "Indian government exams, jobs and official recruitment updates.",
    start_url: "/",
    display: "standalone",
    background_color: "#102019",
    theme_color: "#102019",
    lang: "en-IN",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }
    ],
  };
}
