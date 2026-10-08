"use client";

import {useMemo,useState} from "react";
import {exams} from "@/lib/exams";
import {autoExamData} from "@/lib/auto-exam-data";
import {getApplicationState,getExamState,applicationLabel,examLabel} from "@/lib/exam-status";

const categories=["All",...Array.from(new Set(exams.map(e=>e.category)))];
const qualifications=[
 {label:"10th / ITI",test:/10th|ITI/i},
 {label:"12th Pass",test:/12th|10\+2/i},
 {label:"Graduate",test:/Graduate|Bachelor|degree/i},
 {label:"Engineering",test:/Engineering|Diploma/i},
 {label:"Medical",test:/MBBS|BDS|medical|health/i},
 {label:"Teaching",test:/Teaching|B\.Ed|D\.El|NET|CTET/i},
];

export default function JobsPage(){
 const[q,setQ]=useState(""); const[cat,setCat]=useState("All"); const[status,setStatus]=useState("All");
 const list=useMemo(()=>exams.filter(e=>{
  const o=autoExamData[e.slug], app=getApplicationState(e,o), exam=getExamState(e,o);
  const statusOk=status==="All"||(status==="Open Now"&&app==="open")||(status==="Starting Soon"&&app==="upcoming")||(status==="Upcoming Exam"&&(exam==="upcoming"||exam==="ongoing"))||(status==="Closed"&&app==="closed");
  return (cat==="All"||e.category===cat)&&statusOk&&(!q||[e.name,e.organization,e.category,e.qualifications].join(" ").toLowerCase().includes(q.toLowerCase()));
 }),[q,cat,status]);
 const openCount=exams.filter(e=>getApplicationState(e,autoExamData[e.slug])==="open").length;
 const soonCount=exams.filter(e=>getApplicationState(e,autoExamData[e.slug])==="upcoming").length;
 return <main className="directoryPage"><div className="wrap">
  <a className="backLink" href="/">← Back to SarkariPrep</a>
  <div className="directoryHero"><span className="tag">GOVERNMENT JOBS COMMAND CENTRE</span><h1>Government Jobs & Recruitment</h1><p>Har recruitment route ko ek jagah discover karo. <b>Applications Open</b>, <b>Starting Soon</b> aur <b>Upcoming Exam</b> ko alag rakha gaya hai, taaki exam date ko application status samajhne ki galti na ho.</p></div>
  <section className="section compact"><div className="stats"><div><b>{openCount}</b><span>Applications open now</span></div><div><b>{soonCount}</b><span>Applications starting soon</span></div><div><b>{exams.length}</b><span>Exam & recruitment guides</span></div><div><b>Official</b><span>Final source of truth</span></div></div></section>
  <section className="section compact"><div className="sectionHead"><div><span className="eyebrow">FIND YOUR OPPORTUNITY</span><h2>Qualification se start karo.</h2></div><p>Qualification shortcut guide hai; exact post-wise eligibility latest notification mein verify karo.</p></div><div className="categoryGrid">{qualifications.map(x=><button className="categoryTile" key={x.label} onClick={()=>setQ(x.label==="10th / ITI"?"10th":x.label==="12th Pass"?"12th":x.label==="Graduate"?"graduate":x.label==="Engineering"?"engineering":x.label==="Medical"?"medical":"teaching")}><b>{x.label}</b><span>Find matching routes →</span></button>)}</div></section>
  <section className="section light"><div className="sectionHead"><div><span className="eyebrow">ALL RECRUITMENT ROUTES</span><h2>{list.length} matching guides</h2></div><p>Open applications are highlighted separately from exam timing.</p></div>
   <div className="heroSearch directorySearch"><span>⌕</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search SSC, Railway, Police, Banking, JPSC, UPSC…"/></div>
   <div className="filterBar"><div className="filterScroll">{["All","Open Now","Starting Soon","Upcoming Exam","Closed"].map(s=><button className={status===s?"filter active":"filter"} key={s} onClick={()=>setStatus(s)}>{s}</button>)}</div></div>
   <div className="filterBar"><div className="filterScroll">{categories.map(c=><button className={cat===c?"filter active":"filter"} key={c} onClick={()=>setCat(c)}>{c}</button>)}</div></div>
   <div className="examGrid">{list.map(e=>{const o=autoExamData[e.slug],app=getApplicationState(e,o),exam=getExamState(e,o);return <article className="examCard" key={e.slug}><div className="examMeta"><span className="tag">{e.category}</span><span className={"statusPill "+(app==="open"?"open":app==="closed"?"closed":app==="upcoming"?"upcoming":"unknown")}>{applicationLabel(app)}</span></div><h3>{e.name}</h3><p className="org">{e.organization}</p><div className="miniFacts"><div><small>Application</small><b>{applicationLabel(app)}</b></div><div><small>Exam</small><b>{examLabel(exam)}</b></div><div><small>Qualification</small><b>{e.qualifications}</b></div><div><small>Vacancies</small><b>{e.vacancies}</b></div></div><div className="cardLinks"><a className="primaryLink" href={"/exams/"+e.slug}>Full job/exam guide →</a><a href={e.notificationUrl||e.sourceUrl||e.officialUrl} target="_blank" rel="noopener noreferrer">Official ↗</a></div></article>})}</div>
  </section>
 </div></main>;
}
