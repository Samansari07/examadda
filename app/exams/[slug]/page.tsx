import {notFound} from "next/navigation";
import {exams} from "@/lib/exams";

export const dynamic = "force-dynamic";

export default function ExamPage({params}:{params:{slug:string}}){
 const e=exams.find(x=>x.slug===params.slug);
 if(!e) notFound();
 const age=e.minAge===0?"Check latest notification":e.minAge+"–"+e.maxAge+" years";
 const family=e.status==="family";
 return <main className="detailPage"><div className="wrap">
  <a className="backLink" href="/#exams">← Back to SarkariPrep exams</a>
  <div className="detailHero"><span className="tag">{e.category}</span><span className="dataBadge">{family?"REFERENCE FAMILY":"CYCLE REFERENCE"}</span><h1>{e.name}</h1><p>{e.organization} · {family?"Recurring recruitment/exam family":"Structured cycle reference"}</p>{e.description&&<p>{e.description}</p>}<a className="primaryLink detailOfficial" href={e.officialUrl} target="_blank" rel="noopener noreferrer">Open official website ↗</a></div>
  <div className="detailGrid">
   <section className="detailCard"><h2>At a glance</h2><div className="detailFacts"><div><small>Qualification</small><b>{e.qualifications}</b></div><div><small>Age</small><b>{age}</b></div><div><small>Vacancies</small><b>{e.vacancies}</b></div><div><small>Exam / cycle</small><b>{e.examDate}</b></div><div><small>Application</small><b>{e.lastDate}</b></div><div><small>Pay / outcome</small><b>{e.salary}</b></div></div></section>
   <section className="detailCard"><h2>Eligibility framework</h2><p><b>Education:</b> {e.qualifications}</p><p><b>Age:</b> {age}; category/post-specific relaxation may apply.</p><p><b>Categories:</b> {e.categories.join(", ")}</p><p className="notice">{family?"This is a recruitment-family reference page. Exact post-wise vacancies, dates, fees, age cut-off, eligibility and selection stages change by notification.":"This is a structured reference, not the official notification. Verify the current notice before applying."}</p></section>
   <section className="detailCard"><h2>Complete candidate checklist</h2><ul><li>Latest official notification and corrigenda</li><li>Exact post-wise eligibility and age cut-off</li><li>Category, reservation, relaxation and PwBD rules</li><li>Application fee, dates and correction window</li><li>Photo, signature and document specifications</li><li>Exam pattern, syllabus and selection stages</li><li>Admit card, answer key, result and next-stage notices</li><li>Official result / recruitment status</li></ul></section>
   <section className="detailCard"><h2>Preparation roadmap</h2><div className="roadmap"><b>01 · Understand</b><span>Read the latest notification and map every eligibility condition.</span><b>02 · Build</b><span>Turn syllabus and PYQs into a topic-wise study plan.</span><b>03 · Practice</b><span>Use sectional tests, full mocks and mistake analysis.</span><b>04 · Track</b><span>Monitor official admit card, answer key, result and next stage.</span></div></section>
   <section className="detailCard"><h2>Official source</h2><p>Live application, notification, admit card, answer key and result information should be verified on the authority website.</p><a className="primaryLink" href={e.officialUrl} target="_blank" rel="noopener noreferrer">Visit {e.organization} official portal ↗</a></section>
   <section className="detailCard"><h2>Data integrity</h2><p><b>Coverage:</b> {family?"Recruitment family / recurring route":"2026 cycle reference"}</p><p><b>Final verification:</b> Latest official notification.</p><p className="notice">SarkariPrep does not represent any government department. Never pay a third party merely because a listing appears here.</p></section>
  </div>
 </div></main>
}