export type FeedNotification = {
  title:string;
  stage:string;
  publishedDate?:string;
  lastChecked:string;
  officialUrl:string;
  notificationUrl?:string;
  description?:string;
  organization?:string;
};

const NOISE=/tender|procurement|supplier|vendor|purchase|e-proc|financial|audited\s+results?|quarterly\s+results?|annual\s+report|investor|shareholder|contract|\bbid\b|doctor registration|notice board|office memorandum|guidelines for conducting|duplicate certificate|previous year|calculation sheet|scanned images|validity period|re-exam.*2026|notice and announcement/i;
const JOB=/recruit|recruitment|vacan|career|appointment|engagement|advertisement|\bpost\b|assistant|officer|engineer|constable|technician|apprentice|nurse|teacher|selection|interview/i;
const EXAM=/exam|examination|cgl|chsl|cpo|ese|nda|cds|capf|\bje\b|ntpc|ctet|admit|answer key|result|test|correction window|application/i;

export function decodeFeedText(value:string){
  return value
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))
    .replace(/&(nbsp|amp|lt|gt|quot|apos|#39);/gi,(_,n)=>({nbsp:" ",amp:"&",lt:"<",gt:">",quot:'"',apos:"'", "#39":"'"} as Record<string,string>)[n.toLowerCase()]??_);
}

function urlDate(value?:string){
  if(!value)return null;
  const m=value.match(/(?:^|[^0-9])(20\d{2})[\/-](\d{1,2})(?:[\/-](\d{1,2}))?/);
  if(!m)return null;
  const y=Number(m[1]),mo=Number(m[2])-1,d=Number(m[3]??1);
  const dt=new Date(Date.UTC(y,mo,d));
  return Number.isNaN(dt.getTime())?null:dt;
}

export function feedDate(n:FeedNotification){
  const published=n.publishedDate?new Date(n.publishedDate):null;
  if(published&&!Number.isNaN(published.getTime()))return published;
  return urlDate(n.notificationUrl)||urlDate(n.title);
}

export function isFreshForFeed(n:FeedNotification, now=new Date()){
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) now = new Date();
  const d=feedDate(n);
  const title=decodeFeedText(n.title||"");
  const currentYear=now.getUTCFullYear();
  const explicitYears=[...title.matchAll(/\b(20\d{2})\b/g)].map(m=>Number(m[1]));
  if(explicitYears.some(y=>y<currentYear-1))return false;
  if(!d)return true;
  const ageDays=(now.getTime()-d.getTime())/86400000;
  const maxDays=n.stage==="Notice"?120:n.stage==="Application Open"||n.stage==="Recruitment"?240:180;
  return ageDays<=maxDays;
}

export function isFeedUseful(n:FeedNotification, now=new Date()){
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) now = new Date();
  const title=decodeFeedText(n.title||"");
  const blob=title+" "+decodeFeedText(n.description||"")+" "+(n.officialUrl||"")+" "+(n.notificationUrl||"");
  if(NOISE.test(blob))return false;
  try{
    const u=new URL(n.notificationUrl||n.officialUrl);
    if(/^tenders?\./i.test(u.hostname)||/\/tender|procurement|supplier|vendor|purchase/i.test(u.pathname))return false;
  }catch{}
  if(!isFreshForFeed(n,now))return false;
  if(n.stage==="Notice")return JOB.test(blob)||EXAM.test(blob);
  return JOB.test(blob)||EXAM.test(blob)||/Application Open|Upcoming|Admit Card|Answer Key|Result|Recruitment/.test(n.stage);
}

export function cleanFeedTitle(value:string){return decodeFeedText(value).replace(/\s+/g," ").trim();}
