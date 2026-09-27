"use client";
import {notFound} from "next/navigation";
import {exams} from "@/lib/exams";
export function generateStaticParams(){return exams.map(e=>({slug:e.slug}))}
export default function ExamPage({params}:{params:{slug:string}}){
 const e=exams.find(x=>x.slug===params.slug); if(!e) notFound();
 const age=e.minAge===0?"Check notification":e.minAge+"–"+e.maxAge+" years";
 return <main className="detailPage"><div className="wrap">
  <a className="backLink" href="/#exams">← Back to SarkariPrep exams</a>
  <div className="detailHero"><span className="tag">{e.category}</span><h1>{e.name}</h1><p>{e.organization} · Government exam information guide</p><a className="primaryLink detailOfficial" href={e.officialUrl} target="_blank" rel="noopener noreferrer">Open official website ↗</a></div>
  <div className="detailGrid">
   <section className="detailCard"><h2>At a glance</h2><div className="detailFacts"><div><small>Qualification</small><b>{e.qualifications}</b></div><div><small>Age</small><b>{age}</b></div><div><small>Vacancies</small><b>{e.vacancies}</b></div><div><small>Exam date</small><b>{e.examDate}</b></div><div><small>Application last date</small><b>{e.lastDate}</b></div><div><small>Salary / outcome</small><b>{e.salary}</b></div></div></section>
   <section className="detailCard"><h2>Eligibility & selection</h2><p><b>Education:</b> {e.qualifications}</p><p><b>Age:</b> {age}; category/post-specific relaxation may apply.</p><p><b>Categories:</b> {e.categories.join(", ")}</p><p className="notice">This is a structured reference, not an official notification. Before applying, verify dates, vacancies, eligibility, fees, syllabus and selection rules from the latest official notice.</p></section>
   <section className="detailCard"><h2>What to check before applying</h2><ul><li>Latest official notification and corrigenda</li><li>Exact post-wise eligibility and age cut-off</li><li>Category / reservation and relaxation rules</li><li>Application fee and payment window</li><li>Photo, signature and document specifications</li><li>Exam pattern, syllabus and selection stages</li><li>Admit card, answer key and result updates</li></ul></section>
   <section className="detailCard"><h2>Official source</h2><p>Live application, notification, admit card, answer key and result information should be verified on the authority website.</p><a className="primaryLink" href={e.officialUrl} target="_blank" rel="noopener noreferrer">Visit {e.organization} official portal ↗</a></section>
  </div>
 </div></main>
}