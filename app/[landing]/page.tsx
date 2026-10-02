import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLandingExams, getSeoLanding, seoLandings } from "@/lib/seo-landings";

export function generateStaticParams() {
  return seoLandings.map(({ slug }) => ({ landing: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ landing: string }> }): Promise<Metadata> {
  const { landing: slug } = await params;
  const page = getSeoLanding(slug);
  if (!page) return { title: "Government Exams & Jobs" };
  const url = "https://sarkariprep.online/" + page.slug;
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical: url },
    openGraph: { title: page.title + " | SarkariPrep", description: page.description, url, siteName: "SarkariPrep", type: "website", locale: "en_IN", images: [{ url: "https://sarkariprep.online/opengraph-image", width: 1200, height: 630, alt: page.title }] },
    twitter: { card: "summary_large_image", title: page.title + " | SarkariPrep", description: page.description, images: ["https://sarkariprep.online/opengraph-image"] }
  };
}

export default async function SeoLandingPage({ params }: { params: Promise<{ landing: string }> }) {
  const { landing: slug } = await params;
  const page = getSeoLanding(slug);
  if (!page) notFound();
  const matches = getLandingExams(page);
  const related = seoLandings.filter(x => x.slug !== page.slug).slice(0, 6);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.title,
    description: page.description,
    url: "https://sarkariprep.online/" + page.slug,
    isPartOf: { "@type": "WebSite", name: "SarkariPrep", url: "https://sarkariprep.online" }
  };

  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <section className="section light">
      <div className="wrap">
        <a className="backLink" href="/">← SarkariPrep home</a>
        <div className="sectionHead">
          <div><span className="eyebrow">SEO GUIDE · OFFICIAL-SOURCE FIRST</span><h1>{page.h1}</h1></div>
          <p>{matches.length} matching exam/recruitment guides</p>
        </div>
        <div className="detailCard">
          <p>{page.intro}</p>
          <div className="trustRow"><span>✓ Official-source links</span><span>✓ Cycle-aware data</span><span>✓ No invented live vacancy claims</span></div>
        </div>
      </div>
    </section>

    <section className="section">
      <div className="wrap">
        <div className="sectionHead"><div><span className="eyebrow">EXPLORE MATCHING ROUTES</span><h2>Relevant exams & recruitment guides</h2></div><p>Open a guide for eligibility, syllabus, dates, preparation and the controlling official source.</p></div>
        <div className="examGrid">
          {matches.map(e => <article className="examCard" key={e.slug}>
            <span className="tag">{e.category}</span>
            <h3>{e.name}</h3>
            <p className="org">{e.organization}</p>
            <div className="miniFacts"><div><small>Qualification</small><b>{e.qualifications}</b></div><div><small>Status</small><b>{e.dataStatus === "official-verified" ? "Officially verified" : e.status === "family" ? "Recruitment family" : "Reference guide"}</b></div><div><small>Vacancy</small><b>{e.vacancies}</b></div></div>
            <div className="cardLinks"><a className="primaryLink" href={"/exams/" + e.slug}>Open complete guide →</a><a href={e.notificationUrl || e.sourceUrl || e.officialUrl} target="_blank" rel="noopener noreferrer">Official ↗</a></div>
          </article>)}
        </div>
      </div>
    </section>

    <section className="section light">
      <div className="wrap">
        <div className="sectionHead"><div><span className="eyebrow">MORE WAYS TO EXPLORE</span><h2>Related government-exam guides</h2></div></div>
        <div className="careerGrid">
          {related.map(x => <a className="careerCard" href={"/" + x.slug} key={x.slug}><div><b>{x.h1}</b><p>{x.description}</p></div><strong>→</strong></a>)}
        </div>
      </div>
    </section>

    <section className="section compact">
      <div className="wrap">
        <div className="detailCard">
          <h2>How SarkariPrep keeps information useful</h2>
          <p>Exam profiles are connected to official-source data and clearly distinguish verified current-cycle information from reference or recruitment-family information. If an automated source check fails, that is not treated as proof that a notification does not exist.</p>
          <div className="cardLinks"><a className="primaryLink" href="/exams">Browse all exams →</a><a href="/notifications">Open notifications →</a><a href="/jobs">Explore jobs →</a></div>
        </div>
      </div>
    </section>
  </main>;
}
