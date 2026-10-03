import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exams } from "@/lib/exams";
import { seoLandings, getLandingExams, getSeoLanding } from "@/lib/seo-landings";
import { autoExamData } from "@/lib/auto-exam-data";
import { autoNotifications } from "@/lib/auto-notifications";
import { cleanFeedTitle, isFeedUseful } from "@/lib/notification-feed";
import { hinglish } from "@/lib/hinglish";

const base = "https://sarkariprep.online";

function safeFeedNotifications() {
  if (!Array.isArray(autoNotifications)) return [];
  return autoNotifications.filter(n => {
    try { return typeof isFeedUseful === "function" && isFeedUseful(n); } catch { return false; }
  });
}

function resolve(slug: string[]) {
  if (!slug.length) return { kind: "home" as const };
  if (slug[0] === "exams" && slug[1]) {
    const exam = exams.find(e => e.slug === slug[1]);
    return exam ? { kind: "exam" as const, exam } : null;
  }
  if (slug[0] === "exams") return { kind: "exams" as const };
  if (slug[0] === "jobs") return { kind: "jobs" as const };
  if (slug[0] === "notifications") return { kind: "notifications" as const };
  const landing = getSeoLanding(slug[0]);
  return landing ? { kind: "landing" as const, landing } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const slug = (await params).slug || [];
  const page = resolve(slug);
  if (!page) return { title: "SarkariPrep Hinglish" };
  let title = "SarkariPrep Hinglish — Sarkari Jobs & Exams";
  let description = "Hinglish mein Sarkari jobs, government exams, eligibility, syllabus, dates aur official notifications.";
  if (page.kind === "exam") {
    title = page.exam.name + " Hinglish Guide | SarkariPrep";
    description = page.exam.name + " ki eligibility, syllabus, exam date, application aur official notification Hinglish mein samjho.";
  } else if (page.kind === "landing") {
    title = page.landing.h1 + " Hinglish | SarkariPrep";
    description = page.landing.description + " Hinglish mein.";
  } else if (page.kind === "jobs") title = "Sarkari Jobs Hinglish | SarkariPrep";
  else if (page.kind === "exams") title = "Saare Sarkari Exams Hinglish | SarkariPrep";
  else if (page.kind === "notifications") title = "Latest Sarkari Notifications Hinglish | SarkariPrep";
  return {
    title, description, metadataBase: new URL(base),
    alternates: { canonical: base + "/hinglish" + (slug.length ? "/" + slug.join("/") : ""), languages: {
      "hi-Latn-IN": base + "/hinglish" + (slug.length ? "/" + slug.join("/") : ""),
      "en-IN": slug[0] === "exams" && slug[1] ? base + "/exams/" + slug[1] : base
    }},
    openGraph: { title, description, url: base + "/hinglish" + (slug.length ? "/" + slug.join("/") : ""), siteName: "SarkariPrep", locale: "hi_Latn", type: "website" },
    robots: { index: true, follow: true }
  };
}

function Header() {
  return <header className="nav"><div className="wrap navInner">
    <a className="brand" href="/hinglish">Sarkari<span>Prep</span></a>
    <nav className="navlinks">
      <a href="/hinglish#explore">Explore</a><a href="/hinglish/exams">Exams</a><a href="/hinglish/jobs">Jobs</a><a href="/hinglish#prep">Preparation</a><a href="/hinglish/notifications">Notifications</a>
    </nav>
    <a className="savedNav" href="/hinglish#saved">★ Saved</a>
  </div></header>;
}

