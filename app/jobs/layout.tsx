import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Government Jobs & Recruitment in India | SarkariPrep",
  description: "Discover Indian government jobs and recruitment routes by qualification, category and application status, with official-source links.",
  alternates: { canonical: "https://sarkariprep.online/jobs" },
  robots: { index: true, follow: true },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) { return children; }
