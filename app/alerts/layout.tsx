import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Government Job & Exam Alerts | SarkariPrep",
  description: "Get government job, exam, deadline, admit-card and result alerts from SarkariPrep.",
  alternates: { canonical: "https://sarkariprep.online/alerts" },
  robots: { index: true, follow: true },
};

export default function AlertsLayout({ children }: { children: React.ReactNode }) { return children; }
