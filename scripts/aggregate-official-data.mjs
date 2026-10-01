#!/usr/bin/env node
import fs from "node:fs/promises";
const config=JSON.parse(await fs.readFile("config/official-sources.json","utf8"));
const files=(await fs.readdir("official-refresh-batches")).filter(x=>/^batch-\d+\.json$/.test(x)).sort();
if(!files.length)throw new Error("No batch results found");
const parts=await Promise.all(files.map(async f=>JSON.parse(await fs.readFile("official-refresh-batches/"+f,"utf8"))));
const statuses=parts.flatMap(x=>x.statuses);
const failures=parts.flatMap(x=>x.failures);
const all=parts.flatMap(x=>x.results);
const overrides={};
for(const p of parts)for(const [slug,v] of Object.entries(p.overrides||{})){const old=overrides[slug];if(!old||v.confidence==="high"||(old.confidence!=="high"&&v.evidenceCount>old.evidenceCount))overrides[slug]=v}
const seen=new Set(),notifications=[];
for(const x of all){const key=(x.notificationUrl||x.title).split("#")[0];if(seen.has(key))continue;seen.add(key);notifications.push(x)}
const currentYear=new Date().getUTCFullYear();
const GENERIC_NOTIFICATION=/^(?:online recruitment application(?:\\s*\\([^)]*\\))?|online registration|one time registration(?:\\s*\\([^)]*\\))?|candidates registration|exams view and apply exams(?:\\.|\\s*open)?|certificate of registration(?:\\s*\\([^)]*\\))?)$/i;
for(const n of notifications){
  const title=n.title.toLowerCase();
  const years=[...title.matchAll(/\\b(?:19|20)\\d{2}\\b/g)].map(m=>Number(m[0]));
  if(n.stage==="Application Open" && (GENERIC_NOTIFICATION.test(n.title)||/closed|last date.*(?:over|passed)|application.*closed|login to apply/.test(title)||(years.length&&!years.some(y=>y>=currentYear)))) n.stage="Notice";
}
notifications.sort((a,b)=>a.organization.localeCompare(b.organization)||a.title.localeCompare(b.title));
await fs.writeFile("lib/source-status.ts",'export type SourceStatus = {id:string; organization:string; category:string; region:string; sourceUrl:string; ok:boolean; detected:number; lastChecked:string; method?:string; error?:string};\n\nexport const sourceStatuses:Record<string,SourceStatus> = '+JSON.stringify(Object.fromEntries(statuses.map(x=>[x.id,x])),null,2)+';\n');
await fs.writeFile("lib/auto-notifications.ts",['export type AutoNotification = {','  id:string; title:string; organization:string; category:string;','  stage:"Application Open"|"Upcoming"|"Admit Card"|"Answer Key"|"Result"|"Recruitment"|"Notice";','  status:"Verified official"|"Detected on official source"; publishedDate?:string; lastChecked:string;','  officialUrl:string; notificationUrl?:string; description:string;','};','','export const autoNotificationMeta = '+JSON.stringify({generatedAt:new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"}),sourceCount:config.length,successfulSources:statuses.filter(x=>x.ok).length,failedSources:statuses.filter(x=>!x.ok).map(x=>x.organization),sourcePolicy:"Parallel direct official-source checks with retries and curl fallback. Detected links are never treated as authoritative over the original notice."},null,2)+';','','export const autoNotifications:AutoNotification[] = '+JSON.stringify(notifications,null,2)+';',''].join("\n"));
await fs.writeFile("lib/auto-exam-data.ts",['export type AutoExamOverride = {',' slug:string; name:string; organization:string; notificationUrl:string; sourceUrl:string; lastVerified:string; detectedAt:string; confidence:"medium"|"high"; evidenceCount:number; evidence:string[]; evidenceSnippets?:string[]; sourceTitle?:string;',' applicationDates?:string; lastDate?:string; examDate?:string; vacancies?:string; minAge?:number; maxAge?:number; fee?:string; correctionDates?:string;','};','','export const autoExamDataMeta = '+JSON.stringify({generatedAt:new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"}),sourceCount:config.length,overrideCount:Object.keys(overrides).length,policy:"Only conservative values extracted from an official notice/bulletin are applied. Missing or ambiguous fields are never invented."},null,2)+';','','export const autoExamData:Record<string,AutoExamOverride> = '+JSON.stringify(overrides,null,2)+';',''].join("\n"));
console.log("Aggregated",statuses.length,"sources,",statuses.filter(x=>x.ok).length,"successful,",notifications.length,"updates,",Object.keys(overrides).length,"exam overrides");
