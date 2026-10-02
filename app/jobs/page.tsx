import Link from "next/link";

const categories = [
  ["Civil Services", "/government-jobs"],
  ["SSC", "/government-jobs"],
  ["Railway", "/railway-government-jobs"],
  ["Banking", "/banking-government-jobs"],
  ["Defence", "/defence-government-jobs"],
  ["Teaching", "/teaching-government-jobs"],
  ["Medical", "/medical-government-exams"],
  ["Engineering", "/engineering-government-jobs"],
  ["State Government", "/government-jobs"],
] as const;

export default function JobsPage() {
  return (
    <main className="directoryPage">
      <div className="wrap">
        <Link className="backLink" href="/">← Back to SarkariPrep</Link>
        <div className="directoryHero">
          <span className="tag">CAREER DISCOVERY</span>
          <h1>Government Jobs</h1>
          <p>Apni qualification ke hisaab se government jobs explore karo — aur har vacancy ke liye latest official notification se final details verify karo.</p>
        </div>
        <section className="section compact">
          <div className="categoryGrid">
            {categories.map(([category, href]) => (
              <Link className="categoryTile" href={href} key={category}>
                <b>{category}</b>
                <span>Explore jobs →</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
