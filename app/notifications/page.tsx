import {notifications} from "@/lib/notifications";
import {officialSources} from "@/lib/official-sources";

export const metadata={title:"Latest Government Notifications | SarkariPrep",description:"Official-source government exam and recruitment notification tracker."};

export default function NotificationsPage(){
 const open=notifications.filter(n=>n.stage==="Application Open");
 const other=notifications.filter(n=>n.stage!=="Application Open");
 return <main className="directoryPage"><div className="wrap">
  <a className="backLink" href="/">← Back to SarkariPrep</a>
  <div className="directoryHero"><span className="tag">OFFICIAL DATA CENTRE</span><h1>Latest Notifications</h1><p>Application, exam, admit card, answer key aur result updates ko official source ke saath track karo.</p><div className="sourceBanner"><b>Verification rule:</b> SarkariPrep listings show the official source and last-checked date. Final eligibility, vacancy, fee and dates must be verified on the authority portal.</div></div>
  <section className="section compact"><div className="notificationTabs"><a className="filter active" href="#open">Application Open ({open.length})</a><a className="filter" href="#all">All official updates ({notifications.length})</a><a className="filter" href="/exams">Exam details</a></div></section>
  <section className="section compact" id="open"><div className="sectionHead"><div><span className="eyebrow">ACTION NOW</span><h2>Application windows</h2></div></div><div className="notificationGrid">{open.map(n=><NotificationCard key={n.id} n={n}/>)}</div></section>
  <section className="section compact" id="all"><div className="sectionHead"><div><span className="eyebrow">OFFICIAL SOURCE INDEX</span><h2>Recent & upcoming</h2></div></div><div className="notificationGrid">{other.map(n=><NotificationCard key={n.id} n={n}/>)}</div></section>
  <section className="section compact" id="sources"><div className="sectionHead"><div><span className="eyebrow">OFFICIAL FEEDS</span><h2>Authority source index</h2></div><p>Yahan se original authority page/PDF open hota hai. SarkariPrep source ko retype karke government notice ka replacement nahi banata.</p></div><div className="officialGrid">{officialSources.map(s=><a className="officialCard" href={s.updatesUrl} target="_blank" rel="noopener noreferrer" key={s.id}><b>{s.organization}</b><span>{s.category} · Official updates ↗</span></a>)}</div></section>
  <section className="section compact"><div className="alertPanel"><div><span className="eyebrow">ALERTS</span><h2>Don&apos;t miss important dates.</h2><p>Exam ko save karo. SarkariPrep ka current shortlist browser mein locally save hota hai; real email/push alerts ke liye future account + notification backend connect kiya ja sakta hai.</p></div><a className="primaryLink" href="/#exams">Save an exam →</a></div></section>
 </div></main>
}
function NotificationCard({n}:{n:(typeof notifications)[number]}){
 return <article className="notificationCard"><div className="examMeta"><span className="tag">{n.stage}</span><span className="verified">✓ {n.status}</span></div><h3>{n.title}</h3><p className="org">{n.organization} · {n.category}</p><div className="miniFacts">{n.applicationLastDate&&<div><small>Last date</small><b>{n.applicationLastDate}</b></div>}{n.examDate&&<div><small>Exam date</small><b>{n.examDate}</b></div>}{n.qualification&&<div><small>Qualification</small><b>{n.qualification}</b></div>}<div><small>Last checked</small><b>{n.lastChecked}</b></div></div><p>{n.description}</p><div className="cardLinks"><a className="primaryLink" href={n.notificationUrl||n.officialUrl} target="_blank" rel="noopener noreferrer">Original notice ↗</a>{n.applyUrl&&<a href={n.applyUrl} target="_blank" rel="noopener noreferrer">Apply ↗</a>}</div></article>
}