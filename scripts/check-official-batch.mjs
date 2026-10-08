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
const stage=t=>{t=t.toLowerCase();const years=[...t.matchAll(/\b(?:19|20)\d{2}\b/g)].map(m=>Number(m[0]));if(/admit card|hall ticket/.test(t))return"Admit Card";if(/answer key|response sheet/.test(t))return"Answer Key";if(/result|score card|cut.?off/.test(t))return"Result";if(/closed|last date.*(?:over|passed)|application.*closed/.test(t))return"Notice";if(years.length&&!years.some(y=>y>=new Date().getUTCFullYear()))return"Notice";const openApplication=/re[- ]?open(?:ing|ed)?\s+(?:of\s+)?online\s+applications?|re[- ]?open(?:ing|ed)?\s+online\s+application|applications?\s+(?:are\s+)?(?:now\s+)?open|online applications?\s+(?:are\s+)?(?:now\s+)?open|applications?\s+(?:are\s+)?invited|online applications?\s+(?:start|commence|begin)|application (?:window|process)\s+(?:is\s+)?(?:now\s+)?open|apply online\b|^apply for\b|extension of (?:the )?last date.*application|last date.*(?:submission|receipt) of applications?/i.test(t);if(openApplication)return"Application Open";if(/vacanc|recruitment|corrigendum|advertisement|engagement/.test(t))return"Recruitment";if(/calendar|schedule|upcoming|exam date/.test(t))return"Upcoming";return"Notice"};

