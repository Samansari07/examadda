#!/usr/bin/env node
import fs from "node:fs/promises";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import path from "node:path";
import {createHash} from "node:crypto";
const execFileAsync=promisify(execFile);
const UA="SarkariPrep-Official-Checker/9.0";
const HEADERS={"user-agent":UA,"accept":"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","accept-language":"en-IN,en;q=0.9","cache-control":"no-cache","pragma":"no-cache"};
const today=()=>new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"});
const clean=s=>String(s).replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
const norm=s=>String(s).toLowerCase().replace(/&amp;/g," and ").replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();
const BAD_TITLES=/^\s*(home|about|contact|login|register|registration|click here|click here to view|menu|search|read more|view more|notifications?|notices?|announcements?|upcoming exams?|examinations?|recruitment|careers?|current openings?|online application|apply online|important links?|quick links?|miscellaneous notice|general notice|important notice|exam calendar|exam calender|one time registration|proceed to registration|advertisement|recruitments?|registration details|total registrations|occupations wise registration|qualifications wise registrations|video tutorial.*|registration card.*)\s*[.:-]*\s*$/i;
const BAD_PHRASES=/(click here|video tutorial|for registration|occupations wise|qualifications wise|registration card|registration details|total registrations|please login|login to renew|login to apply|one time registration|candidates registration|exams view and apply exams|certificate of registration|know your registration no\.?|bank reference no\.?|registration form|read more\s*$)/i;
const GENERIC_TITLE=/^(?:notifications?|notices?|announcements?|recruitments?|careers?|current openings?|work recruitments?|notifications? notices?|recruitments? notices?|one time registration(?:\s*\([^)]*\))?|online registration|online application form(?:\s*\([^)]*\))?|candidates registration|exams view and apply exams(?:\.|\s*open)?|certificate of registration(?:\s*\([^)]*\))?|online recruitment application(?:\s*\([^)]*\))?)$/i;
const BAD_TEMPLATE=/\{\{|\}\}|translate|_hm['"]/i;
const KEYWORDS=/notification|notice|recruitment|vacanc|corrigendum|application|apply|admit card|answer key|result|calendar|schedule|examination|exam|shortlist|interview|extension|registration|provisional|final|advertisement|engagement|appointment|selection/i;
const URL_HINTS=/notification|notice|recruit|vacanc|advert|corrig|application|apply|admit|hall.?ticket|answer.?key|result|calendar|schedule|exam|selection|appointment|pdf/i;
const stage=t=>{t=t.toLowerCase();const years=[...t.matchAll(/\b(?:19|20)\d{2}\b/g)].map(m=>Number(m[0]));if(/admit card|hall ticket/.test(t))return"Admit Card";if(/answer key|response sheet/.test(t))return"Answer Key";if(/result|score card|cut.?off/.test(t))return"Result";if(/closed|last date.*(?:over|passed)|application.*closed/.test(t))return"Notice";if(years.length&&!years.some(y=>y>=new Date().getUTCFullYear()))return"Notice";if(/apply|application/.test(t))return"Application Open";if(/vacanc|recruitment|corrigendum|advertisement|engagement/.test(t))return"Recruitment";if(/calendar|schedule|upcoming|exam date/.test(t))return"Upcoming";return"Notice"};

async function fetchSource(source){
  const urls=[source.updatesUrl,...(source.fallbackUrls||[])].filter(Boolean).slice(0,3),attempts=[];
  for(const url of [...new Set(urls)]){
    try{
      const r=await fetch(url,{headers:HEADERS,redirect:"follow",signal:AbortSignal.timeout(7000)});
      const ct=r.headers.get("content-type")||"";
      if(r.ok&&(ct.includes("html")||ct.includes("xml")||ct.includes("text"))){
        const html=await r.text();
        if(html.length>120)return{url,html,method:"fetch"};
      }
      attempts.push(url+" -> HTTP "+r.status);
    }catch(e){attempts.push(url+" -> "+String(e))}
    try{
      const {stdout}=await execFileAsync("curl",["-L","--max-time","10","--retry","0","-A",UA,"-H","Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",url],{maxBuffer:20*1024*1024});
      if(stdout.length>120)return{url,html:stdout,method:"curl"};
    }catch(e){attempts.push(url+" -> curl "+String(e))}
  }
  throw new Error(attempts.join(" | "));
}

function extractLinks(html,source){
  const out=[],seen=new Set(),re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;let m;
  while((m=re.exec(html))&&out.length<100){
    const title=clean(m[2]),href=m[1].trim();
    if(title.length<12||title.length>500||BAD_TITLES.test(title)||BAD_PHRASES.test(title)||GENERIC_TITLE.test(title)||BAD_TEMPLATE.test(title)||!KEYWORDS.test(title))continue;
    if(/^(#|javascript:|mailto:|tel:)/i.test(href))continue;
    let url;try{url=new URL(href,source.updatesUrl).href}catch{continue}
    if(!URL_HINTS.test(url)&&!KEYWORDS.test(title))continue;
    const key=url.split("#")[0];if(seen.has(key))continue;seen.add(key);
    const idHash=createHash("sha256").update(key).digest("hex").slice(0,16);
    out.push({id:"auto-"+source.id+"-"+idHash,title,organization:source.organization,category:source.category,stage:stage(title),status:"Detected on official source",lastChecked:today(),officialUrl:source.updatesUrl,notificationUrl:url,description:"Detected automatically from the registered official "+source.organization+" source. The original authority notice remains the controlling source."});
  }
  return out;
}

async function pdfText(url){
  const dir=await fs.mkdtemp(path.join("/tmp/","sarkariprep-")),pdf=path.join(dir,"notice.pdf"),txt=path.join(dir,"notice.txt");
  try{
    const r=await fetch(url,{headers:{...HEADERS,accept:"application/pdf,text/html"},redirect:"follow",signal:AbortSignal.timeout(10000)});
    if(!r.ok)return"";
    const b=Buffer.from(await r.arrayBuffer());if(b.length<1000)return"";
    await fs.writeFile(pdf,b);
    await execFileAsync("pdftotext",["-layout",pdf,txt],{maxBuffer:8*1024*1024,timeout:9000});
    return(await fs.readFile(txt,"utf8")).slice(0,180000);
  }catch{return""}finally{await fs.rm(dir,{recursive:true,force:true}).catch(()=>{})}
}
async function findPdf(url){
  if(/\.pdf(?:[?#].*)?$/i.test(url))return url;
  try{
    const r=await fetch(url,{headers:{...HEADERS,accept:"application/pdf,text/html"},redirect:"follow",signal:AbortSignal.timeout(7000)});
    if((r.headers.get("content-type")||"").includes("pdf"))return url;
    const html=await r.text();const m=html.match(/href=["']([^"']+\.pdf(?:[?#][^"']*)?)["']/i);
    return m?new URL(m[1],url).href:null;
  }catch{return null}
}
const MONTHS="january|february|march|april|may|june|july|august|september|october|november|december";
const DATE_TOKEN="(\\d{1,2}\\s+(?:"+MONTHS+")\\s+\\d{4}|\\d{1,2}[.\\/-]\\d{1,2}[.\\/-]\\d{2,4})";
function fieldEvidence(text,re,label){const m=text.match(re);if(!m)return null;const i=m.index||0;return {value:m[1]?.trim(),label,snippet:text.slice(Math.max(0,i-100),Math.min(text.length,i+Math.max(220,m[0].length+100))).replace(/\\s+/g," ").trim()};}
function parseStructured(t){
  const text=t.replace(/[ \\t]+/g," ").replace(/\\n+/g," ").replace(/\\s+/g," ").trim();
  const out={},e=[],evidenceSnippets=[];let m;
  const last=fieldEvidence(text,new RegExp("(?:last date|closing date|last date for (?:submission of )?(?:online )?application)[^0-9]*"+DATE_TOKEN,"i"),"lastDate");
  if(last?.value){out.lastDate=last.value;e.push("lastDate");evidenceSnippets.push(last.snippet);}
  const exam=fieldEvidence(text,new RegExp("(?:date of (?:the )?examination|date of examination|exam(?:ination)? (?:will be held|scheduled|shall be held)|examination.*?scheduled)[^0-9]*"+DATE_TOKEN,"i"),"examDate");
  if(exam?.value){out.examDate=exam.value;e.push("examDate");evidenceSnippets.push(exam.snippet);}
  const vacancy=fieldEvidence(text,/(?:number of )?(?:vacancies|vacant posts|total posts|total vacancies)[^0-9]{0,50}([0-9][0-9,]{2,})/i,"vacancies");
  if(vacancy?.value){out.vacancies=vacancy.value+" notified";e.push("vacancies");evidenceSnippets.push(vacancy.snippet);}
  m=text.match(/(?:minimum age|minimum age limit)[^0-9]{0,40}([0-9]{1,2})[^0-9]{0,100}(?:maximum age|upper age)[^0-9]{0,40}([0-9]{1,2})/i);
  if(m){out.minAge=+m[1];out.maxAge=+m[2];e.push("age");evidenceSnippets.push(m[0].slice(0,260));}
  m=text.match(/(?:application fee|examination fee|exam fee)[^\\n:]{0,100}(?:rs\\.?|₹)\\s*([0-9][0-9,]*)/i);
  if(m){out.fee="₹"+m[1];e.push("fee");evidenceSnippets.push(m[0].slice(0,260));}
  return{data:out,evidence:e,evidenceSnippets};
}
const config=JSON.parse(await fs.readFile("config/official-sources.json","utf8"));
const batch=Number(process.env.SOURCE_BATCH||0),count=Number(process.env.SOURCE_BATCH_COUNT||8);
const selected=config.filter((_,i)=>i%count===batch);
const failures=[],statuses=[],results=[],overrides={};
const exams=(await fs.readFile("lib/exams.ts","utf8")).match(/slug:"([^"]+)"[^\n]*name:"([^"]+)"[^\n]*organization:"([^"]+)"/g)?.map(x=>{const m=x.match(/slug:"([^"]+)"[^\n]*name:"([^"]+)"[^\n]*organization:"([^"]+)"/);return{slug:m[1],name:m[2],organization:m[3]}})||[];
const ORG_ALIASES={
  "Staff Selection Commission":["ssc"],
  "Indian Railways / RRB":["rrb","railway recruitment board"],
  "National Testing Agency":["nta"],
  "CTET":["ctet","central teacher eligibility test"],
  "State Bank of India":["sbi"],
  "Reserve Bank of India":["rbi"],
  "Indian Navy":["navy"],
  "Indian Air Force":["iaf","air force","afcat"],
  "Jharkhand Public Service Commission":["jpsc"],
  "Bihar Public Service Commission":["bpsc"],
  "West Bengal Public Service Commission":["wbpsc"],
  "Andhra Pradesh Public Service Commission":["appsc"],
  "Telangana Public Service Commission":["tspsc","tgpsc"]
};
const matchExam=(title,source,evidence="")=>{
  const sourceNames=[source.organization,...(ORG_ALIASES[source.organization]||[])].map(norm);
  const t=norm(title+" "+evidence);let best=null;
  for(const e of exams){
    const orgMatch=sourceNames.some(a=>a&&norm(e.organization)===a)||sourceNames.some(a=>a&&t.includes(a));
    if(!orgMatch)continue;
    const aliases=[norm(e.slug),norm(e.name),...(e.name.match(/\\b[A-Z][A-Z0-9-]{1,}\\b/g)||[]).map(norm)];
    let score=0;
    for(const a of aliases.filter(x=>x.length>2))if(t.includes(a))score+=a.length>=8?8:4;
    const year=(e.name.match(/\\b20\\d{2}\\b/)||[])[0];if(year&&t.includes(year))score+=5;
    if(!best||score>best.score)best={e,score};
  }
  return best&&best.score>=8?best.e:null;
};
for(const source of selected){
  try{
    const f=await fetchSource(source),det=extractLinks(f.html,source);results.push(...det);
    const candidates=det
      .filter(x=>!["Result","Admit Card","Answer Key"].includes(x.stage))
      .map(x=>({item:x,exam:matchExam(x.title,source)}))
      .filter(x=>x.exam)
      .slice(0,12);
    for(const {item,exam} of candidates){
      const pdf=await findPdf(item.notificationUrl);if(!pdf)continue;
      const txt=await pdfText(pdf);if(!txt)continue;
      const normalized=norm(txt.slice(0,80000));
      const aliases=[norm(exam.name),norm(exam.slug),...(exam.name.match(/\\b[A-Z][A-Z0-9-]{1,}\\b/g)||[]).map(norm)].filter(x=>x.length>3);
      const identityMatches=aliases.filter(k=>normalized.includes(k)).length;
      const p=parseStructured(txt);
      if(identityMatches<1 || p.evidence.length<2 || (!p.data.examDate && !p.data.lastDate))continue;
      const confidence=identityMatches>=2 && p.evidence.length>=3 ? "high" : "medium";
      overrides[exam.slug]={...p.data,slug:exam.slug,name:exam.name,organization:exam.organization,notificationUrl:pdf,sourceUrl:item.officialUrl,lastVerified:today(),detectedAt:today(),confidence,evidenceCount:p.evidence.length,evidence:p.evidence,evidenceSnippets:p.evidenceSnippets,sourceTitle:item.title};
    }
    statuses.push({id:source.id,organization:source.organization,category:source.category,region:source.region,sourceUrl:f.url,ok:true,detected:det.length,lastChecked:today(),method:f.method});
  }catch(e){
    failures.push({source:source.organization,error:String(e)});
    statuses.push({id:source.id,organization:source.organization,category:source.category,region:source.region,sourceUrl:source.updatesUrl,ok:false,detected:0,lastChecked:today(),error:String(e)});
  }
}
const unique=[],seen=new Set();
for(const x of results){const k=x.notificationUrl?.split("#")[0]||x.title;if(seen.has(k))continue;seen.add(k);unique.push(x)}
await fs.mkdir("official-refresh-batches",{recursive:true});
await fs.writeFile(`official-refresh-batches/batch-${batch}.json`,JSON.stringify({batch,sourceCount:selected.length,results:unique,statuses,failures,overrides},null,2));
console.log(`batch ${batch}: ${selected.length} sources, ${statuses.filter(x=>x.ok).length} successful, ${unique.length} updates, ${Object.keys(overrides).length} overrides`);
