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
          <p>Qualification aur career category ke hisaab se government exam routes explore karo.</p>
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
