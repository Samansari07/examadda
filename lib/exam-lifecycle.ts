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
  const out:Date[]=[];
  for(const m of value.matchAll(/20\d{2}-\d{2}-\d{2}/g)){
    const d=new Date(m[0]+"T23:59:59Z"); if(!Number.isNaN(d.getTime())) out.push(d);
  }
  for(const m of value.matchAll(/\b(\d{1,2})[\s–—-]+([A-Za-z]{3,9})[\s–—-]+(20\d{2})\b/g)){
    const month=MONTHS[m[2].toLowerCase()]; if(month===undefined) continue;
    const d=new Date(Date.UTC(Number(m[3]),month,Number(m[1]),23,59,59)); if(!Number.isNaN(d.getTime())) out.push(d);
  }
  return out.sort((a,b)=>a.getTime()-b.getTime());
}

function cycleYearFromExam(exam:{name:string;slug:string;examDate:string}){
  const matches=(exam.name+" "+exam.slug+" "+exam.examDate).match(/20\d{2}/g)?.map(Number)||[];
  return matches.length?Math.max(...matches):new Date().getUTCFullYear();
}

export function inferExamLifecycle(
  exam:{name:string;slug:string;examDate:string;lastDate:string;officialUrl?:string;applicationStatus?:string;dataStatus?:string;lifecycleSourceHosts?:string[];lifecycleKeywords?:string[]},
  notices:Array<{title:string;stage?:string;lastChecked?:string;officialUrl?:string;notificationUrl?:string}>=[]
):ExamLifecycle{
  const now=Date.now();
  const year=cycleYearFromExam(exam);
  const raw=(exam.examDate||"")+" "+(exam.lastDate||"");
  const dates=extractDates(raw);
  const applicationDates=extractDates(exam.lastDate||"");
  if(exam.applicationStatus==="open") return "application-open";
  if(applicationDates.length>=2 && now>=applicationDates[0].getTime() && now<=applicationDates[applicationDates.length-1].getTime()+86400000) return "application-open";
  if(dates.length && now<dates[0].getTime() && year>=new Date().getUTCFullYear()) return "upcoming";

  const currentYear=year===new Date().getUTCFullYear();
  const freshCutoff=now-120*86400000;
  const relevant=notices.filter(n=>{
    const checked=n.lastChecked?Date.parse(n.lastChecked+"T23:59:59Z"):0;
    if(!checked || checked<freshCutoff) return false;
    const hay=(n.title+" "+(n.notificationUrl||"")+" "+(n.officialUrl||"")).toLowerCase();
    const noticeHost=(()=>{try{return new URL(n.officialUrl||n.notificationUrl||"").hostname.replace(/^www\./,"").toLowerCase()}catch{return ""}})();
    const examHost=(()=>{try{return new URL(exam.officialUrl||"").hostname.replace(/^www\./,"").toLowerCase()}catch{return ""}})();
    const allowedHosts=[examHost,...(exam.lifecycleSourceHosts||[])].filter(Boolean).map(x=>x.replace(/^www\./,"").toLowerCase());
    const hostMatched=allowedHosts.includes(noticeHost);
    const examName=exam.name.toLowerCase().replace(/[^a-z0-9]+/g," ");
    const tokens=[...examName.split(" ").filter(x=>x.length>=3 && !/^20\\d{2}$/.test(x)),...(exam.lifecycleKeywords||[]).map(x=>x.toLowerCase())];
    const keywordMatched=tokens.some(t=>hay.includes(t));
    if(currentYear && !hay.includes(String(year)) && !(hostMatched && (exam.lifecycleSourceHosts||[]).some(h=>h.includes(noticeHost)))) return false;
    return hostMatched && keywordMatched;
  });
  const text=relevant.map(n=>(n.title+" "+(n.stage||"")).toLowerCase()).join(" ");
  if(/counselling|counseling|seat allotment|admission|reporting|choice filling/.test(text)) return "counselling-active";
  if(/result|score card|merit list|final result|rank card|selection list/.test(text)) return "result-declared";

  const examDates=extractDates(exam.examDate||"");
  if(examDates.length && now>examDates[examDates.length-1].getTime()+86400000){
    if(currentYear) return "exam-completed";
    return relevant.length?"cycle-closed":"historical";
  }
  if(exam.applicationStatus==="closed") return currentYear?"application-closed":"historical";
  if(currentYear) return "upcoming";
  return "historical";
}

export function lifecycleLabel(status:ExamLifecycle){
  return ({
    "upcoming":"Upcoming",
    "application-open":"Applications Open",
    "application-closed":"Applications Closed",
    "exam-completed":"Exam Completed",
    "result-declared":"Result Declared",
    "counselling-active":"Counselling / Admission Active",
    "cycle-closed":"Cycle Closed",
    "historical":"Historical Reference"
  } as Record<ExamLifecycle,string>)[status];
}