async function fetchSource(source){
  const extraFallbacks=source.id==="indian-army"?["https://www.joinindianarmy.nic.in/"]:source.id==="indian-coast-guard"?["https://indiancoastguard.gov.in/recruitment"]:[];
  const commonDiscovery=["sitemap.xml","robots.txt","notifications","notices","recruitment","recruitment-notices","career","careers","advertisement","advertisements","documents","document-category","latest-notices","news-events"];
  const commonUrls=commonDiscovery.map(p=>{try{return new URL(p,source.updatesUrl).href}catch{return null}}).filter(Boolean);
  const baseUrls=[source.updatesUrl,...(source.fallbackUrls||[]),...(source.discoveryUrls||[]),source.applicationUrl,...commonUrls,...extraFallbacks].filter(Boolean);
  const urls=[];
  for(const u of [...new Set(baseUrls)]){
    urls.push(u);
    try{
      const x=new URL(u);
      if(x.hostname.startsWith("www."))x.hostname=x.hostname.slice(4);
      else x.hostname="www."+x.hostname;
      if(x.href!==u)urls.push(x.href);
    }catch{}
  }
  const attempts=[],pages=[];
  const deadline=Date.now()+90000;
  const fetchOne=async url=>{
    if(Date.now()>=deadline)return null;
    try{
      const r=await fetch(url,{headers:HEADERS,redirect:"follow",signal:AbortSignal.timeout(10000)});
      const ct=r.headers.get("content-type")||"";
      if(r.ok&&(ct.includes("html")||ct.includes("xml")||ct.includes("text"))){
        const html=await r.text();
        if(html.length>120)return{url,html,method:"fetch"};
      }
      attempts.push(url+" -> HTTP "+r.status);
    }catch(e){attempts.push(url+" -> "+String(e))}
    if(Date.now()>=deadline)return null;
    try{
      const {stdout}=await execFileAsync("curl",["-L","--ipv4","--http1.1","--connect-timeout","5","--max-time","12","--retry","1","-A",UA,"-H","Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",url],{maxBuffer:12*1024*1024});
      if(stdout.length>120)return{url,html:stdout,method:"curl"};
    }catch(e){attempts.push(url+" -> curl "+String(e))}
    return null;
  };
  const uniqueUrls=[...new Set(urls)];
  for(let i=0;i<uniqueUrls.length&&pages.length<10&&Date.now()<deadline;i+=3){
    const chunk=uniqueUrls.slice(i,i+3);
    const found=await Promise.all(chunk.map(fetchOne));
    for(const page of found)if(page)pages.push(page);
  }
  if(!pages.length)throw new Error("No reachable official page within 90s after fetch/curl fallback. "+attempts.slice(-16).join(" | "));
  return{
    url:pages[0].url,
    html:pages.map(p=>p.html).join("\n"),
    method:pages.every(p=>p.method==="fetch")?"fetch":"mixed",
    usedFallback:pages.some(p=>p.url!==source.updatesUrl),
    attempts:attempts.length+pages.length,
    pages:pages.map(p=>p.url)
  };
}
function extractLinks(html,source){
  const out=[],seen=new Set(),add=(title,href)=>{
    title=clean(title);href=String(href||"").trim();
    if(title.length<12||title.length>500||BAD_TITLES.test(title)||BAD_PHRASES.test(title)||GENERIC_TITLE.test(title)||BAD_TEMPLATE.test(title)||!KEYWORDS.test(title))return;
    if(/^(#|javascript:|mailto:|tel:)/i.test(href))return;
    let url;try{url=new URL(href,source.updatesUrl).href}catch{return}
    if(!URL_HINTS.test(url)&&!KEYWORDS.test(title))return;
    const key=url.split("#")[0];if(seen.has(key))return;seen.add(key);
    const idHash=createHash("sha256").update(key).digest("hex").slice(0,16);
    out.push({id:"auto-"+source.id+"-"+idHash,title,organization:source.organization,category:source.category,stage:stage(title),status:"Detected on official source",lastChecked:today(),officialUrl:source.updatesUrl,notificationUrl:url,description:"Detected automatically from the registered official "+source.organization+" source. The original authority notice remains the controlling source."});
  };
  const re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;let m;
  while((m=re.exec(html))&&out.length<120)add(m[2],m[1]);
  const pdfRe=/(?:href|url|fileUrl|documentUrl|pdfUrl|attachmentUrl|downloadUrl)?\s*[:=]?\s*["']((?:https?:\/\/|https?:\\\/\\\/|\/)[^"'\s<>]+?\.pdf(?:[?#][^"']*)?)["']/gi;
  while((m=pdfRe.exec(html))&&out.length<180){
    const raw=m[1].replace(/\\\//g,"/");
    const before=html.slice(Math.max(0,m.index-700),m.index);
    const after=html.slice(m.index,Math.min(html.length,m.index+700));
    const context=clean((before+" "+after).replace(/<[^>]+>/g," ").replace(/\s+/g," "));
    const hit=context.match(/[^.]{0,220}(?:junior engineer|combined graduate|combined higher secondary|stenographer|selection post|sub.?inspector|multi.?tasking|constable|notice|notification|recruitment|vacancy|examination)[^.]{0,220}/i);
    const title=hit?.[0]||clean(raw.split("/").pop()?.replace(/[-_]/g," ").replace(/\.pdf.*$/i,""))||"Official notification";
    add(title,raw);
  }
  return out;
}

async function htmlText(url){
  try{
    const r=await fetch(url,{headers:HEADERS,redirect:"follow",signal:AbortSignal.timeout(12000)});
    const ct=r.headers.get("content-type")||"";
    if(r.ok&&(/html|xml|text/i.test(ct))){
      const raw=await r.text();
      return clean(raw).slice(0,180000);
    }
  }catch{}
  try{
    const {stdout}=await execFileAsync("curl",["-L","--ipv4","--http1.1","--connect-timeout","8","--max-time","16","--retry","1","-A",UA,"-H","Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",url],{maxBuffer:12*1024*1024});
    return clean(stdout).slice(0,180000);
  }catch{return ""}
}
function dataCertainty(text){
  const s=String(text||"");
  if(/annual\s+calendar|exam\s+calendar|indicative\s+notice/i.test(s)&&!/detailed\s+(?:employment\s+)?notification|centralised\s+employment\s+notification|notification\s+for\s+recruitment/i.test(s))return "calendar";
  if(/tentative|indicative|proposed|expected|likely|subject\s+to\s+change|may\s+be\s+conducted/i.test(s))return "tentative";
  return "confirmed";
}
function applicationWindowStatus(data,now=new Date()){
  const raw=String(data?.applicationDates||"");
  const parts=raw.split(/\s+to\s+/i);
  const start=parseDateToken(parts[0]);
  const end=parseDateToken(parts.at(-1)||data?.lastDate||"");
  const today=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
  if(end&&end<today)return "closed";
  if(start&&start>today)return "upcoming";
  if(start&&end&&start<=today&&today<=end)return "open";
  return "unknown";
}
async function pdfText(url){
  const dir=await fs.mkdtemp(path.join("/tmp/","sarkariprep-")),pdf=path.join(dir,"notice.pdf"),txt=path.join(dir,"notice.txt");
  try{
    const variants=[url];
    try{
      const u=new URL(url);
      const v=new URL(u.href);
      if(v.hostname.startsWith("www."))v.hostname=v.hostname.slice(4);else v.hostname="www."+v.hostname;
      if(v.href!==url)variants.push(v.href);
    }catch{}
    let b=null;
    for(const target of [...new Set(variants)]){
      for(let attempt=1;attempt<=2&&!b;attempt++){
        try{
          const r=await fetch(target,{headers:{...HEADERS,accept:"application/pdf,*/*"},redirect:"follow",signal:AbortSignal.timeout(12000)});
          if(r.ok){const x=Buffer.from(await r.arrayBuffer());if(x.length>=1000)b=x;}
        }catch{}
      }
      if(!b)for(const extra of [[],["--ipv4"],["--http1.1"]]){
        try{
          const {stdout}=await execFileAsync("curl",["-L",...extra,"--connect-timeout","8","--max-time","20","--retry","1","-A",UA,"-H","Accept: application/pdf,*/*",target],{maxBuffer:12*1024*1024});
          const x=Buffer.from(stdout);if(x.length>=1000){b=x;break;}
        }catch{}
      }
      if(b)break;
    }
    if(!b)return"";
    await fs.writeFile(pdf,b);
    await execFileAsync("pdftotext",["-layout",pdf,txt],{maxBuffer:8*1024*1024,timeout:12000});
    return(await fs.readFile(txt,"utf8")).slice(0,180000);
  }catch{return""}finally{await fs.rm(dir,{recursive:true,force:true}).catch(()=>{})}
}
async function findPdf(url){
  if(/\.pdf(?:[?#].*)?$/i.test(url))return url;
  try{
    const targets=[url];
    const r=await fetch(url,{headers:{...HEADERS,accept:"application/pdf,text/html"},redirect:"follow",signal:AbortSignal.timeout(9000)});
    if((r.headers.get("content-type")||"").includes("pdf"))return url;
    const html=await r.text();
    const ms=[...html.matchAll(/(?:href|url|fileUrl|documentUrl)\s*[:=]?\s*["']([^"']+\.pdf(?:[?#][^"']*)?)["']/gi)];
    if(ms.length)for(const m of ms){try{targets.push(new URL(m[1],url).href)}catch{}}
    const generic=html.match(/https?:\/\/[^"'\s<>]+\.pdf(?:[?#][^"'\s<>]*)?/i);
    if(generic)targets.push(generic[0]);
    for(const t of [...new Set(targets)]){
      try{
        const q=await fetch(t,{headers:{...HEADERS,accept:"application/pdf,*/*"},redirect:"follow",signal:AbortSignal.timeout(7000)});
        if(q.ok&&((q.headers.get("content-type")||"").includes("pdf")||/\.pdf(?:[?#]|$)/i.test(t)))return t;
      }catch{}
    }
  }catch{}
  return null;
}
const MONTHS="january|february|march|april|may|june|july|august|september|october|november|december";
function parseDateToken(value){
  const s=String(value||"").trim();
  let m=s.match(/^(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})$/i);
  if(m){const months={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11};return new Date(Date.UTC(+m[3],months[m[2].toLowerCase()],+m[1]));}
  m=s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);
  if(m){const y=+m[3]<100?2000+ +m[3]:+m[3];return new Date(Date.UTC(y,+m[2]-1,+m[1]));}
  return null;
}
function applicationWindowClosed(data,now=new Date()){
  const raw=data?.lastDate || (data?.applicationDates||"").split(/\s+to\s+/i).pop();
  const end=parseDateToken(raw);
  if(!end || Number.isNaN(end.getTime())) return false;
  const today=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
  return end < today;
}
const DATE_TOKEN="(\\d{1,2}\s+(?:"+MONTHS+")\s+\\d{4}|\\d{1,2}[.\\/-]\\d{1,2}[.\\/-]\\d{2,4})";
function fieldEvidence(text,re,label){const m=text.match(re);if(!m)return null;const i=m.index||0;return {value:m[1]?.trim(),label,snippet:text.slice(Math.max(0,i-100),Math.min(text.length,i+Math.max(220,m[0].length+100))).replace(/\s+/g," ").trim()};}
function parseStructured(t){
  // Do not parse JavaScript/CSS/Liferay bundles embedded in an authority page.
  // Those bundles can contain values such as "5.0.34 to 5.0.44" which are not
  // recruitment dates.
  const text=String(t)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi," ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi," ")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi," ")
    .replace(/\r/g," ").replace(/\n+/g," ").replace(/\s+/g," ").trim();
  const out={},e=[],evidenceSnippets=[];
  const capture=(re,label)=>{const m=text.match(re);if(!m)return null;const i=m.index||0;return {value:(m[1]||"").trim(),label,snippet:text.slice(Math.max(0,i-140),Math.min(text.length,i+Math.max(280,m[0].length+140))).trim()};};
  const last=capture(/(?:last date|closing date|last date for (?:submission of )?(?:online )?application|applications? (?:will )?close(?:s)?)[^0-9]*(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i,"lastDate");
  if(last?.value){out.lastDate=last.value;e.push("lastDate");evidenceSnippets.push(last.snippet);}
  if(!out.lastDate){
    const titleLike=text.match(/(?:last date|closing date|last date for application)[^0-9]{0,80}(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i);
    if(titleLike){out.lastDate=titleLike[1];e.push("lastDate");evidenceSnippets.push(titleLike[0].slice(0,320));}
  }
  const range=text.match(/(?:online )?(?:application|registration|portal|window|opportunity|submission|apply)(?:s)?[^0-9]{0,140}(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})[^0-9]{0,100}(?:to|till|upto|up to|[-–])[^0-9]*(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i);
  if(range){out.applicationDates=range[1]+" to "+range[2];e.push("applicationDates");evidenceSnippets.push(range[0].slice(0,320));}
  if(!out.applicationDates){
    const applyRange=text.match(/(?:apply|applications?|online\s+application(?:s)?)\D{0,100}(?:from|between|open(?:ing)?\s+on)\s+(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})\s*(?:to|till|upto|up to|[-–])\s*(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i);
    if(applyRange){out.applicationDates=applyRange[1]+" to "+applyRange[2];e.push("applicationDates");evidenceSnippets.push(applyRange[0].slice(0,320));}
  }
  const examRange=text.match(/(?:date of (?:the )?examination|date of examination|exam(?:ination)?(?: will be held| scheduled| shall be held)?|online exam(?:ination)?)[^0-9]{0,120}(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})(?:[^0-9]{0,40}(?:to|till|upto|up to|[-–]))?[^0-9]*(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})?/i);
  if(examRange){out.examDate=examRange[2]?examRange[1]+" to "+examRange[2]:examRange[1];e.push("examDate");evidenceSnippets.push(examRange[0].slice(0,360));}

  const vacancy=capture(/(?:number of )?(?:vacancies|vacant posts|total posts|total vacancies|tentative vacancies|total tentative vacancies|posts?)[^0-9]{0,90}([0-9][0-9,]{2,})/i,"vacancies");
  if(vacancy?.value){out.vacancies=vacancy.value+" notified";e.push("vacancies");evidenceSnippets.push(vacancy.snippet);}
  let m=text.match(/(?:minimum age|minimum age limit|age limit|age between|age should be)[^0-9]{0,60}([0-9]{1,2})[^0-9]{0,100}(?:maximum age|upper age|years?)/i);
  if(!m)m=text.match(/(?:age limit|age between|age should be)[^0-9]{0,40}([0-9]{1,2})\s*(?:to|-|–)\s*([0-9]{1,2})\s*years?/i);
  if(m){out.minAge=+m[1];out.maxAge=+(m[2]||m[1]);e.push("age");evidenceSnippets.push(m[0].slice(0,320));}
  m=text.match(/(?:application fee|examination fee|exam fee)[^:]{0,100}(?:rs\.?|₹)\s*([0-9][0-9,]*)/i);
  if(m){out.fee="₹"+m[1];e.push("fee");evidenceSnippets.push(m[0].slice(0,320));}
  m=text.match(/(?:correction|edit|modification)[^0-9]{0,100}(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})[^0-9]{0,60}(?:to|till|upto|up to|-|–)?[^0-9]*(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})?/i);
  if(m){out.correctionDates=m[0].slice(0,220);e.push("correctionDates");evidenceSnippets.push(m[0].slice(0,320));}
  m=text.match(/(?:educational qualification|essential qualification|minimum educational qualification|qualification)[^:]{0,80}:?\s*([^.;]{20,260})/i);
  if(m){out.qualification=m[1].trim();e.push("qualification");evidenceSnippets.push(m[0].slice(0,360));}
  m=text.match(/(?:selection process|selection procedure|mode of selection)[^:]{0,80}:?\s*([^.;]{20,260})/i);
  if(m){out.selectionProcess=m[1].trim();e.push("selectionProcess");evidenceSnippets.push(m[0].slice(0,360));}
  m=text.match(/(?:pay level|pay scale|salary|remuneration)[^:]{0,80}:?\s*([^.;]{5,180})/i);
  if(m){out.payScale=m[1].trim();e.push("payScale");evidenceSnippets.push(m[0].slice(0,300));}
  m=text.match(/(?:nationality|citizenship)[^:]{0,50}:?\s*([^.;]{10,180})/i);
  if(m){out.nationality=m[1].trim();e.push("nationality");evidenceSnippets.push(m[0].slice(0,260));}
  m=text.match(/(?:domicile|reservation for candidates of|state domicile)[^:]{0,60}:?\s*([^.;]{10,220})/i);
  if(m){out.domicile=m[1].trim();e.push("domicile");evidenceSnippets.push(m[0].slice(0,300));}
  m=text.match(/(?:age relaxation|relaxation in upper age|upper age relaxation)[^:]{0,100}:?\s*([^.;]{10,260})/i);
  if(m){out.ageRelaxation=m[1].trim();e.push("ageRelaxation");evidenceSnippets.push(m[0].slice(0,320));}

  // Reject malformed date captures before they can become high-confidence data.
  const hasRealDate=v=>/\b20\d{2}\b/.test(String(v||"")) && /\b\d{1,2}(?:[.\/-]\d{1,2}[.\/-]\d{2,4}|\s+[A-Za-z]{3,9}\s+20\d{2})\b/i.test(String(v||""));
  for(const k of ["lastDate","applicationDates","examDate","correctionDates"]) if(out[k]&&!hasRealDate(out[k])){delete out[k];const i=e.indexOf(k);if(i>=0)e.splice(i,1);}
  return{data:out,evidence:e,evidenceSnippets};
}
function examEvidenceWindows(text,exam){
  const raw=String(text||"")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi," ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi," ")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi," ")
    .replace(/\r/g," ").replace(/\n+/g," ").replace(/\s+/g," ").trim();
  const aliases=[exam.name,...(EXAM_ALIASES[exam.slug]||[])].map(norm).filter(x=>x.length>=5);
  const lower=norm(raw);
  const windows=[];
  for(const alias of aliases){
    const idx=lower.indexOf(alias);
    if(idx<0)continue;
    // norm() collapses whitespace, so use a generous proportional window in the
    // normalized representation. It is intentionally local: unrelated pages/
    // dates elsewhere in a long PDF cannot satisfy identity evidence.
    windows.push(lower.slice(Math.max(0,idx-4500),Math.min(lower.length,idx+7000)));
  }
  return windows.length?Array.from(new Set(windows)):[];  
}
function parseBestExamNotice(text,exam){
  const windows=examEvidenceWindows(text,exam);
  let best=null;
  for(const window of windows){
    const p=parseStructured(window);
    const fields=["examDate","lastDate","applicationDates","vacancies","minAge","maxAge","fee","correctionDates","qualification","selectionProcess","payScale","nationality","domicile","ageRelaxation"];
    const fieldCount=fields.filter(k=>p.data[k]!==undefined).length;
    const score=p.evidence.length*3+fieldCount+(p.data.examDate?8:0)+(p.data.applicationDates||p.data.lastDate?5:0)+(p.data.vacancies?3:0);
    if(!best||score>best.score)best={...p,score,identityWindow:true};
  }
  return best;
}

function deriveCycleYear(title,text){
  const current=new Date().getUTCFullYear();
  const titleYears=[...String(title||"").matchAll(/\b20\d{2}\b/g)].map(m=>Number(m[0]));
  const titleCandidate=titleYears.find(y=>y>=current-2&&y<=current+2);
  if(titleCandidate)return titleCandidate;
  const source=String(title||"")+" "+String(text||"").slice(0,30000);
  const explicit=[
    /(?:recruit(?:ing|ment)?\s+year|recruitment\s+cycle|cycle\s+year|exam(?:ination)?\s+year|academic\s+year|session)\D{0,30}(20\d{2})/i,
    /(?:intake|batch|entry)\D{0,20}(?:0?\d{1,2}\/)?(20\d{2})/i,
    /(?:recruit(?:ing|ment)?\s+year|cycle)\D{0,20}(\d{2})\s*[-/]\s*(?:\d{2}|20\d{2})/i
  ];
  for(const re of explicit){
    const m=source.match(re);
    if(m){
      const raw=Number(m[1]);
      const year=raw<100?2000+raw:raw;
      if(year>=current-1&&year<=current+2)return year;
    }
  }
  const bodyCandidate=[...String(text||"").matchAll(/\b20\d{2}\b/g)].map(m=>Number(m[0])).find(y=>y>=current-1&&y<=current+2);
  return bodyCandidate||null;
}
const config=JSON.parse(await fs.readFile("config/official-sources.json","utf8"));
const batch=Number(process.env.SOURCE_BATCH||0),count=Number(process.env.SOURCE_BATCH_COUNT||8);
const selected=config.filter((_,i)=>i%count===batch);
const failures=[],statuses=[],results=[],overrides={};
const examSource=await fs.readFile("lib/exams.ts","utf8");
const exams=[
  ...(examSource.match(/slug:"([^"]+)"[^\n]*name:"([^"]+)"[^\n]*organization:"([^"]+)"/g)?.map(x=>{const m=x.match(/slug:"([^"]+)"[^\n]*name:"([^"]+)"[^\n]*organization:"([^"]+)"/);return{slug:m[1],name:m[2],organization:m[3]}})||[]),
  ...[...examSource.matchAll(/\["([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)"\]/g)].map(m=>({slug:"family-"+m[1],name:m[2],organization:m[3]}))
].filter((e,i,a)=>a.findIndex(x=>x.slug===e.slug)===i);
const ORG_ALIASES={
  "Staff Selection Commission":["ssc"],
  "Indian Railways / RRB":["rrb","railway recruitment board","railway recruitment boards","indian railways"],
  "Railway Recruitment Boards":["rrb","railway recruitment board","railway recruitment boards","indian railways"],

  "National Testing Agency":["nta","national testing agency"],
  "NTA/CSIR":["nta","csir","national testing agency"],
  "CTET":["ctet","central teacher eligibility test"],
  "SSC":["ssc","staff selection commission"],
  "CBSE":["cbse","ctet","central teacher eligibility test"],
  "State Bank of India":["sbi"],
  "Reserve Bank of India":["rbi"],
  "Indian Navy":["navy","join indian navy"],
  "Indian Air Force":["iaf","indian air force","air force","afcat","agniveervayu"],
  "Indian Army":["army","indian army","agniveer","join indian army","cee"],
  "Indian Coast Guard":["coast guard","indian coast guard","icg"],
  "Jharkhand Public Service Commission":["jpsc"],
  "Bihar Public Service Commission":["bpsc"],
  "West Bengal Public Service Commission":["wbpsc"],
  "Andhra Pradesh Public Service Commission":["appsc"],
  "Telangana Public Service Commission":["tspsc","tgpsc"]
};
const aliasTokens=s=>norm(s).split(" ").filter(x=>x.length>=3);
const EXAM_ALIASES={
  "ssc-cgl-2026":["ssc cgl","combined graduate level","cgl"],
  "ssc-chsl-2026":["ssc chsl","combined higher secondary level","chsl"],
  "ssc-mts-2026":["ssc mts","multi tasking","mts"],
  "rrb-ntpc-2026":["rrb ntpc","ntpc","non technical popular categories"],
  "rrb-group-d-2026":["rrb group d","group d","level 1"],
  "upsc-ese-2027":["engineering services","ese","ies"],
  "cds-ii-2026":["cds ii","combined defence services","cds"],
  "nda-ii-2026":["nda ii","national defence academy","nda"],
  "ctet-2026":["ctet","central teacher eligibility test"],
  "sbi-po-2026":["sbi po","probationary officer"],
  "family-upsc-ese":["engineering services","ese","ies"],
  "family-upsc-ifs":["indian forest service","ifs"],
  "family-upsc-cms":["combined medical services","cms"],
  "family-upsc-geoscientist":["combined geo scientist","geo scientist"],
  "family-ssc-cpo":["sub inspector","delhi police","capfs","ssc cpo"],
  "family-ssc-je":["junior engineer","ssc je"],
  "family-ssc-stenographer":["ssc stenographer","stenographer grade c","stenographer grade d"],
  "family-ssc-selection-post":["selection post"],
  "family-ssc-gd":["ssc gd","constable gd"],
  "family-rrb-alp":["assistant loco pilot","alp"],
  "family-rrb-technician":["rrb technician","technician"],
  "family-rrb-je":["rrb junior engineer","rrb je"],
  "family-rrb-ntpc-ug":["rrb ntpc","undergraduate"],
  "family-rrb-rpf-si":["rpf sub inspector","rpf si"],
  "family-rrb-rpf-constable":["rpf constable"],
  "family-ibps-rrb-office-assistant":["ibps rrb office assistant","office assistant","rrb clerk"],
  "family-ibps-rrb-officer":["ibps rrb officer","officer scale"],
  "family-ibps-so":["ibps specialist officer","specialist officer"],
  "family-sbi-clerk":["sbi junior associate","sbi clerk"],
  "family-rbi-grade-b":["rbi grade b"],
  "family-rbi-assistant":["rbi assistant"],
  "family-afcat":["afcat"],
  "family-agniveer-airforce":["agniveervayu","agniveer vayu"],
  "family-agniveer-army":["agniveer","indian army"],
  "family-agniveer-navy":["agniveer navy","indian navy"],
  "family-coast-guard":["coast guard","indian coast guard"],
  "family-jpsc-forest":["jpsc forest","forest ranger","forest service"],
  "family-jssc-cgl":["jssc cgl","combined graduate level"],
  "family-jssc-inter":["jssc intermediate","intermediate level"],
  "family-jssc-matric":["jssc matric","matric level"],
  "family-lic-aao":["lic aao","assistant administrative officer","life insurance corporation"]
};
const hostOf=value=>{try{return new URL(value||"").hostname.replace(/^www\\./,"").toLowerCase()}catch{return ""}};
const sameOrSubdomain=(a,b)=>!!a&&!!b&&(a===b||a.endsWith("."+b)||b.endsWith("."+a));
const matchExam=(title,source,evidence="")=>{
  const t=norm(title+" "+evidence), sourceHost=hostOf(source.updatesUrl);
  const sourceOrg=norm(source.organization||"");
  let best=null;
  for(const e of exams){
    const examHost=hostOf(e.officialUrl);
    const examOrg=norm(e.organization||"");
    const aliases=(ORG_ALIASES[source.organization]||[]).map(norm);
    const orgMatch=sourceOrg===examOrg || aliases.some(a=>sourceOrg.includes(a)||examOrg.includes(a)) ||
      (sourceOrg.includes("staff selection")&&examOrg==="ssc") ||
      (sourceOrg.includes("railway")&&examOrg.includes("railway")) ||
      (sourceOrg.includes("national testing")&&examOrg.includes("nta")) ||
      (sourceOrg.includes("central board")&&examOrg==="cbse");
    // Both organization identity and registered official host are trust boundaries.
    // A notice from one authority must never be attributed to another authority.
    if(!orgMatch) continue;
    if(!sameOrSubdomain(sourceHost,examHost)) continue;
    const custom=(EXAM_ALIASES[e.slug]||[]).map(norm).filter(x=>x.length>=5);
    const fullName=norm(e.name);
    const exactName=t.includes(fullName);
    const customHits=custom.filter(a=>t.includes(a)).length;
    const titleTokens=aliasTokens(title).filter(x=>x.length>=4);
    const meaningfulTitleHits=titleTokens.filter(x=>t.includes(x)).length;
    const year=(e.name.match(/\b20\d{2}\b/)||[])[0];
    if(year&&!t.includes(year)) continue;
    let score=exactName?20:0;
    score+=customHits*8;
    if(meaningfulTitleHits>=2)score+=6;
    if(e.slug.startsWith("family-")){
      if(!exactName&&customHits===0)continue;
    }else if(!exactName&&customHits===0&&meaningfulTitleHits<2){
      continue;
    }
    if(!best||score>best.score)best={e,score};
  }
  return best&&best.score>=8?best.e:null;
};
for(const source of selected){
  try{
    const f=await fetchSource(source),det=extractLinks(f.html,source);results.push(...det);
    const candidates=det
      .filter(x=>!["Result","Admit Card","Answer Key"].includes(x.stage))
      .map(x=>({item:x,exam:matchExam(x.title,source,x.description||"")}))
      .filter(x=>x.exam || x.item.stage==="Application Open")
      .sort((a,b)=>Number(!!b.exam)-Number(!!a.exam))
      .slice(0,80);
    for(const {item,exam} of candidates.slice(0,12)){
      if(!exam) continue;
      const titleCycle=deriveCycleYear(item.title,item.title);
      const examCycle=Number((exam.name.match(/\b20\d{2}\b/)||[])[0]||0);
      if(examCycle&&titleCycle&&titleCycle!==examCycle) continue;

      let documentText="";
      const target=item.notificationUrl||"";
      if(/\.pdf(?:[?#].*)?$/i.test(target)) documentText=await pdfText(target);
      else {
        documentText=await htmlText(target);
        if(!documentText){
          const pdf=await findPdf(target);
          if(pdf) documentText=await pdfText(pdf);
        }
      }
      if(!documentText) documentText=f.html;

      const parsed=parseBestExamNotice(documentText,exam);
      if(!parsed||!parsed.evidence?.length) continue;
      const fields=parsed.data||{};
      const cycleYear=deriveCycleYear(item.title,documentText)||examCycle||null;
      if(examCycle&&cycleYear&&cycleYear!==examCycle) continue;

      const applicationDates=fields.applicationDates, lastDate=fields.lastDate;
      const applicationStatus=applicationWindowStatus({applicationDates,lastDate});
      const evidenceCount=new Set(parsed.evidence).size;
      if(evidenceCount<2&&!fields.examDate&&!fields.applicationDates&&!fields.lastDate) continue;

      const override={
        slug:exam.slug,name:exam.name,organization:exam.organization,
        notificationUrl:item.notificationUrl||source.updatesUrl,sourceUrl:source.updatesUrl,
        lastVerified:today(),detectedAt:today(),
        confidence:evidenceCount>=2?"high":"medium",evidenceCount,
        evidence:[...new Set(parsed.evidence)],
        evidenceSnippets:[...new Set(parsed.evidenceSnippets||[])].slice(0,8),
        sourceTitle:item.title,cycleYear:cycleYear||undefined,
        ...(exam.slug.startsWith("family-")?{familySlug:exam.slug}:{cycleSlug:exam.slug}),
        ...(applicationDates?{applicationDates}:{}),...(lastDate?{lastDate}:{}),
        ...(fields.examDate?{examDate:fields.examDate}:{}),
        ...(fields.vacancies?{vacancies:fields.vacancies}:{}),
        ...(typeof fields.minAge==="number"?{minAge:fields.minAge}:{}),
        ...(typeof fields.maxAge==="number"?{maxAge:fields.maxAge}:{}),
        ...(fields.fee?{fee:fields.fee}:{}),...(fields.correctionDates?{correctionDates:fields.correctionDates}:{}),
        ...(fields.qualification?{qualification:fields.qualification}:{}),
        ...(fields.selectionProcess?{selectionProcess:fields.selectionProcess}:{}),
        ...(fields.payScale?{payScale:fields.payScale}:{}),
        ...(fields.nationality?{nationality:fields.nationality}:{}),
        ...(fields.domicile?{domicile:fields.domicile}:{}),
        ...(fields.ageRelaxation?{ageRelaxation:fields.ageRelaxation}:{}),
        dataCertainty:dataCertainty(documentText),applicationStatus
      };
      const old=overrides[exam.slug];
      if(!old||override.confidence==="high"||(old.confidence!=="high"&&override.evidenceCount>old.evidenceCount)) overrides[exam.slug]=override;
    }
    statuses.push({id:source.id,organization:source.organization,category:source.category,region:source.region,sourceUrl:f.url,ok:true,health:"healthy",detected:det.length,lastChecked:today(),method:f.method,attempts:f.attempts});
  }catch(e){
    failures.push({source:source.organization,error:String(e)});
    statuses.push({id:source.id,organization:source.organization,category:source.category,region:source.region,sourceUrl:source.updatesUrl,ok:false,health:"unreachable",detected:0,lastChecked:today(),error:String(e)});
  }
}
const unique=[],seen=new Set();
for(const x of results){const k=x.notificationUrl?.split("#")[0]||x.title;if(seen.has(k))continue;seen.add(k);unique.push(x)}
await fs.mkdir("official-refresh-batches",{recursive:true});
await fs.writeFile(`official-refresh-batches/batch-${batch}.json`,JSON.stringify({batch,sourceCount:selected.length,results:unique,statuses,failures,overrides},null,2));
console.log(`batch ${batch}: ${selected.length} sources, ${statuses.filter(x=>x.ok).length} successful, ${unique.length} updates, ${Object.keys(overrides).length} overrides`);