function Home() {
  const popular = ["upsc-cse-2026","ssc-cgl-2026","ibps-po-2026","rrb-ntpc-2026","nda-ii-2026","ctet-2026"];
  return <><Header/><main>
    <section className="hero premiumHero"><div className="wrap heroInner"><div className="heroCopy">
      <span className="tag orange">{hinglish.home.eyebrow}</span><h1>{hinglish.home.title.split("\n").map((x,i)=><span key={x}>{i>0&&<br/>}<>{i===1?<span>{x}</span>:x}</></span>)}</h1>
      <p>{hinglish.home.intro}</p><div className="heroSearch"><span>⌕</span><input placeholder={hinglish.home.search}/><a className="primaryLink" href="/hinglish/exams">{hinglish.home.explore}</a></div>
      <div className="trustRow"><span>✓ {hinglish.home.official}</span><span>✓ {hinglish.home.pathways}</span><span>✓ {hinglish.home.verified}</span><span>✓ {hinglish.home.safe}</span></div>
    </div><div className="heroPanel premiumPanel"><div className="panelLabel">YOUR EXAM COMMAND CENTRE</div><h3>3 cheezein, ek jagah.</h3>
      <div className="route"><b>{hinglish.home.discover}</b><span>{hinglish.home.discoverText}</span></div><div className="route"><b>{hinglish.home.understand}</b><span>{hinglish.home.understandText}</span></div><div className="route"><b>{hinglish.home.verify}</b><span>{hinglish.home.verifyText}</span></div>
      <a href="/hinglish/exams" className="routeBtn">{hinglish.home.start}</a>
    </div></div></section>

    <section className="headlineHub"><div className="wrap"><div className="headlineTop"><div><span className="eyebrow">🚨 SARKARI JOBS & EXAMS</span><h2>{hinglish.home.happening}</h2><p>{hinglish.home.officialHeadlines}</p></div><a href="/hinglish/notifications">Saare updates →</a></div>
      <div className="headlineGrid"><div className="headlineFeature"><div className="headlineFeatureHead"><span>🔵 {hinglish.home.upcoming}</span><a href="/hinglish/exams">Saare dekho →</a></div>
        {popular.map(slug=>{const e=exams.find(x=>x.slug===slug); if(!e)return null; const d=autoExamData[e.slug]?.examDate||e.examDate; return <a className="headlineItem" href={"/hinglish/exams/"+e.slug} key={e.slug}><span className="headlineIcon">◉</span><span><b>{e.name}</b><small>{e.organization} · Official source</small></span><strong>{d}</strong></a>})}
      </div><div className="headlineList"><div className="headlineFeatureHead"><span>🟢 {hinglish.home.jobs}</span><a href="/hinglish/notifications">Centre kholo →</a></div>
        {safeFeedNotifications().slice(0,5).map(n=><a className="headlineItem" href={n.notificationUrl||n.officialUrl} target="_blank" rel="noopener noreferrer" key={n.id}><span className="headlineBadge">{n.stage==="Application Open"?"APPLY":n.stage.toUpperCase()}</span><span><b>{cleanFeedTitle(n.title)}</b><small>{n.organization} · ✓ Verified source</small></span></a>)}
      </div></div>
      <div className="headlineTrust"><span>✓ {hinglish.home.officialSource}</span><span>✓ {hinglish.home.autoFeed}</span><span>✓ Organization matched</span><span>✓ {hinglish.home.verifyFinal}</span></div>
    </div></section>

    <section className="statStrip"><div className="wrap stats"><div><b>{exams.length}+</b><span>Exam & recruitment guides</span></div><div><b>10+</b><span>Major career categories</span></div><div><b>10th → PG</b><span>Qualification pathways</span></div><div><b>Official</b><span>Source-first approach</span></div></div></section>

    <section className="section" id="explore"><div className="wrap"><div className="sectionHead"><div><span className="eyebrow">CAREER ROUTES</span><h2>{hinglish.home.career}</h2></div><p>Apni qualification, interest ya category ke hisaab se route choose karo.</p></div>
      <div className="careerGrid">{[["🎯","Civil Services","UPSC, State PSC aur administration"],["🧾","SSC & Central","CGL, CHSL, MTS, CPO, JE aur more"],["🚆","Railway","NTPC, Group D, ALP, JE, Technician, RPF"],["🏦","Banking","IBPS, SBI, RBI, NABARD, SEBI aur Insurance"],["🛡️","Defence & Police","NDA, CDS, CAPF, AFCAT, Agniveer"],["🏫","Teaching","CTET, NET aur teaching recruitment"],["⚕️","Medical","NEET, CMS, PG, INI-CET aur AIIMS"],["⚙️","Engineering","ESE, JE, GATE aur PSU pathways"],["🏛️","State Government","JPSC, JSSC, BPSC, UPPSC aur more"]].map(x=><a className="careerCard" href="/hinglish/exams" key={x[1]}><span>{x[0]}</span><div><b>{x[1]}</b><p>{x[2]}</p></div><strong>→</strong></a>)}</div>
    </div></section>

    <section className="section light" id="exams"><div className="wrap"><div className="sectionHead"><div><span className="eyebrow">{hinglish.home.directory}</span><h2>{hinglish.home.everything}</h2></div><p>{exams.length} exam profiles Hinglish mein.</p></div><div className="examGrid">{popular.map(slug=>{const e=exams.find(x=>x.slug===slug);if(!e)return null;return <article className="examCard" key={e.slug}><span className="tag">{e.category}</span><h3>{e.name}</h3><p className="org">{e.organization}</p><div className="miniFacts"><div><small>{hinglish.home.qualification}</small><b>{e.qualifications}</b></div><div><small>{hinglish.home.age}</small><b>{e.minAge===0?"Latest notification check":e.minAge+"–"+e.maxAge+" yrs"}</b></div><div><small>{hinglish.home.vacancies}</small><b>{e.vacancies}</b></div></div><div className="cardLinks"><a className="primaryLink" href={"/hinglish/exams/"+e.slug}>{hinglish.home.openGuide}</a><a href={e.officialUrl} target="_blank" rel="noopener noreferrer">{hinglish.home.officialPortal}</a></div></article>})}</div><a className="showMore linkButton" href="/hinglish/exams">Saare exam profiles dekho →</a></div></section>

    <section className="section" id="jobs"><div className="wrap"><div className="sectionHead"><div><span className="eyebrow">JOB DISCOVERY</span><h2>{hinglish.home.jobsTitle}</h2></div><p>{hinglish.home.jobsText}</p></div><div className="jobGrid">{[["10th / ITI","🔧","Railway Level 1, SSC MTS, SSC GD, GDS aur trade-based routes"],["12th Pass","🎓","SSC CHSL, RRB NTPC UG, NDA aur 10+2 pathways"],["Graduate","🧑‍💼","UPSC, SSC CGL, Banking, Railway aur State PSC"],["Engineering","⚙️","ESE, SSC JE, RRB JE, GATE aur PSU pathways"],["Medical","⚕️","CMS, NEET PG, INI-CET, AIIMS aur health recruitment"],["Teaching","🏫","CTET, UGC NET, CSIR NET aur state teaching routes"]].map(x=><a className="jobCard" href="/hinglish/jobs" key={x[0]}><span>{x[1]}</span><div><b>{x[0]}</b><p>{x[2]}</p></div><strong>→</strong></a>)}</div></div></section>

    <section className="section compact" id="prep"><div className="wrap"><div className="sectionHead"><div><span className="eyebrow">PREPARATION HUB</span><h2>Exam page ke baad kya karna hai?</h2></div></div><div className="resourceGrid">{[["01","Syllabus","Official syllabus ko topic checklist mein convert karo."],["02","Exam Pattern","Questions, duration, marking aur selection stages samjho."],["03","PYQ","Previous papers se recurring topics aur difficulty identify karo."],["04","Mock Tests","Sectional → full mock → analysis → weak-topic revision."],["05","Documents","Photo, signature, ID aur certificates ready rakho."],["06","Alerts","Application → admit card → answer key → result track karo."]].map(x=><article className="resourceCard" key={x[0]}><span>{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p></article>)}</div></div></section>

    <section className="section officialSection" id="official"><div className="wrap"><div className="sectionHead"><div><span className="eyebrow">SOURCE OF TRUTH</span><h2>{hinglish.home.officialPortals}</h2></div><p>Final application facts hamesha relevant authority ke latest official notification se verify karo.</p></div><div className="officialGrid">{[["UPSC","https://www.upsc.gov.in/"],["SSC","https://ssc.gov.in/"],["IBPS","https://www.ibps.in/"],["Railways","https://indianrailways.gov.in/"],["NTA","https://nta.nic.in/"],["RBI","https://www.rbi.org.in/"],["SBI Careers","https://sbi.co.in/web/careers"],["CTET","https://ctet.nic.in/"],["JPSC","https://jpsc.gov.in/"],["JSSC","https://jssc.jharkhand.gov.in/"]].map(x=><a href={x[1]} target="_blank" rel="noopener noreferrer" className="officialCard" key={x[0]}><b>{x[0]}</b><span>Official kholo ↗</span></a>)}</div></div></section>
  </main><Footer/></>;
}

function ExamDirectory() {
  return <><Header/><main><section className="section light"><div className="wrap"><a className="backLink" href="/hinglish">← SarkariPrep home</a><div className="sectionHead"><div><span className="eyebrow">EXAM DIRECTORY</span><h1>Saare Sarkari Exams</h1></div><p>{exams.length} exam profiles</p></div><div className="examGrid">{exams.map(e=><article className="examCard" key={e.slug}><span className="tag">{e.category}</span><h3>{e.name}</h3><p className="org">{e.organization}</p><div className="miniFacts"><div><small>Qualification</small><b>{e.qualifications}</b></div><div><small>Age</small><b>{e.minAge===0?"Latest notification check":e.minAge+"–"+e.maxAge+" yrs"}</b></div><div><small>Status</small><b>{e.dataStatus==="official-verified"?"Officially verified":"Reference / family guide"}</b></div><div><small>Vacancies</small><b>{e.dataStatus==="official-verified"?e.vacancies:"Latest notification dekho"}</b></div></div><p className="cardHint">Current vacancy, eligibility aur dates ke liye latest official notification verify karo.</p><div className="cardLinks"><a className="primaryLink" href={"/hinglish/exams/"+e.slug}>Easy Hinglish guide →</a><a href={e.notificationUrl||e.sourceUrl||e.officialUrl} target="_blank" rel="noopener noreferrer">Latest notice ↗</a></div></article>)}</div></div></section></main><Footer/></>;
}

function ExamPage({ exam }: { exam: typeof exams[number] }) {
  const override = autoExamData[exam.slug];
  const examDate = override?.examDate || exam.examDate;
  const lastDate = override?.lastDate || exam.lastDate;
  const vacancy = override?.vacancies || exam.vacancies;
  const feed = safeFeedNotifications().filter(n => {
    try { return new URL(n.officialUrl).hostname.replace(/^www\./,"") === new URL(exam.officialUrl).hostname.replace(/^www\./,""); } catch { return false; }
  }).slice(0,5);
  return <><Header/><main className="detailPage"><div className="wrap">
    <a className="backLink" href="/hinglish/exams">← SarkariPrep exams par wapas jao</a>
    <nav className="cardHint" style={{marginBottom:"18px"}}><a href="/hinglish">Home</a> / <a href="/hinglish/exams">Exams</a> / {exam.name}</nav>
    <div className="detailHero"><span className="tag">{exam.category}</span><span className="dataBadge">{exam.dataStatus==="official-verified"?"OFFICIAL VERIFIED":"REFERENCE GUIDE"}</span><h1>{exam.name}</h1><p>{exam.organization} · Hinglish easy guide</p><p>Is page par eligibility, syllabus, dates, vacancies aur apply process ko simple Hinglish mein samjhaya gaya hai.</p><div className="cardLinks"><a className="primaryLink detailOfficial" href={exam.notificationUrl||exam.sourceUrl||exam.officialUrl} target="_blank" rel="noopener noreferrer">Latest notification ↗</a><a className="detailOfficial" href={exam.officialUrl} target="_blank" rel="noopener noreferrer">Official website ↗</a>{exam.applyUrl&&<a className="detailOfficial" href={exam.applyUrl} target="_blank" rel="noopener noreferrer">Apply online ↗</a>}</div></div>
    <div className="detailGrid">
      <section className="detailCard"><h2>Ek nazar mein</h2><div className="detailFacts"><div><small>Qualification</small><b>{exam.qualifications}</b></div><div><small>Age</small><b>{exam.minAge===0?"Latest notice check":exam.minAge+"–"+exam.maxAge+" years"}</b></div><div><small>Vacancies</small><b>{vacancy}</b></div><div><small>Exam / cycle</small><b>{examDate}</b></div><div><small>Application last date</small><b>{lastDate}</b></div><div><small>Pay / outcome</small><b>{exam.salary}</b></div></div></section>
      <section className="detailCard"><h2>Eligibility ka simple matlab</h2><p><b>Education:</b> {exam.qualifications}</p><p><b>Age:</b> {exam.minAge===0?"Latest notification mein check karo":exam.minAge+"–"+exam.maxAge+" years"}; category/post ke hisaab se relaxation ho sakta hai.</p><p><b>Categories:</b> {exam.categories.join(", ")}</p><div className="studentTip"><b>Shortcut:</b> Apply karne se pehle latest official notification zaroor kholo.</div></section>
      <section className="detailCard"><h2>Syllabus & exam pattern</h2><p>Exact syllabus aur pattern cycle ke notification par depend karta hai. Guess nahi kiya gaya hai. Latest official document ko final source mano.</p><a className="primaryLink" href={exam.notificationUrl||exam.sourceUrl||exam.officialUrl} target="_blank" rel="noopener noreferrer">Official syllabus / notice kholo ↗</a></section>
      <section className="detailCard"><h2>Important dates</h2><div className="timeline"><div><span>Exam / cycle</span><b>{examDate}</b></div><div><span>Application</span><b>{lastDate}</b></div><div><span>Admit card / result</span><b>Official notice / portal</b></div></div><p className="cardHint">Date revise ho sakti hai; latest corrigendum ko follow karo.</p></section>
      <section className="detailCard"><h2>Kaise apply karein?</h2><div className="studentSteps"><span>1</span><b>Notification</b><small>Latest official notice kholo</small><span>2</span><b>Eligibility</b><small>Education + age + category check karo</small><span>3</span><b>Dates</b><small>Last date aur fee dekho</small><span>4</span><b>Documents</b><small>Photo, signature, ID ready rakho</small><span>5</span><b>Apply</b><small>Sirf official portal par form bharo</small><span>6</span><b>Save</b><small>Form aur receipt save karo</small></div></section>
      <section className="detailCard"><h2>Preparation roadmap</h2><div className="roadmap"><b>01 · Samjho</b><span>Latest notification aur eligibility read karo.</span><b>02 · Plan banao</b><span>Verified syllabus ko topic-wise divide karo.</span><b>03 · Practice</b><span>PYQ, sectional test aur mock lagao.</span><b>04 · Revise</b><span>Weak topics aur mistakes ko repeat karo.</span><b>05 · Track</b><span>Admit card, answer key aur result updates follow karo.</span></div></section>
      <section className="detailCard"><h2>Automatic official updates</h2>{feed.length?<ul>{feed.map(n=><li key={n.id}><a href={n.notificationUrl||n.officialUrl} target="_blank" rel="noopener noreferrer"><b>{cleanFeedTitle(n.title)}</b></a> · {n.stage} · checked {n.lastChecked}</li>)}</ul>:<p>Abhi is exam ke liye matching official-source notice feed mein nahi mila. Official portal upar linked hai.</p>}</section>
      <section className="detailCard"><h2>Important reminder</h2><p>SarkariPrep easy Hinglish guide deta hai. Vacancy, eligibility, age, fees, dates aur selection rules ka final authority hamesha latest official notification hai.</p></section>
    </div>
  </div></main><Footer/></>;
}

function Jobs() {
  const cats=[["Civil Services","UPSC, State PSC aur administration"],["SSC","CGL, CHSL, MTS, CPO aur JE"],["Railway","NTPC, Group D, ALP, JE aur RPF"],["Banking","IBPS, SBI, RBI aur insurance"],["Defence","NDA, CDS, CAPF, AFCAT aur Agniveer"],["Teaching","CTET, NET aur teaching recruitment"],["Medical","NEET, CMS, PG aur AIIMS"],["Engineering","ESE, JE, GATE aur PSU"],["State Government","JPSC, JSSC, BPSC, UPPSC aur more"]];
  return <><Header/><main className="directoryPage"><div className="wrap"><a className="backLink" href="/hinglish">← SarkariPrep par wapas</a><div className="directoryHero"><span className="tag">CAREER DISCOVERY</span><h1>Sarkari Jobs</h1><p>Apni qualification ke hisaab se government jobs explore karo aur har vacancy ki final details latest official notification se verify karo.</p></div><section className="section compact"><div className="categoryGrid">{cats.map(x=><a className="categoryTile" href="/hinglish/exams" key={x[0]}><b>{x[0]}</b><span>{x[1]} →</span></a>)}</div></section></div></main><Footer/></>;
}

function Notifications() {
  const feed=safeFeedNotifications().slice(0,60);
  return <><Header/><main><section className="section light"><div className="wrap"><a className="backLink" href="/hinglish">← SarkariPrep home</a><div className="sectionHead"><div><span className="eyebrow">OFFICIAL UPDATES</span><h1>Latest Sarkari Notifications</h1></div><p>Automatic official-source feed</p></div><div className="notificationGrid">{feed.map(n=><article className="notificationCard" key={n.id}><div className="examMeta"><span className="tag">{n.stage}</span><span className="verified">✓ Official source</span></div><h3>{cleanFeedTitle(n.title)}</h3><p className="org">{n.organization}</p><p>{n.description}</p><div className="cardLinks"><a className="primaryLink" href={n.notificationUrl||n.officialUrl} target="_blank" rel="noopener noreferrer">Official notice kholo ↗</a></div></article>)}</div></div></section></main><Footer/></>;
}

function Landing({ landing }: { landing: typeof seoLandings[number] }) {
  const matches=getLandingExams(landing);
  return <><Header/><main><section className="section light"><div className="wrap"><a className="backLink" href="/hinglish">← SarkariPrep home</a><div className="sectionHead"><div><span className="eyebrow">HINGLISH SEO GUIDE · OFFICIAL-SOURCE FIRST</span><h1>{landing.h1} — Hinglish Guide</h1></div><p>{matches.length} matching exam guides</p></div><div className="detailCard"><p>{landing.intro}</p><div className="trustRow"><span>✓ Official-source links</span><span>✓ Cycle-aware data</span><span>✓ Guesswork nahi</span></div></div></div></section><section className="section"><div className="wrap"><div className="sectionHead"><div><span className="eyebrow">MATCHING ROUTES</span><h2>Relevant exams & recruitment guides</h2></div><p>Eligibility, syllabus, dates aur official source ek jagah.</p></div><div className="examGrid">{matches.map(e=><article className="examCard" key={e.slug}><span className="tag">{e.category}</span><h3>{e.name}</h3><p className="org">{e.organization}</p><div className="miniFacts"><div><small>Exam date</small><b>{e.examDate}</b></div><div><small>Qualification</small><b>{e.qualifications}</b></div><div><small>Status</small><b>{e.dataStatus==="official-verified"?"Officially verified":"Reference guide"}</b></div><div><small>Vacancies</small><b>{e.vacancies}</b></div></div><div className="cardLinks"><a className="primaryLink" href={"/hinglish/exams/"+e.slug}>Hinglish guide kholo →</a><a href={e.notificationUrl||e.sourceUrl||e.officialUrl} target="_blank" rel="noopener noreferrer">Official ↗</a></div></article>)}</div></div></section></main><Footer/></>;
}

function Footer() { return <footer className="footer"><div className="wrap footerInner"><div><div className="brand">Sarkari<span>Prep</span></div><p>{hinglish.home.footer}</p></div><div><b>Language</b><p>Hinglish mode ON · <a href="/">English version</a></p></div></div></footer>; }

export default async function HinglishPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const page=resolve((await params).slug||[]);
  if(!page) notFound();
  if(page.kind==="home") return <Home/>;
  if(page.kind==="exams") return <ExamDirectory/>;
  if(page.kind==="exam") return <ExamPage exam={page.exam}/>;
  if(page.kind==="jobs") return <Jobs/>;
  if(page.kind==="notifications") return <Notifications/>;
  return <Landing landing={page.landing}/>;
}
