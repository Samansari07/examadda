import Link from "next/link";

const categories = [
  "Civil Services",
  "SSC",
  "Railway",
  "Banking",
  "Defence",
  "Teaching",
  "Medical",
  "Engineering",
  "State Government",
];

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
            {categories.map((category) => (
              <Link
                className="categoryTile"
                href={`/exams?category=${encodeURIComponent(category)}`}
                key={category}
              >
                <b>{category}</b>
                <span>Explore exams →</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
