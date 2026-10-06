#!/usr/bin/env node
import fs from "node:fs/promises";

const config=JSON.parse(await fs.readFile("config/official-sources.json","utf8"));
const host=v=>{const m=String(v||"").match(/^https?:\/\/([^/]+)/i);return m?m[1].toLowerCase().replace(/^www\./,""):""};
const same=(a,b)=>{const x=host(a),y=host(b);return !!x&&!!y&&(x===y||x.endsWith("."+y)||y.endsWith("."+x))};
const trustedDocument=(url,sourceUrl)=>{const x=host(url),y=host(sourceUrl);if(!x||!y)return false;if(same(url,sourceUrl))return true;if((x==="s3waas.gov.in"||x.endsWith(".s3waas.gov.in"))&&(y.endsWith(".gov.in")||y.endsWith(".nic.in")||y.endsWith(".gov")))return true;if((x.endsWith(".gov.in")||x.endsWith(".nic.in")||x.endsWith(".gov")||x.endsWith(".ac.in")||x.endsWith(".edu.in"))&&(y.endsWith(".gov.in")||y.endsWith(".nic.in")||y.endsWith(".gov")||y.endsWith(".ac.in")||y.endsWith(".edu.in")))return true;if(x.endsWith(".blob.core.windows.net")&&(y.endsWith(".gov.in")||y.endsWith(".nic.in")))return true;return false};
const sourceIds=config.map(s=>s.id).filter(Boolean);
const sourceForOrg=o=>config.find(s=>String(s.organization||"").toLowerCase()===String(o||"").toLowerCase());
const identity=v=>String(v||"").toLowerCase().replace(/&amp;/g," and ").replace(/[^a-z0-9]+/g," ").replace(/\b(?:19|20)\d{2}\b/g," ").replace(/\s+/g," ").trim();
const tokens=v=>identity(v).split(" ").filter(t=>t.length>=5&&!['examination','recruitment','notification','combined','official','application'].includes(t));
const failures=[];
if(new Set(sourceIds).size!==sourceIds.length) failures.push("official-sources.json contains duplicate source ids");
const auto=await fs.readFile("lib/auto-exam-data.ts","utf8");
const am=auto.match(/autoExamData:Record<string,AutoExamOverride> = (\{[\s\S]*\});\s*$/);
if(!am) failures.push("auto-exam-data export parse failed");
else {
 const data=JSON.parse(am[1]);
 for(const [slug,v] of Object.entries(data)){
  const s=sourceForOrg(v.organization);
  if(!s||!same(v.sourceUrl,s.updatesUrl)) failures.push(slug+": sourceUrl is not the registered authority");
  if(v.stale){
    const age=Date.now()-Date.parse(String(v.lastVerified||"")+"T23:59:59Z");
    if(!Number.isFinite(age)||age>14*86400000) failures.push(slug+": stale snapshot exceeds 14-day safety window");
  }
  if(v.notificationUrl&&!same(v.notificationUrl,v.sourceUrl)){
    const nh=host(v.notificationUrl);
    const trustedCdn=(nh==="s3waas.gov.in"||nh.endsWith(".s3waas.gov.in")) && (host(v.sourceUrl).endsWith(".gov.in")||host(v.sourceUrl).endsWith(".nic.in"));
    if(!trustedCdn) failures.push(slug+": notificationUrl crosses authority");
  }
  if(typeof v.minAge==='number'&&(v.minAge<14||v.minAge>70)) failures.push(slug+": invalid minAge");
  if(typeof v.maxAge==='number'&&(v.maxAge<14||v.maxAge>80)) failures.push(slug+": invalid maxAge");
  if(typeof v.minAge==='number'&&typeof v.maxAge==='number'&&v.minAge>v.maxAge) failures.push(slug+": minAge > maxAge");
  const ev=[v.sourceTitle,...(v.evidence||[]),...(v.evidenceSnippets||[])].filter(Boolean).map(identity).join(" ");
  const strong=tokens(v.name||v.slug);
  if(strong.length&&!strong.some(t=>ev.includes(t))) failures.push(slug+": source evidence does not identify the exam");
 }
}
for(const file of ['lib/auto-notifications.ts','lib/discovered-official-notices.ts']){
 const t=await fs.readFile(file,'utf8');
 const m=file.includes('auto-notifications') ? t.match(/autoNotifications:AutoNotification\[\] = ([\s\S]*);\s*$/) : t.match(/discoveredOfficialNotices = ([\s\S]*?) as const;/);
 if(!m){failures.push(file+': export parse failed');continue;}
 const items=JSON.parse(m[1]);
 for(const x of items){
  if(!x.notificationUrl||same(x.notificationUrl,x.officialUrl)) continue;
  const h=host(x.notificationUrl);
  if(h.endsWith('.s3waas.gov.in')||h==='s3waas.gov.in') continue;
  failures.push(file+': cross-authority link: '+x.organization+' -> '+x.notificationUrl);
  if(failures.length>25) break;
 }
}
if(failures.length){console.error('validate-auto-data-integrity: FAILED');for(const f of failures.slice(0,25)) console.error(' - '+f);process.exit(1);}
console.log('validate-auto-data-integrity: OK');