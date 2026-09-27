import type { Metadata } from "next";
import "./globals.css";
const siteUrl = "https://sarkariprep.online";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "SarkariPrep — Indian Government Exams & Jobs", template: "%s | SarkariPrep" },
  description: "Discover Indian government exams, jobs, eligibility, preparation routes and official recruitment notifications in one student-first platform.",
  keywords: ["government exams India","Sarkari Naukri","government jobs","government exam syllabus","UPSC","SSC","Banking exams","Railway jobs","Defence exams","State government exams"],
  alternates: { canonical: "/" },
  openGraph: { title: "SarkariPrep — Indian Government Exams & Jobs", description: "Explore government exams, jobs, preparation routes and official recruitment sources.", url: siteUrl, siteName: "SarkariPrep", locale: "en_IN", type: "website" },
  twitter: { card: "summary_large_image", title: "SarkariPrep — Indian Government Exams & Jobs", description: "A student-first platform for Indian government exams, jobs and official recruitment sources." },
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en-IN"><body>{children}</body></html>;
}
