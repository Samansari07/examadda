#!/usr/bin/env node
// National official-source + exam-data refresh engine: 2026-09-27
import fs from "node:fs/promises";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import os from "node:os";
import path from "node:path";

const execFileAsync=promisify(execFile);
const UA="SarkariPrep-Official-Checker/5.0";
const BROWSER_HEADERS={"user-agent":UA,"accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","accept-language":"en-IN,en;q=0.9","cache-control":"no-cache","pragma":"no-cache"};
const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
async function fetchDirect(url,options={}){return fetch(url,{...options,headers:{...BROWSER_HEADERS,...options.headers},redirect:"follow",signal:AbortSignal.timeout(25000)});}
async function fetchWithRetry(url,options={}){
 let last;
 for(const delay of [0,1200,3000]){
  if(delay) await sleep(delay);
  try{const r=await fetchDirect(url,options);if(r.ok)return {response:r,method:"fetch"};last=new Error("HTTP "+r.status);if(![408,425,429,500,502,503,504].includes(r.status))break;}catch(error){last=error}
 }
 try{
  const {stdout,stderr}=await execFileAsync("curl",["-L","--max-time","30","--retry","2","--retry-delay","1","-A",UA,"-H","Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","-H","Accept-Language: en-IN,en;q=0.9","-H","Cache-Control: no-cache",url],{maxBuffer:20*1024*1024});
  if(stdout)return {response:new Response(stdout,{status:200,headers:{"content-type":"text/html; charset=utf-8"}}),method:"curl"};last=new Error(stderr||"curl returned no content");
 }catch(error){last=error}
 throw last;
}
async function fetchSource(source){
 const urls=[source.updatesUrl,...(source.fallbackUrls||[])].filter(Boolean);const attempts=[];
 for(const url of [...new Set(urls)]){
  try{
   const {response,method}=await fetchWithRetry(url);const contentType=response.headers.get("content-type")||"";
   if(!contentType.includes("html")&&!contentType.includes("xml")&&!contentType.includes("text")){attempts.push(url+" -> unsupported content type "+contentType);continue;}
   const html=await response.text();if(html.length<120){attempts.push(url+" -> empty response");continue;}
   return {url,html,method,attempts};
  }catch(error){attempts.push(url+" -> "+String(error))}
 }
 throw new Error(attempts.join(" | "));
}
const SOURCES=JSON.parse(await fs.readFile(new URL("../config/official-sources.json",import.meta.url),"utf8"));
const EXAMS_TEXT=await fs.readFile(new URL("../lib/exams.ts",import.meta.url),"utf8");
const KEYWORDS=/notification|notice|recruitment|vacanc|corrigendum|application|apply|admit card|answer key|result|calendar|schedule|examination|exam|shortlist|interview|extension|registration|provisional|final|advertisement|engagement|appointment|selection/i;
const URL_HINTS=/notification|notice|recruit|vacanc|advert|corrig|application|apply|admit|hall.?ticket|answer.?key|result|calendar|schedule|exam|selection|appointment|pdf/i;
const BAD_TITLES=/^\s*(home|about|contact|login|register|registration|click here|menu|search|read more|view more)\s*$/i;
const BAD_TEMPLATE=/\{\{|\}\}|translate|_hm['"]/i;
const STAGE=(title)=>{const t=title.toLowerCase();if(/admit card|hall ticket/.test(t))return"Admit Card";if(/answer key|response sheet/.test(t))return"Answer Key";if(/result|score card|cut.?off/.test(t))return"Result";if(/apply|application|registration|notification/.test(t))return"Application Open";if(/vacanc|recruitment|corrigendum|advertisement|engagement/.test(t))return"Recruitment";return"Upcoming"};
const clean=(s)=>s.replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
const norm=(s)=>s.toLowerCase().replace(/&amp;/g," and ").replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();
const today=()=>new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"});
const toIsoDate=(raw,yearHint)=>{const m=String(raw).match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/);if(!m)return null;let y=Number(m[3]);if(y<100)y+=2000; if(!m[3]&&yearHint)y=yearHint; return `${y}-${String(m[2]).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`};
const prettyDate=(raw)=>{const m=String(raw).match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/);if(!m)return raw;let y=Number(m[3]);if(y<100)y+=2000;return `${String(m[1]).padStart(2,"0")}.${String(m[2]).padStart(2,"0")}.${y}`};
function registryExams(){
  const out=[];
  const re=/slug:"([^"]+)"[^\n]*name:"([^"]+)"[^\n]*organization:"([^"]+)"/g; let m;
  while((m=re.exec(EXAMS_TEXT))) out.push({slug:m[1],name:m[2],organization:m[3]});
  const fr=/\["([^"]+)",\"([^"]+)\",\"([^"]+)\",/g;
  while((m=fr.exec(EXAMS_TEXT))) out.push({slug:"family-"+m[1],name:m[2],organization:m[3]});
  return [...new Map(out.map(x=>[x.slug,x])).values()];
}
const EXAMS=registryExams();
const aliasFor=(e)=>{const s=e.slug.replace(/^family-/,"").replace(/[-_]+/g," ");const n=norm(e.name);const aliases=[s];if(/^[a-z0-9 ]+$/.test(s))aliases.push(...s.split(" ").filter(x=>x.length>=3));const acr=[...e.name.matchAll(/\b[A-Z][A-Z0-9-]{1,}\b/g)].map(x=>x[0].toLowerCase());aliases.push(...acr);return [...new Set(aliases.map(norm).filter(x=>x.length>=3))]};
const matchExam=(title,source)=>{const t=norm(title);const pool=EXAMS.filter(e=>e.organization.toLowerCase()===source.organization.toLowerCase()||t.includes(norm(e.organization)));if(!pool.length)return null;const scored=pool.map(e=>{let score=0;for(const a of aliasFor(e)){if(t.includes(a))score=Math.max(score,a.includes(" ") ? 7 : 5)}const toks=norm(e.name).split(" ").filter(x=>x.length>3&&!["examination","recruitment","examination","posts","government"].includes(x));const hits=toks.filter(x=>t.includes(x)).length;if(hits>=2)score=Math.max(score,4);return{e,score}}).sort((a,b)=>b.score-a.score);if(!scored[0]||scored[0].score<5)return null;if(scored[1]&&scored[1].score===scored[0].score)return null;return scored[0].e};

