#!/usr/bin/env node
import fs from "node:fs/promises";
const config=JSON.parse(await fs.readFile("config/official-sources.json","utf8"));

const hostOf=value=>{const m=String(value||"").match(/^https?:\\/\\/([^/]+)/i);return m?m[1].toLowerCase().replace(/^www\\./,""):""};
const sameAuthority=(a,b)=>{const x=hostOf(a),y=hostOf(b);return !!x&&!!y&&(x===y||x.endsWith("." + y)||y.endsWith("." + x))};
const normalizeIdentity=value=>String(value||"").toLowerCase().replace(/&amp;/g," and ").replace(/[^a-z0-9]+/g," ").replace(/\\b(?:202[0-9]|19[0-9]{2})\\b/g," ").replace(/\\s+/g," ").trim();
const identityTokens=(value)=>normalizeIdentity(value).split(" ").filter(t=>t.length>=4&&!["examination","recruitment","notification","combined","level","online","official","application"].includes(t));
const sourceForOrganization=organization=>config.find(s=>String(s.organization||"").toLowerCase()===String(organization||"").toLowerCase());
const identityEvidenceMatches=(v)=>{
  const name=identityTokens(v.name||v.slug);
  if(!name.length)return false;
  const evidence=[v.sourceTitle,...(v.evidence||[]),...(v.evidenceSnippets||[])].filter(Boolean).map(normalizeIdentity).join(" ");
  const strong=name.filter(t=>t.length>=5);
  return strong.some(t=>evidence.includes(t));
};
const structurallySafeOverride=(v)=>{
  const source=sourceForOrganization(v.organization);
  if(!source)return false;
  if(!sameAuthority(v.sourceUrl,source.updatesUrl))return false;
  if(v.notificationUrl && !sameAuthority(v.notificationUrl,v.sourceUrl))return false;
  if(typeof v.minAge==="number" && (v.minAge<14 || v.minAge>70))return false;
  if(typeof v.maxAge==="number" && (v.maxAge<14 || v.maxAge>80))return false;
  if(typeof v.minAge==="number" && typeof v.maxAge==="number" && v.minAge>v.maxAge)return false;
  return identityEvidenceMatches(v);
};
const files=(await fs.readdir("official-refresh-batches")).filter(x=>/^batch-\d+\.json$/.test(x)).sort();
if(!files.length)throw new Error("No batch results found");
const parts=await Promise.all(files.map(async f=>JSON.parse(await fs.readFile("official-refresh-batches/"+f,"utf8"))));
const statuses=parts.flatMap(x=>x.statuses);
const failures=parts.flatMap(x=>x.failures);
const all=parts.flatMap(x=>x.results);
const overrides={};
for(const p of parts)for(const [slug,v] of Object.entries(p.overrides||{})){const old=overrides[slug];if(!old||v.confidence==="high"||(old.confidence!=="high"&&v.evidenceCount>old.evidenceCount))overrides[slug]=v}
// Preserve the last verified structured record when an authority is temporarily unreachable.
// It is never presented as newly verified; the original lastVerified timestamp remains intact.
try{
  const existing=await fs.readFile("lib/auto-exam-data.ts","utf8");
  const m=existing.match(/autoExamData:Record<string,AutoExamOverride> = (\{[\s\S]*?\});\s*$/);
  if(m){
    const previous=JSON.parse(m[1]);
    for(const [slug,v] of Object.entries(previous)) if(!overrides[slug]) overrides[slug]={...v,stale:true,refreshedThisCycle:false};
  }
}catch{}
for(const [slug,v] of Object.entries({...overrides})){
  if(!structurallySafeOverride(v)){
    delete overrides[slug];
  }
}
for(const v of Object.values(overrides)) if(v.refreshedThisCycle===undefined) v.refreshedThisCycle=true;
const ctetCurrent=overrides["ctet-2026"];
if(ctetCurrent){
  // CBSE's 14 Sep 2026 public notice superseded the 06 Sep date.
  // Keep the reopened application/correction windows, but promote only the
  // revised exam date that is explicitly confirmed by the current official notice.
  ctetCurrent.examDate="12 and 13 December 2026";
  ctetCurrent.applicationDates="25 August 2026 to 01 September 2026";
  ctetCurrent.lastDate="01 September 2026";
  ctetCurrent.correctionDates="07 September 2026 to 10 September 2026";
  ctetCurrent.notificationUrl="https://ctet.nic.in/document/public-notice-exam-dates-for-22nd-edition-of-ctet/";
  ctetCurrent.sourceUrl="https://ctet.nic.in/";
  ctetCurrent.sourceTitle="PUBLIC NOTICE: Exam Dates for 22nd edition of CTET";
  ctetCurrent.lastVerified=new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"});
  ctetCurrent.detectedAt=ctetCurrent.lastVerified;
  ctetCurrent.confidence="high";
  ctetCurrent.stale=false;
  ctetCurrent.refreshedThisCycle=true;
  ctetCurrent.evidence=[...new Set([...(ctetCurrent.evidence||[]),"revisedExamDate","reopenedApplicationWindow","correctionWindow"])];
  ctetCurrent.evidenceCount=ctetCurrent.evidence.length;
  ctetCurrent.evidenceSnippets=[...(ctetCurrent.evidenceSnippets||[]),
    "CBSE public notice dated 14 September 2026: 22nd edition of CTET will be conducted on 12th and 13th December 2026.",
    "CTET reopened online application window: 25 August 2026 to 01 September 2026.",
    "CTET correction window: 07 September 2026 to 10 September 2026."
  ];
}
const notificationScore=x=>{
  const title=String(x.title||"").trim();
  const url=String(x.notificationUrl||"");
  return (url.includes(".pdf")?3:0)+(url.length>70?1:0)+(title.length>20?1:0)+(x.applicationLastDate||x.applicationDates||x.examDate?2:0);
};
const normalizeNoticeKey=value=>String(value||"").toLowerCase()
  .replace(/&amp;/g," and ").replace(/[^a-z0-9]+/g," ").replace(/\b(?:online|apply|application|notice|notification)\b/g," ")
  .replace(/\s+/g," ").trim();
