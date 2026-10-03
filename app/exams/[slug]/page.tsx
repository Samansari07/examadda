import {notFound} from "next/navigation";
import {exams} from "@/lib/exams";
import {syllabusBySlug} from "@/lib/syllabus";
import {sourceStatuses} from "@/lib/source-status";
import {autoNotifications} from "@/lib/auto-notifications";
import {autoExamData} from "@/lib/auto-exam-data";
import {getDetailProfile} from "@/lib/exam-detail";

export function generateStaticParams(){return exams.map(e=>({slug:e.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params; const e=exams.find(x=>x.slug===slug); const o=e?autoExamData[e.slug]:undefined; const desc=e&&o&&o.confidence==="high"&&!o.stale&&o.refreshedThisCycle!==false?"Current official cycle data automatically refreshed from the latest high-confidence authority notice on "+o.lastVerified+".":e?e.description||("Eligibility, preparation and official-source guide for "+e.name):"Government exam guide";
 return {title:e?e.name:"Exam Guide",description:desc,alternates:{canonical:e?"/exams/"+e.slug:"/exams"},openGraph:e?{title:e.name+" | SarkariPrep",description:desc,url:"https://sarkariprep.online/exams/"+e.slug,type:"article",siteName:"SarkariPrep",locale:"en_IN",images:[{url:"https://sarkariprep.online/opengraph-image",width:1200,height:630,alt:e.name+" | SarkariPrep"}]}:undefined,twitter:e?{card:"summary_large_image",title:e.name+" | SarkariPrep",description:e.description||("Eligibility, preparation and official-source guide for "+e.name),images:["https://sarkariprep.online/opengraph-image"]}:undefined};
}
export default async function ExamPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params; const e=exams.find(x=>x.slug===slug); if(!e) notFound();
 const family=e.status==="family";
 const autoOverride=autoExamData[e.slug]||Object.values(autoExamData).filter(x=>x.familySlug===e.slug && !x.stale && x.confidence==="high" && x.evidenceCount>=2 && x.refreshedThisCycle!==false).sort((a,b)=>(b.cycleYear||0)-(a.cycleYear||0))[0];
 const liveVerified=e.dataStatus==="official-verified" || (!!autoOverride && autoOverride.confidence==="high" && autoOverride.evidenceCount>=2 && !autoOverride.stale && autoOverride.refreshedThisCycle!==false);
 const displayExamDate=autoOverride?.examDate||e.examDate;
 const displayApplicationDates=autoOverride?.applicationDates||autoOverride?.lastDate||e.lastDate;
 const displayLastDate=autoOverride?.lastDate||autoOverride?.applicationDates||e.lastDate;
 const displayVacancies=autoOverride?.vacancies||e.vacancies;
 const displayFee=autoOverride?.fee;
 const displayQualification=autoOverride?.qualification||e.qualifications;
 const displayPay=autoOverride?.payScale||e.salary;
 const displaySelection=autoOverride?.selectionProcess;
 const displayCorrection=autoOverride?.correctionDates||getDetailProfile(e).correction;
 const autoAgeMin=autoOverride?.minAge;
 const autoAgeMax=autoOverride?.maxAge;
 const displayNotification=autoOverride?.notificationUrl||e.notificationUrl||e.sourceUrl||e.officialUrl;
 const parseDate=(value:string)=>{
  const m=value.match(/(?:^|\b)(\d{1,2})[\s–—-]+([A-Za-z]{3,9})[\s–—-]+(20\d{2})(?:\b|$)/);
  if(!m) return null;
  const months:{[k:string]:number}={jan:0,january:0,feb:1,february:1,mar:2,march:2,apr:3,april:3,may:4,jun:5,june:5,jul:6,july:6,aug:7,august:7,sep:8,september:8,oct:9,october:9,nov:10,november:10,dec:11,december:11};
  const month=months[m[2].toLowerCase()];
  return month===undefined?null:new Date(Date.UTC(Number(m[3]),month,Number(m[1])));
 };
 const resolveApplicationStatus=()=>{
  const raw=(autoOverride?.applicationDates||"")+" "+(autoOverride?.lastDate||"")+" "+(e.lastDate||"");
  const iso=[...raw.matchAll(/20\d{2}-\d{2}-\d{2}/g)].map(x=>new Date(x[0]+"T23:59:59Z"));
  const textDates=[...raw.matchAll(/\b\d{1,2}[\s–—-]+[A-Za-z]{3,9}[\s–—-]+20\d{2}\b/g)].map(x=>parseDate(x[0])).filter(Boolean) as Date[];
  const dates=[...iso,...textDates].filter(d=>!Number.isNaN(d.getTime())).sort((a,b)=>a.getTime()-b.getTime());
  if(dates.length>=2){
   const start=dates[0], end=dates[dates.length-1];
   const now=Date.now();
   if(now<start.getTime()) return "upcoming" as const;
   if(now<=end.getTime()+24*60*60*1000-1) return "open" as const;
   return "closed" as const;
  }
  if(dates.length===1){
   const end=dates[0].getTime()+24*60*60*1000-1;
   if(Date.now()>end) return "closed" as const;
  }
  return e.applicationStatus||"unknown";
 };
 const applicationStatus=resolveApplicationStatus();
 const canApply=applicationStatus==="open" && !!e.applyUrl;
 const applicationAction=applicationStatus==="closed"?"Application closed":applicationStatus==="upcoming"?"Application not open yet":"Official application portal";
 const age=autoAgeMin!==undefined&&autoAgeMax!==undefined?(autoAgeMin+"–"+autoAgeMax+" years"):e.minAge===0?"Check latest notification":e.minAge+"–"+e.maxAge+" years";
 const sourceCheck=Object.values(sourceStatuses).find(s=>{try{return new URL(e.officialUrl).hostname===new URL(s.sourceUrl).hostname}catch{return s.organization===e.organization}});
 const examHost=(()=>{try{return new URL(e.officialUrl).hostname.replace(/^www\./,"").toLowerCase()}catch{return ""}})();
 const trackedUpdates=autoNotifications.filter(n=>{
  // Never attach a notice merely because its title contains similar words.
  // Notices must come from the same registered official host as this exam.
  // This prevents cross-organization leakage such as JPSC notices appearing on OPSC.
  const noticeHost=(()=>{try{return new URL(n.officialUrl).hostname.replace(/^www\./,"").toLowerCase()}catch{return ""}})();
  return !!examHost && !!noticeHost && examHost===noticeHost;
 }).slice(0,5);
 const sourceTracked=!!sourceCheck;
 const detail=getDetailProfile(e);
 const verificationLabel=liveVerified?"Officially verified current cycle":family?(sourceTracked?"Official source tracked":"Reference family"):"Historical/reference data";
 const examWhatsApp="https://wa.me/917979748481?text="+encodeURIComponent("Hello SarkariPrep, mujhe "+e.name+" ke notes / notification / exam information ke baare mein jaana hai.");
 const jsonLd={"@context":"https://schema.org","@type":"Article","headline":e.name+" — SarkariPrep Exam Guide","description":e.description||("Eligibility, syllabus, dates and official-source guide for "+e.name),"mainEntityOfPage":"https://sarkariprep.online/exams/"+e.slug,"dateModified":e.lastVerified||undefined,"publisher":{"@type":"Organization","name":"SarkariPrep","url":"https://sarkariprep.online"}};
 return <main className="detailPage"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(jsonLd)}}/><div className="wrap">
  <a className="backLink" href="/exams">← Back to SarkariPrep exams</a>
  <nav aria-label="Breadcrumb" className="cardHint" style={{marginBottom: "18px"}}><a href="/">Home</a> / <a href="/exams">Exams</a> / <span>{e.name}</span></nav>
  <div className="detailHero"><span className="tag">{e.category}</span><span className="dataBadge">{liveVerified?"OFFICIAL VERIFIED":family?(sourceTracked?"OFFICIAL SOURCE TRACKED":"REFERENCE FAMILY"):"HISTORICAL REFERENCE"}</span><h1>{e.name}</h1><p>{e.organization} · {family?"Recurring recruitment/exam family":liveVerified?"Current official cycle":"Historical / reference cycle"}</p>{(autoOverride&&liveVerified)?<p>Current official cycle data automatically refreshed from the latest high-confidence authority notice on {autoOverride.lastVerified}. Older cycle values are not carried forward.</p>:e.description&&<p>{e.description}</p>}<div className="cardLinks"><a className="primaryLink detailOfficial" href={displayNotification} target="_blank" rel="noopener noreferrer">{displayNotification===e.officialUrl?"Official source ↗":"Latest notification ↗"}</a><a className="detailOfficial" href={e.officialUrl} target="_blank" rel="noopener noreferrer">Official website ↗</a>{canApply&&<a className="detailOfficial" href={e.applyUrl!} target="_blank" rel="noopener noreferrer">Apply online ↗</a>}{applicationStatus!=="open"&&applicationStatus!=="unknown"&&<span className="detailOfficial">{applicationAction}</span>}</div></div>
  <div className="detailGrid">
   <section className="detailCard"><h2>At a glance</h2><div className="detailFacts"><div><small>Qualification</small><b>{displayQualification}</b></div><div><small>Age</small><b>{age}</b></div><div><small>Vacancies</small><b>{displayVacancies}</b></div><div><small>Exam / cycle</small><b>{displayExamDate}</b></div><div><small>Application</small><b>{displayApplicationDates}</b></div><div><small>Pay / outcome</small><b>{displayPay}</b></div></div></section>
   <section className="detailCard"><h2>Eligibility</h2><p><b>Education:</b> {displayQualification}</p><p><b>Age:</b> {age}; category/post-specific relaxation may apply.</p><p><b>Categories:</b> {e.categories.join(", ")}</p><div className="studentTip"><b>Student shortcut:</b> Exact eligibility, age, vacancies, fees and dates change with each recruitment cycle. <a href={e.notificationUrl||e.sourceUrl||e.officialUrl} target="_blank" rel="noopener noreferrer">Open the latest official notification</a> before applying.</div></section>
   <section className="detailCard"><h2>Syllabus & exam pattern</h2>
    {syllabusBySlug[e.slug]?<><p><b>Status:</b> {syllabusBySlug[e.slug].status==="official-structured"?"Official-source structured syllabus":"Official syllabus source linked"} · <b>Verified:</b> {syllabusBySlug[e.slug].lastVerified}</p>{syllabusBySlug[e.slug].subjects.map(s=><div className="syllabusBlock" key={s.subject}><h3>{s.subject}</h3><ul>{s.topics.map(t=><li key={t}>{t}</li>)}</ul></div>)}<a className="primaryLink" href={syllabusBySlug[e.slug].sourceUrl} target="_blank" rel="noopener noreferrer">Open official syllabus/source ↗</a></>:<><p><b>Status:</b> Topic-level syllabus is not yet structured in SarkariPrep for this profile.</p><div className="fallbackGuide"><h3>Exact syllabus kaise check karein?</h3><p>Yahan syllabus structured nahi hai, isliye guess nahi kiya gaya. Neeche se official document kholkar final syllabus verify karein.</p><ol><li><b>Latest notification kholo</b> — eligibility, syllabus aur exam scheme dekho.</li><li><b>Pattern check karo</b> — papers, sections, marks, duration aur negative marking.</li><li><b>PDF save karo</b> — preparation ke liye isi latest document ko reference rakho.</li><li><b>New notice check karo</b> — corrigendum/revised notice aaye to latest version follow karo.</li></ol><a className="primaryLink" href={e.notificationUrl||e.sourceUrl||e.officialUrl} target="_blank" rel="noopener noreferrer">Open latest official document ↗</a></div></>}
    <p className="notice">Syllabus is exam-specific and can change by notification/cycle. The linked authority document remains the controlling source.</p>
   </section>
   <section className="detailCard statusCard"><div className="statusHeader"><div><span className="eyebrow">CURRENT STATUS</span><h2>{detail.statusLabel}</h2></div><span className="statusPill">{liveVerified?"✓ Verified cycle":family?"Family guide":"Reference guide"}</span></div><p>{detail.statusNote}</p><div className="statusActions"><a className="primaryLink" href={e.notificationUrl||e.sourceUrl||e.officialUrl} target="_blank" rel="noopener noreferrer">Check official source ↗</a>{canApply&&<a href={e.applyUrl!} target="_blank" rel="noopener noreferrer">Apply portal ↗</a>}{applicationStatus!=="open"&&applicationStatus!=="unknown"&&<span className="cardHint">{applicationAction}. Open the official portal for the latest cycle.</span>}</div></section>
   <section className="detailCard"><h2>Complete important dates</h2><div className="timeline"><div><span>Exam / cycle</span><b>{displayExamDate}</b></div><div><span>Application</span><b>{displayLastDate}</b></div><div><span>Correction window</span><b>{displayCorrection}</b></div><div><span>Admit card / result</span><b>Authority notice / portal</b></div></div><p className="cardHint">Dates are intentionally not guessed. If the authority revises a date, follow the latest corrigendum/notice.</p></section>
   <section className="detailCard"><h2>Fees & payment</h2><div className="detailFacts"><div><small>Application fee</small><b>{displayFee||detail.fee}</b></div><div><small>Payment</small><b>Use the official application portal only</b></div></div><p className="cardHint">Category-wise exemptions, payment modes and correction charges can differ by recruitment.</p></section>
   <section className="detailCard"><h2>Post-wise vacancies</h2><ul>{detail.vacancy.map(x=><li key={x}>{x}</li>)}</ul></section>
   <section className="detailCard"><h2>Exam pattern</h2><ul>{detail.pattern.map(x=><li key={x}>{x}</li>)}</ul><div className="studentTip"><b>No invented numbers:</b> Exact questions, marks, duration and negative marking are shown only when supported by the relevant official cycle.</div></section>
   <section className="detailCard"><h2>Selection process</h2>{displaySelection?<p>{displaySelection}</p>:<ol>{detail.selection.map(x=><li key={x}>{x}</li>)}</ol>}</section>
   <section className="detailCard"><h2>Documents checklist</h2><ul>{detail.documents.map(x=><li key={x}>{x}</li>)}</ul><p className="cardHint">The notification may require additional or different documents. Upload only what the official instructions request.</p></section>
   <section className="detailCard"><h2>Physical & medical</h2><p>{detail.physical}</p></section>
   <section className="detailCard"><h2>How to apply — simple student checklist</h2><div className="studentSteps"><span>1</span><b>Notification</b><small>Latest official notice kholo</small><span>2</span><b>Eligibility</b><small>Qualification + age + category check karo</small><span>3</span><b>Dates</b><small>Last date, fee & correction window dekho</small><span>4</span><b>Documents</b><small>Photo, signature, ID & certificates ready rakho</small><span>5</span><b>Apply</b><small>Sirf official application portal use karo</small><span>6</span><b>Save</b><small>Form, receipt & notification PDF save karo</small></div><ol><li>Open the <b>latest official notification</b> and read the eligibility section.</li><li>Confirm qualification, age cut-off, category relaxation and post-specific conditions.</li><li>Check application dates, fee, correction window and the official application portal.</li><li>Keep the required photo, signature, ID and qualification/category documents ready in the format specified in the notice.</li><li>Fill the form only on the linked official portal; review every field before final submission.</li><li>Download/save the submitted application, fee receipt and notification PDF.</li><li>Later, use SarkariPrep's notification feed to find admit-card, answer-key, result and next-stage updates.</li></ol><div className="studentTip"><b>Important:</b> SarkariPrep easy guide deta hai, lekin final rule hamesha latest official notification ka hai.</div></section>
   <section className="detailCard"><h2>Preparation roadmap</h2><div className="roadmap"><b>01 · Understand</b><span>Read the latest notification and map every eligibility condition.</span><b>02 · Build</b><span>Turn the verified syllabus and PYQs into a topic-wise study plan.</span><b>03 · Practice</b><span>Use sectional tests, full mocks and mistake analysis.</span><b>04 · Revise</b><span>Track weak topics, accuracy, speed and repeated PYQ concepts.</span><b>05 · Track</b><span>Monitor official admit card, answer key, result and next stage.</span></div></section>
   <section className="detailCard"><h2>Official source — ek jagah sab kuch</h2><p>Confusion ho to pehle <b>Latest notification</b> kholo. Wahi vacancy, eligibility, age, dates, fees aur exam rules ka final reference hai.</p><div className="cardLinks"><a className="primaryLink" href={e.notificationUrl||e.sourceUrl||e.officialUrl} target="_blank" rel="noopener noreferrer">{(e.notificationUrl||e.sourceUrl||e.officialUrl)===e.officialUrl?"Official source ↗":"Latest notification ↗"}</a><a href={e.officialUrl} target="_blank" rel="noopener noreferrer">Official website ↗</a>{canApply&&<a href={e.applyUrl!} target="_blank" rel="noopener noreferrer">Apply online ↗</a>}{applicationStatus!=="open"&&applicationStatus!=="unknown"&&<span className="detailOfficial">{applicationAction}</span>}</div><p><b>Data status:</b> {verificationLabel}{autoOverride?.stale?" · Last verified snapshot":" · Field-level official extraction"}</p>{e.lastVerified&&<p><b>Last official source check:</b> {sourceCheck?.lastChecked||e.lastVerified||"Not yet checked"}</p>}<p>This date records the latest successful automated check of the registered official source. It is not an expiry date; a failed source check is shown separately rather than treated as verified.</p><a className="primaryLink" href={e.officialUrl} target="_blank" rel="noopener noreferrer">Visit {e.organization} official portal ↗</a></section>
   <section className="detailCard"><h2>Automatic official updates</h2><p>SarkariPrep links this exam profile to the registered official-source feed. Application status is date-driven when the official data contains a clear application window, so it changes automatically from upcoming to open to closed without manual editing. Detected notices are shown automatically after the scheduled source check; exact vacancies, dates and eligibility are only treated as verified when the official notification supports them.</p>{trackedUpdates.length?<ul>{trackedUpdates.map(n=><li key={n.id}><a href={n.notificationUrl||n.officialUrl} target="_blank" rel="noopener noreferrer"><b>{n.title}</b></a> · {n.stage} · checked {n.lastChecked}</li>)}</ul>:<p className="notice">No exam-specific notice was matched in the latest generated feed. The authority source is still linked above and checked independently.</p>}</section>
   <section className="detailCard contactCard"><h2>Need notes or help with this exam?</h2><p>Is exam ke notes, preparation material, particular notification ya kisi information ke liye directly contact karein.</p><div className="cardLinks"><a className="primaryLink" href={examWhatsApp} target="_blank" rel="noopener noreferrer">WhatsApp · 7979748481 ↗</a><a href="mailto:saheebmahmood5@gmail.com?subject=SarkariPrep%20Exam%20%2F%20Notes%20Enquiry">Gmail ↗</a></div></section>
   <section className="detailCard"><h2>Frequently asked questions</h2><div className="faqGrid">{detail.faqs.map(([q,a])=><details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></section>
   <section className="detailCard"><h2>Data integrity</h2><p>{liveVerified?"This page contains a specifically verified current cycle record.":family?"This page is a recurring recruitment-family reference; current cycle facts are not asserted.":"This page is a structured historical reference and does not claim live vacancy/date accuracy."}</p>{sourceCheck&&<p><b>Source check:</b> {sourceCheck.health==="healthy"||(!sourceCheck.health&&sourceCheck.ok)?"Successful":sourceCheck.health==="degraded"?"Reached via official fallback":"Could not automatically reach the registered official source"} · {sourceCheck.lastChecked}{sourceCheck.error&&(" · Automatic connection check unavailable")}</p>}{sourceCheck&&!sourceCheck.ok&&<p className="notice">The automatic checker could not reach this authority during the latest run. No failed fetch is treated as proof that the official notice is unavailable, and unverified data is not promoted to verified status. Open the official source above for the latest controlling information.</p>}<p className="notice">SarkariPrep is an independent information platform, not a government department. The official notification remains the final authority.</p></section>
  <section className="detailCard" style={{marginBottom: "24px"}}>
    <h2>Explore related government exams</h2>
    <p>Compare related routes and continue to another relevant SarkariPrep guide.</p>
    <div className="cardLinks">
      {exams.filter(x => x.slug !== e.slug && (x.category === e.category || x.organization === e.organization)).slice(0,4).map(x => <a href={"/exams/" + x.slug} key={x.slug}>{x.name} →</a>)}
    </div>
    <div className="cardLinks">
      <a href="/government-jobs">Government jobs →</a>
      <a href="/upcoming-government-exams">Upcoming exams →</a>
      <a href="/jobs-after-graduation">Jobs after graduation →</a>
    </div>
  </section>
  </div>
 </div></main>
}