function extractLinks(html,source){
 const out=[];const seen=new Set();const re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;let m;
 while((m=re.exec(html))&&out.length<100){
  const title=clean(m[2]);const href=m[1].trim();
  if(title.length<8||title.length>320||BAD_TITLES.test(title)||BAD_TEMPLATE.test(title)||!KEYWORDS.test(title))continue;
  if(/^(#|javascript:|mailto:|tel:)/i.test(href))continue;
  let url;try{url=new URL(href,source.updatesUrl).href}catch{continue}
  const strong=URL_HINTS.test(url)||/(notification|notice|recruitment|vacanc|admit|result|answer|calendar|examination|selection|appointment|advertisement)/i.test(title);
  if(!strong)continue;
  const key=url.split("#")[0];if(seen.has(key))continue;seen.add(key);
  out.push({id:"auto-"+source.id+"-"+Buffer.from(key).toString("base64url").slice(0,28),title,organization:source.organization,category:source.category,stage:STAGE(title),status:"Detected on official source",publishedDate:today(),lastChecked:today(),officialUrl:source.updatesUrl,notificationUrl:url,description:"Detected automatically from the registered official "+source.organization+" source. Open the original authority notice for the controlling details."});
 }
 return out;
}
async function findPdf(url){
 if(/\.pdf(?:[?#].*)?$/i.test(url))return url;
 try{const {response:r}=await fetchWithRetry(url,{headers:{"accept":"application/pdf,text/html"}});const ct=r.headers.get("content-type")||"";if(ct.includes("pdf"))return url;const html=await r.text();const re=/<a\b[^>]*href=["']([^"']+\.pdf(?:[?#][^"']*)?)["']/ig;const m=re.exec(html);if(!m)return null;return new URL(m[1],url).href}catch{return null}
}
async function pdfText(url){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),"sarkariprep-"));const pdf=path.join(dir,"notice.pdf");const txt=path.join(dir,"notice.txt");
 try{const {response:r}=await fetchWithRetry(url,{headers:{"accept":"application/pdf,text/html"}});const b=Buffer.from(await r.arrayBuffer());if(b.length<1000)return"";await fs.writeFile(pdf,b);await execFileAsync("pdftotext",["-layout",pdf,txt],{maxBuffer:10*1024*1024});return(await fs.readFile(txt,"utf8")).replace(/\r/g," ").replace(/\n+/g,"\n").slice(0,180000)}catch{return""}finally{await fs.rm(dir,{recursive:true,force:true}).catch(()=>{})}
}
function parseStructured(text){
 const t=text.replace(/[ \t]+/g," ").replace(/\n+/g,"\n");const out={};const evidence=[];const date=/(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/;
 let m=t.match(/(?:duration of online application|online application|application.*?(?:from|w.?e.?f.?))[^\n:]*:?\s*(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})\s*(?:to|upto|until|-)\s*(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i);
 if(m){out.applicationDates=`${prettyDate(m[1])} – ${prettyDate(m[2])}`;evidence.push("applicationDates")}
 m=t.match(/last date for (?:submission of )?(?:online )?application[^\n:]*:?\s*[^\d]*(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i);
 if(m){out.lastDate=prettyDate(m[1]);if(!evidence.includes("applicationDates"))evidence.push("lastDate")}
 m=t.match(/(?:date of (?:the )?examination|exam(?:ination)? will be held|examination.*?scheduled)[^\d]{0,80}(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i);
 if(m){out.examDate=prettyDate(m[1]);evidence.push("examDate")}
 m=t.match(/(?:number of )?(?:vacancies|vacant posts|total posts|posts)[^\d]{0,30}(\d[\d,]{2,})/i)||t.match(/(\d[\d,]{2,})\s+(?:vacancies|vacant posts|posts)/i);
 if(m){out.vacancies=m[1]+" notified";evidence.push("vacancies")}
 m=t.match(/(?:minimum age|minimum age limit)[^\d]{0,30}(\d{1,2})[^\d]{0,80}(?:maximum age|upper age)[^\d]{0,30}(\d{1,2})/i);
 if(m){out.minAge=Number(m[1]);out.maxAge=Number(m[2]);evidence.push("age")}
 m=t.match(/(?:application fee|examination fee|exam fee)[^\n:]{0,80}(?:rs\.?|₹)\s*([\d,]+)/i);
 if(m){out.fee="₹"+m[1];evidence.push("fee")}
 m=t.match(/(?:correction window|correction.*?from)[^\d]{0,80}(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})\s*(?:to|upto|until|-)\s*(\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i);
 if(m)out.correctionDates=`${prettyDate(m[1])} – ${prettyDate(m[2])}`;
 return {data:out,evidence};
}
async function main(){
 const results=[];const failures=[];const sourceStatus=[];const overrides={};
 for(const source of SOURCES){
  try{
   const fetched=await fetchSource(source);
   
   
   const html=fetched.html;const detected=extractLinks(html,source);results.push(...detected);
   for(const item of detected){
    const exam=matchExam(item.title,source);if(!exam)continue;
    const pdf=await findPdf(item.notificationUrl);let text=pdf?await pdfText(pdf):"";
    if(!text)continue;
    const parsed=parseStructured(text);if(parsed.evidence.length<2)continue;
    const existing=overrides[exam.slug];
    const confidence=parsed.evidence.length>=3?"high":"medium";
    if(!existing||confidence==="high"||(existing.confidence!=="high"&&parsed.evidence.length>existing.evidenceCount)){
      overrides[exam.slug]={...parsed.data,slug:exam.slug,name:exam.name,organization:exam.organization,notificationUrl:pdf||item.notificationUrl,sourceUrl:item.officialUrl,lastVerified:today(),detectedAt:today(),confidence,evidenceCount:parsed.evidence.length,evidence:parsed.evidence};
    }
   }
   sourceStatus.push({id:source.id,organization:source.organization,category:source.category,region:source.region,sourceUrl:fetched.url,ok:true,detected:detected.length,lastChecked:today(),method:fetched.method});
  }catch(error){failures.push({source:source.organization,error:String(error)});sourceStatus.push({id:source.id,organization:source.organization,category:source.category,region:source.region,sourceUrl:source.updatesUrl,ok:false,detected:0,lastChecked:today(),error:String(error)});console.error("FAIL",source.organization,String(error))}
 }
 const unique=[];const seen=new Set();for(const item of results){const key=(item.notificationUrl||item.title).replace(/#.*$/,"");if(seen.has(key))continue;seen.add(key);unique.push(item)}unique.sort((a,b)=>b.lastChecked.localeCompare(a.lastChecked)||a.organization.localeCompare(b.organization)||a.title.localeCompare(b.title));
 await fs.writeFile("lib/source-status.ts","export type SourceStatus = {id:string; organization:string; category:string; region:string; sourceUrl:string; ok:boolean; detected:number; lastChecked:string; method?:string; error?:string};\n\nexport const sourceStatuses:Record<string,SourceStatus> = "+JSON.stringify(Object.fromEntries(sourceStatus.map(x=>[x.id,x])),null,2)+";\n","utf8");
 await fs.writeFile("lib/auto-notifications.ts",["export type AutoNotification = {","  id:string; title:string; organization:string; category:string;","  stage:\"Application Open\"|\"Upcoming\"|\"Admit Card\"|\"Answer Key\"|\"Result\"|\"Recruitment\";","  status:\"Verified official\"|\"Detected on official source\"; publishedDate:string; lastChecked:string;","  officialUrl:string; notificationUrl?:string; description:string;","};","", "export const autoNotificationMeta = "+JSON.stringify({generatedAt:today(),sourceCount:SOURCES.length,successfulSources:SOURCES.length-failures.length,failedSources:failures.map(x=>x.organization),sourcePolicy:"Direct official-source checks with retries, browser headers, curl fallback and configured alternate official URLs; detected links are never treated as authoritative over the original notice."},null,2)+";","", "export const autoNotifications:AutoNotification[] = "+JSON.stringify(unique,null,2)+";",""].join("\n"),"utf8");
 const autoBody=["export type AutoExamOverride = {"," slug:string; name:string; organization:string; notificationUrl:string; sourceUrl:string; lastVerified:string; detectedAt:string; confidence:\"medium\"|\"high\"; evidenceCount:number; evidence:string[];"," applicationDates?:string; lastDate?:string; examDate?:string; vacancies?:string; minAge?:number; maxAge?:number; fee?:string; correctionDates?:string;","};","", "export const autoExamDataMeta = "+JSON.stringify({generatedAt:today(),sourceCount:SOURCES.length,overrideCount:Object.keys(overrides).length,policy:"Only conservative values extracted from an official notice/bulletin are applied. Missing or ambiguous fields are never invented."},null,2)+";","", "export const autoExamData:Record<string,AutoExamOverride> = "+JSON.stringify(overrides,null,2)+";",""].join("\n");
 await fs.writeFile("lib/auto-exam-data.ts",autoBody,"utf8");
 console.log("Wrote",unique.length,"official updates and",Object.keys(overrides).length,"exam data overrides from",SOURCES.length,"sources");
 if(failures.length) console.log("Failed sources:",failures.map(x=>x.organization).join(", "));
}
main().catch(error=>{console.error(error);process.exit(1)});
