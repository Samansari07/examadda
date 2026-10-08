import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Government Exams in India | SarkariPrep",
  description: "Browse Indian government exams across UPSC, SSC, banking, railway, defence, teaching, medical and state recruitment.",
  alternates: { canonical: "https://sarkariprep.online/exams" },
  robots: { index: true, follow: true },
};

export default function ExamsLayout({ children }: { children: React.ReactNode }) { return children; }
