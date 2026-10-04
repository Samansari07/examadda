export type ApplicationState = "open" | "upcoming" | "closed" | "unknown";
export type ExamState = "upcoming" | "ongoing" | "completed" | "unknown";

const MONTHS:Record<string,number>={jan:0,january:0,feb:1,february:1,mar:2,march:2,apr:3,april:3,may:4,jun:5,june:5,jul:6,july:6,aug:7,august:7,sep:8,september:8,oct:9,october:9,nov:10,november:10,dec:11,december:11};

function datesFromText(value:string):Date[]{
 const out:Date[]=[];
 for(const m of value.matchAll(/20\d{2}-\d{2}-\d{2}/g)){
  const d=new Date(m[0]+"T23:59:59Z"); if(!Number.isNaN(d.getTime())) out.push(d);
 }
 for(const m of value.matchAll(/\b(\d{1,2})\s+([A-Za-z]{3,9})\s*[–—-]\s*(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b/g)){
  const monthA=MONTHS[m[2].toLowerCase()], monthB=MONTHS[m[4].toLowerCase()]; if(monthA===undefined||monthB===undefined) continue;
  const year=Number(m[5]);
  const a=new Date(Date.UTC(year,monthA,Number(m[1]),23,59,59)), b=new Date(Date.UTC(year,monthB,Number(m[3]),23,59,59));
  if(!Number.isNaN(a.getTime())) out.push(a); if(!Number.isNaN(b.getTime())) out.push(b);
 }
 for(const m of value.matchAll(/\b(\d{1,2})[\s–—-]+([A-Za-z]{3,9})[\s–—-]+(20\d{2})\b/g)){
  const month=MONTHS[m[2].toLowerCase()]; if(month===undefined) continue;
  const d=new Date(Date.UTC(Number(m[3]),month,Number(m[1]),23,59,59)); if(!Number.isNaN(d.getTime())) out.push(d);
 }
 return out.sort((a,b)=>a.getTime()-b.getTime());
}

export function getApplicationState(
 exam:{lastDate?:string;applicationStatus?:string},
 override?:{applicationDates?:string;lastDate?:string;applicationStatus?:string},
 now=Date.now()
):ApplicationState{
 const explicit=(override?.applicationStatus||exam.applicationStatus||"").toLowerCase();
 const windowText=override?.applicationDates||"";
 const windowDates=datesFromText(windowText);
 if(windowDates.length>=2){
  const start=windowDates[0].getTime(), end=windowDates[windowDates.length-1].getTime()+86400000-1;
  if(now<start) return "upcoming";
  if(now<=end) return "open";
  return "closed";
 }
 const raw=(override?.lastDate||exam.lastDate||"");
 if(/application\s*(closed|over)|form\s*(closed|over)/i.test(raw)) return "closed";
 const rawDates=datesFromText(raw);
 if(rawDates.length>=2 && /application|apply|form|submission|tentatively/i.test(raw)){
  const start=rawDates[0].getTime(), end=rawDates[rawDates.length-1].getTime()+86400000-1;
  if(now<start) return "upcoming";
  if(now<=end) return "open";
  return "closed";
 }
 if(rawDates.length===1 && rawDates[0].getTime()<now && !/see latest|notification-wise|notification/i.test(raw)) return "closed";
 if(explicit==="open"||explicit==="closed"||explicit==="upcoming") return explicit;
 return "unknown";
}

export function getExamState(
 exam:{examDate?:string},
 override?:{examDate?:string},
 now=Date.now()
):ExamState{
 const dates=datesFromText(override?.examDate||exam.examDate||"");
 if(!dates.length) return "unknown";
 if(now<dates[0].getTime()) return "upcoming";
 if(now<=dates[dates.length-1].getTime()+86400000-1) return "ongoing";
 return "completed";
}

export function applicationLabel(state:ApplicationState){
 return state==="open"?"Applications Open":state==="upcoming"?"Application Starts Soon":state==="closed"?"Application Closed":"Application Status Unconfirmed";
}
export function examLabel(state:ExamState){
 return state==="upcoming"?"Exam Upcoming":state==="ongoing"?"Exam In Progress":state==="completed"?"Exam Completed":"Exam Date TBA";
}
