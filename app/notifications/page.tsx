import {notifications} from "@/lib/notifications";
import {autoNotifications,autoNotificationMeta} from "@/lib/auto-notifications";
import {officialSources} from "@/lib/official-sources";
import {sourceStatuses} from "@/lib/source-status";
import {discoveredOfficialNotices} from "@/lib/discovered-official-notices";
import {cleanFeedTitle,isFeedUseful} from "@/lib/notification-feed";

export const metadata={title:"Latest Government Notifications | SarkariPrep",description:"Latest government exam and recruitment notifications from registered official sources.",alternates:{canonical:"https://sarkariprep.online/notifications"},openGraph:{title:"Latest Government Notifications | SarkariPrep",description:"Latest government exam and recruitment notifications from registered official sources.",url:"https://sarkariprep.online/notifications",siteName:"SarkariPrep",type:"website",locale:"en_IN",images:[{url:"https://sarkariprep.online/opengraph-image",width:1200,height:630,alt:"SarkariPrep notifications"}]},twitter:{card:"summary_large_image",title:"Latest Government Notifications | SarkariPrep",description:"Latest government exam and recruitment notifications from registered official sources.",images:["https://sarkariprep.online/opengraph-image"]}};

type NotificationCardItem={
 id:string; title:string; organization:string; category:string; publishedDate?:string;
 stage:"Application Open"|"Upcoming"|"Admit Card"|"Answer Key"|"Result"|"Recruitment"|"Notice";
 status:"Verified official"|"Detected on official source"; lastChecked:string; officialUrl:string;
 notificationUrl?:string; applyUrl?:string; applicationLastDate?:string; examDate?:string; qualification?:string; description:string;
};

export default function NotificationsPage(){
 const discovered=discoveredOfficialNotices as unknown as NotificationCardItem[];
 const rawMerged:NotificationCardItem[]=[...autoNotifications,...discovered,...notifications.filter(n=>!autoNotifications.some(a=>a.notificationUrl===n.notificationUrl)&&!discovered.some(d=>d.notificationUrl===n.notificationUrl))];
 const merged=rawMerged.filter(n=>isFeedUseful(n)).sort((a,b)=>new Date(b.publishedDate||b.lastChecked).getTime()-new Date(a.publishedDate||a.lastChecked).getTime());
 const open=merged.filter(n=>n.stage==="Application Open");
 const other=merged.filter(n=>n.stage!=="Application Open");
 const healthy=officialSources.filter(s=>sourceStatuses[s.id]?.ok).length;
 const stateSources=officialSources.filter(s=>s.region!=="Central").length;
 return <main className="directoryPage"><div className="wrap">
  <a className="backLink" href="/">← Back to SarkariPrep</a>
  <div className="directoryHero"><span className="tag">OFFICIAL DATA CENTRE</span><h1>Latest Notifications</h1><p>Central + State government recruitment aur exam updates ko registered official sources se automatically track karo.</p><div className="sourceBanner"><b>Automatic verification:</b> SarkariPrep regularly checks <strong>{officialSources.length} official government sources</strong> and keeps the original government link for every update. If a source is temporarily unavailable, we do not mark it as successfully checked.</div></div>
  <section className="section compact"><div className="statsStrip"><div><b>{officialSources.length}</b><span>official sources tracked</span></div><div><b>{stateSources}</b><span>State &amp; UT sources</span></div><div><b>{healthy}</b><span>sources reachable recently</span></div><div><b>{merged.length}</b><span>relevant updates shown</span></div></div></section>
  <section className="section compact"><div className="notificationTabs"><a className="filter active" href="#open">Application Open ({open.length})</a><a className="filter" href="#all">All updates ({merged.length})</a><a className="filter" href="#sources">Official sources</a><a className="filter" href="/exams">Exam details</a></div></section>
  <section className="section compact" id="open"><div className="sectionHead"><div><span className="eyebrow">ACTION NOW</span><h2>Application windows</h2></div></div><div className="notificationGrid">{open.length?open.map(n=><NotificationCard key={n.id} n={n}/>):<div className="detailCard"><h3>No automatically detected open application in the current feed.</h3><p>Source checks continue automatically. For a live application, open the relevant official authority source below.</p></div>}</div></section>
  <section className="section compact" id="all"><div className="sectionHead"><div><span className="eyebrow">OFFICIAL UPDATES</span><h2>Recent &amp; upcoming official updates</h2></div></div><div className="notificationGrid">{other.map(n=><NotificationCard key={n.id} n={n}/>)}</div></section>
  <section className="section compact" id="sources"><div className="sectionHead"><div><span className="eyebrow">OFFICIAL FEEDS</span><h2>Central, State & UT source index</h2></div><p>Original authority page/PDF yahin se open hota hai. SarkariPrep government notice ka replacement nahi hai.</p></div><div className="officialGrid">{officialSources.map(s=><a className="officialCard" href={s.updatesUrl} target="_blank" rel="noopener noreferrer" key={s.id}><b>{s.organization}</b><span>{s.region} · {s.category}</span><small>{sourceStatuses[s.id]?.ok?"✓ Checked recently":"⚠ Temporarily unavailable"} ↗</small></a>)}</div></section>
  <section className="section compact"><div className="detailCard contactCard"><span className="eyebrow">NEED HELP?</span><h2>Particular job, exam ya notification ke baare mein jaanna hai?</h2><p>Notes, notification details, exam information ya website se related problem ke liye WhatsApp ya Gmail par contact karein.</p><div className="cardLinks"><a className="primaryLink" href="https://wa.me/917979748481" target="_blank" rel="noopener noreferrer">WhatsApp · 7979748481 ↗</a><a href="mailto:saheebmahmood5@gmail.com?subject=SarkariPrep%20Exam%20%2F%20Notes%20Enquiry">Gmail · saheebmahmood5@gmail.com</a></div></div></section>
  <section className="section compact"><div className="alertPanel"><div><span className="eyebrow">AUTOMATIC UPDATES</span><h2>Fresh government updates, automatically tracked.</h2><p>SarkariPrep regularly checks official government sources and discovers relevant recruitment, exam and notification updates. Every item keeps a direct official link so you can verify the final details yourself.</p></div><a className="primaryLink" href="#sources">Browse official sources →</a></div></section>
 </div></main>
}
function NotificationCard({n}:{n:NotificationCardItem}){
 return <article className="notificationCard"><div className="examMeta"><span className="tag">{n.stage}</span><span className="verified">✓ {n.status}</span></div><h3>{cleanFeedTitle(n.title)}</h3><p className="org">{n.organization} · {n.category}</p><div className="miniFacts">{n.applicationLastDate&&<div><small>Last date</small><b>{n.applicationLastDate}</b></div>}{n.examDate&&<div><small>Exam date</small><b>{n.examDate}</b></div>}{n.qualification&&<div><small>Qualification</small><b>{n.qualification}</b></div>}<div><small>Checked</small><b>{n.lastChecked}</b></div></div><p>{n.description}</p><div className="cardLinks"><a className="primaryLink" href={n.notificationUrl||n.officialUrl} target="_blank" rel="noopener noreferrer">Original notice ↗</a>{n.applyUrl&&<a href={n.applyUrl} target="_blank" rel="noopener noreferrer">Apply ↗</a>}</div></article>
}