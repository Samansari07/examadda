export type ExamLifecycle =
  | "upcoming"
  | "application-open"
  | "application-closed"
  | "exam-completed"
  | "result-declared"
  | "counselling-active"
  | "cycle-closed"
  | "historical";

const MONTHS:Record<string,number>={jan:0,january:0,feb:1,february:1,mar:2,march:2,apr:3,april:3,may:4,jun:5,june:5,jul:6,july:6,aug:7,august:7,sep:8,september:8,oct:9,october:9,nov:10,november:10,dec:11,december:11};

export function extractDates(value:string):Date[]{
 const s=String(value||""); const out:Date[]=[];
 for(const m of s.matchAll(/\b(20\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/g)){
  const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3],23,59,59)); if(!Number.isNaN(d.getTime())) out.push(d);
 }
 for(const m of s.matchAll(/\b(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})\b/g)){
  const y=+m[3]<100?2000+ +m[3]:+m[3]; const d=new Date(Date.UTC(y,+m[2]-1,+m[1],23,59,59)); if(!Number.isNaN(d.getTime())) out.push(d);
 }
 for(const m of s.matchAll(/\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b/g)){
  const month=MONTHS[m[2].toLowerCase()]; if(month===undefined) continue;
  const d=new Date(Date.UTC(+m[3],month,+m[1],23,59,59)); if(!Number.isNaN(d.getTime())) out.push(d);
 }
 for(const m of s.matchAll(/\b(\d{1,2})\s+([A-Za-z]{3,9})\s*[-–—]\s*(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b/gi)){
  const m1=MONTHS[m[2].toLowerCase()], m2=MONTHS[m[4].toLowerCase()]; if(m1===undefined||m2===undefined) continue;
  for(const [day,month] of [[+m[1],m1],[+m[3],m2]] as const){const d=new Date(Date.UTC(+m[5],month,day,23,59,59)); if(!Number.isNaN(d.getTime())) out.push(d);}
 }
 for(const m of s.matchAll(/\b(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b/gi)){
  const month=MONTHS[m[3].toLowerCase()]; if(month===undefined) continue;
  for(const day of [+m[1],+m[2]]){const d=new Date(Date.UTC(+m[4],month,day,23,59,59)); if(!Number.isNaN(d.getTime())) out.push(d);}
 }
 return [...new Map(out.map(d=>[d.toISOString(),d])).values()].sort((a,b)=>a.getTime()-b.getTime());
}

function cycleYearFromExam(exam:{name:string;slug:string;examDate:string;cycleYear?:number}){
 if(typeof exam.cycleYear==="number") return exam.cycleYear;
 const matches=(exam.name+" "+exam.slug+" "+exam.examDate).match(/20\d{2}/g)?.map(Number)||[];
 return matches.length?Math.max(...matches):new Date().getUTCFullYear();
}

export function inferExamLifecycle(
 exam:{name:string;slug:string;examDate:string;lastDate:string;officialUrl?:string;applicationStatus?:string;dataStatus?:string;lifecycleSourceHosts?:string[];lifecycleKeywords?:string[];cycleYear?:number},
 notices:Array<{title:string;stage?:string;lastChecked?:string;officialUrl?:string;notificationUrl?:string}>=[],
):ExamLifecycle{
 const now=Date.now(), year=cycleYearFromExam(exam), currentYear=new Date().getUTCFullYear();
 const dates=extractDates((exam.examDate||"")+" "+(exam.lastDate||""));
 const applicationDates=extractDates(exam.lastDate||"");
 const examHost=(()=>{try{return new URL(exam.officialUrl||"").hostname.replace(/^www\./,"").toLowerCase()}catch{return ""}})();

 const relevant=notices.filter(n=>{
  const checked=n.lastChecked?Date.parse(n.lastChecked+"T23:59:59Z"):0;
  if(!checked||checked<now-120*86400000)return false;
  const noticeHost=(()=>{try{return new URL(n.officialUrl||n.notificationUrl||"").hostname.replace(/^www\./,"").toLowerCase()}catch{return ""}})();
  const allowed=[examHost,...(exam.lifecycleSourceHosts||[])].filter(Boolean).map(x=>x.replace(/^www\./,"").toLowerCase());
  if(!allowed.some(h=>noticeHost===h||noticeHost.endsWith("."+h)||h.endsWith("."+noticeHost)))return false;
  const noticeBlob=n.title+" "+(n.notificationUrl||"")+" "+(n.officialUrl||"");
  const hay=noticeBlob.toLowerCase();
  const noticeYears=noticeBlob.match(/\b20\d{2}\b/g)?.map(Number)||[];
  if(noticeYears.length && !noticeYears.includes(year)) return false;

  const examTokens=exam.name.toLowerCase().replace(/[^a-z0-9]+/g," ").split(" ").filter(x=>x.length>=4&&!/^20\d{2}$/.test(x));
  const tokens=[...examTokens,...(exam.lifecycleKeywords||[]).map(x=>x.toLowerCase())];
  return tokens.some(t=>hay.includes(t));
 });

 const text=relevant.map(n=>(n.title+" "+(n.stage||"")).toLowerCase()).join(" ");
 if(year<currentYear && /counselling|counseling|seat allotment|admission|reporting|choice filling|medical/.test(text)) return "counselling-active";
 const resultSignal=/result|score card|merit list|final result|rank card|selection list/.test(text);
 if(resultSignal && (!examDates.length || now>=examDates[0].getTime())) return "result-declared";

 // Hard stop: an old cycle can never become upcoming/application-open again.
 if(year<currentYear){
  return dates.length&&now>dates[dates.length-1].getTime()+86400000?"cycle-closed":"historical";
 }
 if(exam.applicationStatus==="open") return "application-open";
 if(applicationDates.length>=2&&now>=applicationDates[0].getTime()&&now<=applicationDates[applicationDates.length-1].getTime()+86400000) return "application-open";
 if(dates.length&&now<dates[0].getTime()) return "upcoming";
 if(dates.length&&now>dates[dates.length-1].getTime()+86400000) return "exam-completed";
 if(exam.applicationStatus==="closed") return "application-closed";
 return "upcoming";
}

export function lifecycleLabel(status:ExamLifecycle){
 return ({
  "upcoming":"Upcoming",
  "application-open":"Applications Open",
  "application-closed":"Applications Closed",
  "exam-completed":"Exam Completed",
  "result-declared":"Result Declared",
  "counselling-active":"Counselling / Medical Active",
  "cycle-closed":"Cycle Closed",
  "historical":"Historical Reference"
 } as Record<ExamLifecycle,string>)[status];
}
