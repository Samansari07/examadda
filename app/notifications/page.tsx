import {notifications} from "@/lib/notifications";
import {autoNotifications} from "@/lib/auto-notifications";
import {officialSources} from "@/lib/official-sources";

export const metadata={title:"Latest Government Notifications | SarkariPrep",description:"Official-source government exam and recruitment notification tracker."};

type NotificationCardItem={
 id:string; title:string; organization:string; category:string;
 stage:"Application Open"|"Upcoming"|"Admit Card"|"Answer Key"|"Result"|"Recruitment";
 status:"Verified official"; lastChecked:string; officialUrl:string;
 notificationUrl?:string; applyUrl?:string; applicationLastDate?:string; examDate?:string; qualification?:string; description:string;
};

export default function NotificationsPage(){
 const merged:NotificationCardItem[]=[...autoNotifications,...notifications.filter(n=>!autoNotifications.some(a=>a.notificationUrl===n.notificationUrl))];
 const open=merged.filter(n=>n.stage==="Application Open");
 const other=merged.filter(n=>n.stage!=="Application Open");
 return <main className="directoryPage"><div className="wrap">
  <a className="backLink" href="/">← Back to SarkariPrep</a>
  <div className="directoryHero"><span className="tag">OFFICIAL DATA CENTRE</span><h1>Latest Notifications</h1><p>Application, exam, admit card, answer key aur result updates ko official source ke saath track karo.</p><div className="sourceBanner"><b>Automatic verification:</b> SarkariPrep checks the registered official authority pages automatically. Every detected item keeps the original government link; if a source cannot be reached, it is not presented as a successful live check.</div></div>
  <section className="section compact"><div className="notificationTabs"><a className="filter active" href="#open">Application Open ({open.length})</a><a className="filter" href="#all">All official updates ({merged.length})</a><a className="filter" href="/exams">Exam details</a></div></section>
  <section className="section compact" id="open"><div className="sectionHead"><div><span className="eyebrow">ACTION NOW</span><h2>Application windows</h2></div></div><div className="notificationGrid">{open.map(n=><NotificationCard key={n.id} n={n}/>)}</div></section>
  <section className="section compact" id="all"><div className="sectionHead"><div><span className="eyebrow">AUTOMATIC OFFICIAL FEED</span><h2>Recent & upcoming</h2></div></div><div className="notificationGrid">{other.map(n=><NotificationCard key={n.id} n={n}/>)}</div></section>
  <section className="section compact" id="sources"><div className="sectionHead"><div><span className="eyebrow">OFFICIAL FEEDS</span><h2>Authority source index</h2></div><p>Original authority page/PDF yahin se open hota hai. SarkariPrep government notice ka replacement nahi hai.</p></div><div className="officialGrid">{officialSources.map(s=><a className="officialCard" href={s.updatesUrl} target="_blank" rel="noopener noreferrer" key={s.id}><b>{s.organization}</b><span>{s.category} · Official updates ↗</span></a>)}</div></section>
  <section className="section compact"><div className="detailCard contactCard"><span className="eyebrow">NEED HELP?</span><h2>Particular job, exam ya notification ke baare mein jaanna hai?</h2><p>Notes, notification details, exam information ya website se related problem ke liye WhatsApp ya Gmail par contact karein.</p><div className="cardLinks"><a className="primaryLink" href="https://wa.me/917979748481" target="_blank" rel="noopener noreferrer">WhatsApp · 7979748481 ↗</a><a href="mailto:saheebmahmood5@gmail.com?subject=SarkariPrep%20Exam%20%2F%20Notes%20Enquiry">Gmail · saheebmahmood5@gmail.com</a></div></div></section>
  <section className="section compact"><div className="alertPanel"><div><span className="eyebrow">ALERTS</span><h2>Don&apos;t miss important dates.</h2><p>Automatic source checking is active through the repository scheduler. Exam save karna local hai; email/push alerts ke liye account backend alag se connect karna hoga.</p></div><a className="primaryLink" href="/#exams">Save an exam →</a></div></section>
 </div></main>
}
function NotificationCard({n}:{n:NotificationCardItem}){
 return <article className="notificationCard"><div className="examMeta"><span className="tag">{n.stage}</span><span className="verified">✓ {n.status}</span></div><h3>{n.title}</h3><p className="org">{n.organization} · {n.category}</p><div className="miniFacts">{n.applicationLastDate&&<div><small>Last date</small><b>{n.applicationLastDate}</b></div>}{n.examDate&&<div><small>Exam date</small><b>{n.examDate}</b></div>}{n.qualification&&<div><small>Qualification</small><b>{n.qualification}</b></div>}<div><small>Last checked</small><b>{n.lastChecked}</b></div></div><p>{n.description}</p><div className="cardLinks"><a className="primaryLink" href={n.notificationUrl||n.officialUrl} target="_blank" rel="noopener noreferrer">Original notice ↗</a>{n.applyUrl&&<a href={n.applyUrl} target="_blank" rel="noopener noreferrer">Apply ↗</a>}</div></article>
}