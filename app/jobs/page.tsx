const categories = [
  { name: "Civil Services", href: "/government-jobs" },
  { name: "SSC", href: "/government-jobs" },
  { name: "Railway", href: "/railway-government-jobs" },
  { name: "Banking", href: "/banking-government-jobs" },
  { name: "Defence", href: "/defence-government-jobs" },
  { name: "Teaching", href: "/teaching-government-jobs" },
  { name: "Medical", href: "/medical-government-exams" },
  { name: "Engineering", href: "/engineering-government-jobs" },
  { name: "State Government", href: "/government-jobs" },
];

export default function JobsPage() {
  return (
    <main className="directoryPage">
      <div className="wrap">
        <a className="backLink" href="/">← Back to SarkariPrep</a>
        <div className="directoryHero">
          <span className="tag">CAREER DISCOVERY</span>
          <h1>Government Jobs</h1>
          <p>Apni qualification ke hisaab se government jobs explore karo — aur har vacancy ke liye latest official notification se final details verify karo.</p>
        </div>
        <section className="section compact">
          <div className="categoryGrid">
            {categories.map((category) => (
              <a className="categoryTile" href={category.href} key={category.name}>
                <b>{category.name}</b>
                <span>Explore jobs →</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
