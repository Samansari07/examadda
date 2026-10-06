export type ApplicationState = "open" | "upcoming" | "closed" | "unknown";
export type ExamState = "upcoming" | "ongoing" | "completed" | "unknown";

const MONTHS:Record<string,number>={jan:0,january:0,feb:1,february:1,mar:2,march:2,apr:3,april:3,may:4,jun:5,june:5,jul:6,july:6,aug:7,august:7,sep:8,september:8,oct:9,october:9,nov:10,november:10,dec:11,december:11};

function datesFromText(value:string):Date[]{
 const s=String(value||"");
 const out:Date[]=[];
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
 for(const m of s.matchAll(/\b(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+([A-Za-z]{3,9})\s+(20\d{2})\b/gi)){
  const month=MONTHS[m[3].toLowerCase()]; if(month===undefined) continue;
  for(const day of [+m[1],+m[2]]){const d=new Date(Date.UTC(+m[4],month,day,23,59,59)); if(!Number.isNaN(d.getTime())) out.push(d);}
 }
 return [...new Map(out.map(d=>[d.toISOString(),d])).values()].sort((a,b)=>a.getTime()-b.getTime());
}

function cycleYearOf(exam:{name?:string;slug?:string;cycleYear?:number},override?:{cycleYear?:number}){
 if(typeof override?.cycleYear==="number") return override.cycleYear;
 if(typeof exam.cycleYear==="number") return exam.cycleYear;
 const m=(String(exam.name||"")+" "+String(exam.slug||"")).match(/\b20\d{2}\b/);
 return m?Number(m[0]):new Date().getUTCFullYear();
}

export function getApplicationState(
 exam:{name?:string;slug?:string;cycleYear?:number;lastDate?:string;applicationStatus?:string},
 override?:{cycleYear?:number;applicationDates?:string;lastDate?:string;applicationStatus?:string},
 now=Date.now()
):ApplicationState{
 const year=cycleYearOf(exam,override);
 const currentYear=new Date(now).getUTCFullYear();

 // Historical cycles can never be "Application Starts Soon" or open because
 // a stale parser supplied a bad date/status.
 if(year<currentYear) return "closed";

 const explicit=(override?.applicationStatus||exam.applicationStatus||"").toLowerCase();
 const windowDates=datesFromText(override?.applicationDates||"");
 if(windowDates.length>=2){
  const start=windowDates[0].getTime(), end=windowDates[windowDates.length-1].getTime()+86400000-1;
  if(now<start) return "upcoming";
  if(now<=end) return "open";
  return "closed";
 }

 const raw=override?.lastDate||exam.lastDate||"";
 if(/application\s*(closed|over)|form\s*(closed|over)/i.test(raw)) return "closed";
 const rawDates=datesFromText(raw);
 if(rawDates.length>=2 && /application|apply|form|submission|registration|tentatively/i.test(raw)){
  const start=rawDates[0].getTime(), end=rawDates[rawDates.length-1].getTime()+86400000-1;
  if(now<start) return "upcoming";
  if(now<=end) return "open";
  return "closed";
 }
 if(rawDates.length===1 && /application|apply|form|submission|registration|last date/i.test(raw)){
  return rawDates[0].getTime()<now?"closed":"upcoming";
 }
 if(explicit==="open"||explicit==="closed"||explicit==="upcoming") return explicit;
 return "unknown";
}

export function getExamState(
 exam:{name?:string;slug?:string;cycleYear?:number;examDate?:string},
 override?:{cycleYear?:number;examDate?:string},
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