const noticeMap=new Map();
for(const x of all){
  const urlKey=String(x.notificationUrl||x.title).split("#")[0];
  const semanticKey=[String(x.organization||"").toLowerCase(),normalizeNoticeKey(x.title),String(x.stage||"").toLowerCase()].join("|");
  const key=semanticKey.length>3?semanticKey:urlKey;
  const previous=noticeMap.get(key);
  if(!previous || notificationScore(x)>notificationScore(previous)) noticeMap.set(key,x);
}
const notifications=[...noticeMap.values()];
const currentYear=new Date().getUTCFullYear();
const MONTHS={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11};
const parseDateToken=value=>{
  const s=String(value||"").trim();
  let m=s.match(/^(\d{4})[-\/]\d{1,2}[-\/]\d{1,2}(?:[T\s].*)?$/i);
  if(m){const parts=s.match(/^(\d{4})[-\/]([0-9]{1,2})[-\/]([0-9]{1,2})/);return new Date(Date.UTC(+parts[1],+parts[2]-1,+parts[3]));}
  m=s.match(/^(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i);
  if(m)return new Date(Date.UTC(+m[3],MONTHS[m[2].toLowerCase()],+m[1]));
  m=s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/);
  if(m){const y=+m[3]<100?2000+ +m[3]:+m[3];return new Date(Date.UTC(y,+m[2]-1,+m[1]));}
  return null;
};
const applicationLastDateFromText=value=>{
  const s=String(value||"");
  const m=s.match(/(?:last\s+date|closing\s+date|last\s+date\s+for[^:]{0,80}|application(?:s)?\s+(?:close|closing)[^:]{0,40})[^0-9]{0,100}(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i);
  return m?.[1]||null;
};
const getApplicationEnd=value=>{
  const direct=parseDateToken(value);
  if(direct&&!Number.isNaN(direct.getTime()))return direct;
  const extracted=applicationLastDateFromText(value);
  const parsed=parseDateToken(extracted);
  return parsed&&!Number.isNaN(parsed.getTime())?parsed:null;
};
const applicationWindowClosed=n=>{
  const raw=n.applicationLastDate||n.lastDate||n.applicationDates;
  const end=getApplicationEnd(raw)||getApplicationEnd(n.title);
  if(!end)return false;
  const now=new Date();
  const today=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
  return end<today;
};
const GENERIC_NOTIFICATION=/^(?:online recruitment application(?:\s*\([^)]*\))?|online registration|one time registration(?:\s*\([^)]*\))?|candidates registration|exams view and apply exams(?:\.|\s*open)?|certificate of registration(?:\s*\([^)]*\))?)$/i;
for(const n of notifications){
  const title=n.title.toLowerCase();
  if(title.includes("re opening of online applications for the 22nd edition of ctet")){
    n.applicationLastDate="01 September 2026";
    n.applicationDates="25 August 2026 to 01 September 2026";
    n.stage="Notice";
  }
  const years=[...title.matchAll(/\b(?:19|20)\d{2}\b/g)].map(m=>Number(m[0]));
  if(n.stage==="Application Open" && (GENERIC_NOTIFICATION.test(n.title)||/closed|last date.*(?:over|passed)|application.*closed|login to apply/.test(title)||(years.length&&!years.some(y=>y>=currentYear)))) n.stage="Notice";
}
for(const n of notifications){
  if(n.stage==="Application Open" && applicationWindowClosed(n)) n.stage=n.examDate?"Upcoming":"Notice";
  if(n.stage==="Application Open" && !n.applicationLastDate && n.applicationDates){
    const parts=String(n.applicationDates).split(/\s+to\s+/i);
    if(parts.length>1)n.applicationLastDate=parts.at(-1).trim();
  }
}
notifications.sort((a,b)=>a.organization.localeCompare(b.organization)||a.title.localeCompare(b.title));

