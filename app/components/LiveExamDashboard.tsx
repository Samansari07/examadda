import {exams} from "@/lib/exams";
import {autoNotifications, autoNotificationMeta} from "@/lib/auto-notifications";

function parseDate(value?: string){
  if(!value) return null;
  const m=value.match(/(20\d{2})[-/](\d{1,2})[-/](\d{1,2})/);
  if(m) return new Date(Date.UTC(+m[1],+m[2]-1,+m[3]));
  const m2=value.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})/i);
  if(m2){
    const months=["january","february","march","april","may","june","july","august","september","october","november","december"];
    return new Date(Date.UTC(+m2[3],months.indexOf(m2[2].toLowerCase()),+m2[1]));
  }
  return null;
}
function dateLabel(value:string){
  const d=parseDate(value);
  if(!d) return value;
  return new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(d);
}
function cleanName(name:string){
  return name.replace(/\s+202[0-9]\b/g,"").replace(/\s+/g," ").trim();
}

export default function LiveExamDashboard(){
  const now=new Date();
  const upcoming=exams.map(e=>({e,d:parseDate(e.examDate)}))
    .filter(x=>x.d && x.d.getTime()>=now.getTime()-86400000 && x.e.dataStatus==="official-verified")
    .sort((a,b)=>a.d!.getTime()-b.d!.getTime()).slice(0,8);

  const deadlines=exams.map(e=>({e,d:parseDate(e.lastDate)}))
    .filter(x=>x.d && x.d.getTime()>=now.getTime() && x.e.dataStatus==="official-verified")
    .sort((a,b)=>a.d!.getTime()-b.d!.getTime()).slice(0,6);

  const next=upcoming[0];
  const verifiedCount=exams.filter(e=>e.dataStatus==="official-verified").length;

  return <section className="liveCommand" aria-label="Live government exam updates">
    <div className="wrap">
      <div className="liveTop">
        <div>
          <span className="eyebrow">LIVE EXAM COMMAND CENTRE</span>
          <h2>Abhi kya open hai, kya aa raha hai?</h2>
          <p>Officially verified cycle data ko priority milti hai. Missing or ambiguous dates are never guessed.</p>
        </div>
        <div className="liveHealth">
          <span className="liveDot"/> AUTO REFRESH
          <b>{autoNotificationMeta.sourceCount} official sources</b>
          <small>{autoNotificationMeta.successfulSources} sources reachable in latest refresh</small>
        </div>
      </div>

      {next && <div className="nextExamHero">
        <div>
          <span className="liveBadge">🔥 NEXT VERIFIED EXAM</span>
          <h3>{next.e.name}</h3>
          <p>{next.e.organization} · {next.e.category}</p>
        </div>
        <div className="nextDate">
          <small>EXAM DATE</small>
          <strong>{dateLabel(next.e.examDate)}</strong>
          <span>{Math.max(0,Math.ceil((next.d!.getTime()-now.getTime())/86400000))} days to go</span>
        </div>
        <a href={"/exams/"+next.e.slug}>View complete guide →</a>
      </div>}

      <div className="liveColumns">
        <div className="liveBox">
          <div className="liveBoxHead"><div><span className="liveKicker">🟠 DEADLINES</span><h3>Dates coming up</h3></div><a href="/notifications">All updates →</a></div>
          {deadlines.length ? deadlines.map(({e,d})=><a className="liveRow" href={"/exams/"+e.slug} key={e.slug}>
            <span className="liveIcon">!</span><div><b>{cleanName(e.name)}</b><small>{e.organization}</small></div>
            <strong>{dateLabel(e.lastDate)}</strong>
          </a>) : <div className="liveEmpty">No verified upcoming application deadline is available in the current dataset.</div>}
        </div>

        <div className="liveBox">
          <div className="liveBoxHead"><div><span className="liveKicker">⏰ UPCOMING</span><h3>Exams coming soon</h3></div><a href="/upcoming-government-exams">Calendar →</a></div>
          {upcoming.slice(0,5).map(({e,d})=><a className="liveRow" href={"/exams/"+e.slug} key={e.slug}>
            <span className="liveIcon">→</span><div><b>{cleanName(e.name)}</b><small>{e.organization}</small></div>
            <strong>{Math.max(0,Math.ceil((d!.getTime()-now.getTime())/86400000))}d</strong>
          </a>)}
        </div>

        <div className="liveBox">
          <div className="liveBoxHead"><div><span className="liveKicker">🆕 OFFICIAL UPDATES</span><h3>What changed recently</h3></div><a href="/notifications">Open →</a></div>
          {autoNotifications.slice(0,5).map(n=><a className="liveRow" href={n.notificationUrl||n.officialUrl} target="_blank" rel="noopener noreferrer" key={n.id}>
            <span className="liveIcon">↗</span><div><b>{n.title}</b><small>{n.organization} · {n.stage}</small></div>
            <strong>{n.lastChecked}</strong>
          </a>)}
        </div>
      </div>

      <div className="liveFooter">
        <span><b>{verifiedCount}</b> officially verified cycle guides</span>
        <span>•</span>
        <span>Last generated: <b>{autoNotificationMeta.generatedAt}</b></span>
        <span>•</span>
        <span>Official source links remain the final authority.</span>
      </div>
    </div>
  </section>;
}
