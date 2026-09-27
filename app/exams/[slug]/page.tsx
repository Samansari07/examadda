import {notFound} from "next/navigation";
import {exams} from "@/lib/exams";
import {syllabusBySlug} from "@/lib/syllabus";

export function generateStaticParams(){return exams.map(e=>({slug:e.slug}))}
export function generateMetadata({params}:{params:{slug:string}}){
 const e=exams.find(x=>x.slug===params.slug);
 return {title:e?e.name+" | SarkariPrep":"Exam Guide | SarkariPrep",description:e?e.description||("Eligibility, preparation and official-source guide for "+e.name):"Government exam guide"};
}
export default function ExamPage({params}:{params:{slug:string}}){
 const e=exams.find(x=>x.slug===params.slug); if(!e) notFound();
 const family=e.status==="family"; const liveVerified=e.dataStatus==="official-verified";
 const age=e.minAge===0?"Check latest notification":e.minAge+"–"+e.maxAge+" years";
 const verificationLabel=liveVerified?"Officially verified current cycle":family?"Reference family":"Historical/reference data";
 return <main className="detailPage"><div className="wrap">
  <a className="backLink" href="/exams">← Back to SarkariPrep exams</a>
  <div className="detailHero"><span className="tag">{e.category}</span><span className="dataBadge">{liveVerified?"OFFICIAL VERIFIED":family?"REFERENCE FAMILY":"HISTORICAL REFERENCE"}</span><h1>{e.name}</h1><p>{e.organization} · {family?"Recurring recruitment/exam family":liveVerified?"Current official cycle":"Historical / reference cycle"}</p>{e.description&&<p>{e.description}</p>}<div className="cardLinks"><a className="primaryLink detailOfficial" href={e.officialUrl} target="_blank" rel="noopener noreferrer">Official portal ↗</a>{e.notificationUrl&&<a className="detailOfficial" href={e.notificationUrl} target="_blank" rel="noopener noreferrer">Notification ↗</a>}{e.applyUrl&&<a className="detailOfficial" href={e.applyUrl} target="_blank" rel="noopener noreferrer">Apply ↗</a>}</div></div>
  <div className="detailGrid">
   <section className="detailCard"><h2>At a glance</h2><div className="detailFacts"><div><small>Qualification</small><b>{e.qualifications}</b></div><div><small>Age</small><b>{age}</b></div><div><small>Vacancies</small><b>{e.vacancies}</b></div><div><small>Exam / cycle</small><b>{e.examDate}</b></div><div><small>Application</small><b>{e.lastDate}</b></div><div><small>Pay / outcome</small><b>{e.salary}</b></div></div></section>
   <section className="detailCard"><h2>Eligibility</h2><p><b>Education:</b> {e.qualifications}</p><p><b>Age:</b> {age}; category/post-specific relaxation may apply.</p><p><b>Categories:</b> {e.categories.join(", ")}</p><p className="notice">{family?"This is a recruitment-family reference. Exact post-wise vacancies, dates, fees, age cut-off, eligibility and selection stages change by notification.":"Use the linked official notification for the legally controlling eligibility conditions."}</p></section>
   <section className="detailCard"><h2>Syllabus & exam pattern</h2>
    {syllabusBySlug[e.slug]?<><p><b>Status:</b> {syllabusBySlug[e.slug].status==="official-structured"?"Official-source structured syllabus":"Official syllabus source linked"} · <b>Verified:</b> {syllabusBySlug[e.slug].lastVerified}</p>{syllabusBySlug[e.slug].subjects.map(s=><div className="syllabusBlock" key={s.subject}><h3>{s.subject}</h3><ul>{s.topics.map(t=><li key={t}>{t}</li>)}</ul></div>)}<a className="primaryLink" href={syllabusBySlug[e.slug].sourceUrl} target="_blank" rel="noopener noreferrer">Open official syllabus/source ↗</a></>:<><p><b>Status:</b> Official syllabus source not yet structured into topic-level data.</p><p>Use the authority portal below before preparing. The platform will not invent topic lists for this exam.</p></>}
    <p className="notice">Syllabus is exam-specific and can change by notification/cycle. The linked authority document remains the controlling source.</p>
   </section>
   <section className="detailCard"><h2>Selection & application checklist</h2><ul><li>Latest official notification and corrigenda</li><li>Exact post-wise eligibility and age cut-off</li><li>Category, reservation, relaxation and PwBD rules</li><li>Application fee, dates and correction window</li><li>Photo, signature and document specifications</li><li>Exam pattern, syllabus and selection stages</li><li>Admit card, answer key, result and next-stage notices</li><li>Official result / recruitment status</li></ul></section>
   <section className="detailCard"><h2>Preparation roadmap</h2><div className="roadmap"><b>01 · Understand</b><span>Read the latest notification and map every eligibility condition.</span><b>02 · Build</b><span>Turn the verified syllabus and PYQs into a topic-wise study plan.</span><b>03 · Practice</b><span>Use sectional tests, full mocks and mistake analysis.</span><b>04 · Revise</b><span>Track weak topics, accuracy, speed and repeated PYQ concepts.</span><b>05 · Track</b><span>Monitor official admit card, answer key, result and next stage.</span></div></section>
   <section className="detailCard"><h2>Official source & verification</h2><p><b>Data status:</b> {verificationLabel}</p>{e.lastVerified&&<p><b>Last verified against official source:</b> {e.lastVerified}</p>}<p>The verification date records the most recent successful verification of the stored record; it is not an expiry date. When this record is re-verified, the date should move forward.</p><a className="primaryLink" href={e.officialUrl} target="_blank" rel="noopener noreferrer">Visit {e.organization} official portal ↗</a></section>
   <section className="detailCard"><h2>Data integrity</h2><p>{liveVerified?"This page contains a specifically verified current cycle record.":family?"This page is a recurring recruitment-family reference; current cycle facts are not asserted.":"This page is a structured historical reference and does not claim live vacancy/date accuracy."}</p><p className="notice">SarkariPrep is an independent information platform, not a government department. The official notification remains the final authority.</p></section>
  </div>
 </div></main>
}