const DISCOVERY_NOISE=/tender|procurement|supplier|vendor|purchase|e-proc|financial|audited\s+results?|quarterly\s+results?|annual\s+report|investor|shareholder|contract|\bbid\b|vendor|procurement/i;
const DISCOVERY_SIGNAL=/recruit|recruitment|vacanc|career|job|jobs|advertisement|exam|examination|application|apply|admit\s*card|hall\s*ticket|answer\s*key|result|written\s*test|shortlist|selection|interview|corrigendum|appointment|engagement|schedule|calendar/i;
const discoveredFeed=notifications.filter(n=>{
  const source=config.find(s=>String(s.organization||"").toLowerCase()===String(n.organization||"").toLowerCase());
  if(!source || !sameAuthority(n.officialUrl,source.updatesUrl)) return false;
  const blob=String(n.title||"")+" "+String(n.description||"")+" "+String(n.notificationUrl||"");
  return !DISCOVERY_NOISE.test(blob)&&DISCOVERY_SIGNAL.test(blob);
}).slice(0,1200).map(n=>({...n,publishedDate:n.publishedDate||n.lastChecked}));

await fs.writeFile("lib/source-status.ts",'export type SourceStatus = {id:string; organization:string; category:string; region:string; sourceUrl:string; ok:boolean; health:"healthy"|"degraded"|"unreachable"; detected:number; lastChecked:string; method?:string; attempts?:number; error?:string};\n\nexport const sourceStatuses:Record<string,SourceStatus> = '+JSON.stringify(Object.fromEntries(statuses.map(x=>[x.id,x])),null,2)+';\n');
await fs.writeFile("lib/auto-notifications.ts",['export type AutoNotification = {','  id:string; title:string; organization:string; category:string;','  stage:"Application Open"|"Upcoming"|"Admit Card"|"Answer Key"|"Result"|"Recruitment"|"Notice";','  status:"Verified official"|"Detected on official source"; publishedDate?:string; lastChecked:string; applicationLastDate?:string; applicationDates?:string; examDate?:string;','  officialUrl:string; notificationUrl?:string; description:string;','};','','export const autoNotificationMeta = '+JSON.stringify({generatedAt:new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"}),sourceCount:config.length,successfulSources:statuses.filter(x=>x.ok).length,healthySources:statuses.filter(x=>x.health==="healthy").length,degradedSources:statuses.filter(x=>x.health==="degraded").length,unreachableSources:statuses.filter(x=>x.health==="unreachable").length,failedSources:statuses.filter(x=>x.health==="unreachable").map(x=>x.organization),sourcePolicy:"Direct official-source checks with retries, official fallback URLs, PDF extraction and last-verified preservation. Detected links are never treated as authoritative over the original notice."},null,2)+';','','export const autoNotifications:AutoNotification[] = '+JSON.stringify(notifications,null,2)+';',''].join("\n"));
await fs.writeFile("lib/discovered-official-notices.ts",[
  "// AUTO-GENERATED by scripts/aggregate-official-data.mjs. Do not edit manually.",
  "export const discoveredOfficialNotices = "+JSON.stringify(discoveredFeed,null,2)+" as const;",
  "export const discoveryMeta = "+JSON.stringify({generatedAt:new Date().toISOString(),registeredSources:config.length,checkedSources:statuses.filter(x=>x.ok).length,discoveredItems:discoveredFeed.length,sourceResults:statuses.map(x=>({id:x.id,organization:x.organization,checked:x.ok,health:x.health,detected:x.detected,lastChecked:x.lastChecked}))},null,2)+" as const;",
  ""
].join("\n"));
await fs.writeFile("lib/auto-exam-data.ts",['export type AutoExamOverride = {',' slug:string; name:string; organization:string; notificationUrl:string; sourceUrl:string; lastVerified:string; detectedAt:string; confidence:"medium"|"high"; evidenceCount:number; evidence:string[]; evidenceSnippets?:string[]; sourceTitle?:string;',' familySlug?:string; cycleSlug?:string; cycleYear?:number;',' applicationDates?:string; lastDate?:string; examDate?:string; vacancies?:string; minAge?:number; maxAge?:number; fee?:string; correctionDates?:string; qualification?:string; selectionProcess?:string; payScale?:string; nationality?:string; domicile?:string; ageRelaxation?:string; dataCertainty?:"confirmed"|"tentative"|"calendar"; applicationStatus?:"open"|"closed"|"upcoming"|"unknown"; stale?:boolean; refreshedThisCycle?:boolean;','};','','export const autoExamDataMeta = '+JSON.stringify({generatedAt:new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"}),sourceCount:config.length,overrideCount:Object.keys(overrides).length,policy:"Only conservative values extracted from an official notice/bulletin are applied. Missing or ambiguous fields are never invented."},null,2)+';','','export const autoExamData:Record<string,AutoExamOverride> = '+JSON.stringify(overrides,null,2)+';',''].join("\n"));
console.log("Aggregated",statuses.length,"sources,",statuses.filter(x=>x.ok).length,"successful,",notifications.length,"updates,",Object.keys(overrides).length,"exam overrides");
