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
      else if(!x.hostname.startsWith("www."))x.hostname="www."+x.hostname;
      if(x.href!==u)urls.push(x.href);
    }catch{}
  }
  const attempts=[],pages=[];
  const fetchOne=async url=>{
    try{
      const r=await fetch(url,{headers:HEADERS,redirect:"follow",signal:AbortSignal.timeout(12000)});
      const ct=r.headers.get("content-type")||"";
      if(r.ok&&(ct.includes("html")||ct.includes("xml")||ct.includes("text"))){
        const html=await r.text();
        if(html.length>120)return{url,html,method:"fetch"};
      }
      attempts.push(url+" -> HTTP "+r.status);
    }catch(e){attempts.push(url+" -> "+String(e))}
    try{
      const {stdout}=await execFileAsync("curl",["-L","--ipv4","--http1.1","--connect-timeout","6","--max-time","14","--retry","1","-A",UA,"-H","Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",url],{maxBuffer:12*1024*1024});
      if(stdout.length>120)return{url,html:stdout,method:"curl"};
    }catch(e){attempts.push(url+" -> curl "+String(e))}
    return null;
  };
  for(const url of [...new Set(urls)]){
    if(pages.length>=8)break;
    const page=await fetchOne(url);
    if(page)pages.push(page);
  }
  if(!pages.length)throw new Error(attempts.join(" | "));
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
    const ms=[...html.matchAll(/(?:href|url|fileUrl|documentUrl)\\s*[:=]?\\s*["']([^"']+\\.pdf(?:[?#][^"']*)?)["']/gi)];
    if(ms.length)for(const m of ms){try{targets.push(new URL(m[1],url).href)}catch{}}
    const generic=html.match(/https?:\\/\\/[^"'\\s<>]+\\.pdf(?:[?#][^"'\\s<>]*)?/i);
    if(generic)targets.push(generic[0]);
    for(const t of [...new Set(targets)]){
      try{
        const q=await fetch(t,{headers:{...HEADERS,accept:"application/pdf,*/*"},redirect:"follow",signal:AbortSignal.timeout(7000)});
        if(q.ok&&((q.headers.get("content-type")||"").includes("pdf")||/\\.pdf(?:[?#]|$)/i.test(t)))return t;
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
const DATE_TOKEN="(\\d{1,2}\\s+(?:"+MONTHS+")\\s+\\d{4}|\\d{1,2}[.\\/-]\\d{1,2}[.\\/-]\\d{2,4})";
function fieldEvidence(text,re,label){const m=text.match(re);if(!m)return null;const i=m.index||0;return {value:m[1]?.trim(),label,snippet:text.slice(Math.max(0,i-100),Math.min(text.length,i+Math.max(220,m[0].length+100))).replace(/\\s+/g," ").trim()};}
function parseStructured(t){
  const text=String(t).replace(/\r/g," ").replace(/\n+/g," ").replace(/\s+/g," ").trim();
  const out={},e=[],evidenceSnippets=[];
  const capture=(re,label)=>{const m=text.match(re);if(!m)return null;const i=m.index||0;return {value:(m[1]||"").trim(),label,snippet:text.slice(Math.max(0,i-140),Math.min(text.length,i+Math.max(280,m[0].length+140))).trim()};};
  const last=capture(/(?:last date|closing date|last date for (?:submission of )?(?:online )?application|applications? (?:will )?close(?:s)?)[^0-9]*(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i,"lastDate");
  if(last?.value){out.lastDate=last.value;e.push("lastDate");evidenceSnippets.push(last.snippet);}
  if(!out.lastDate){
    const titleLike=text.match(/(?:last date|closing date|last date for application)[^0-9]{0,80}(\\d{1,2}\\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\\s+\\d{4}|\\d{1,2}[.\\/-]\\d{1,2}[.\\/-]\\d{2,4})/i);
    if(titleLike){out.lastDate=titleLike[1];e.push("lastDate");evidenceSnippets.push(titleLike[0].slice(0,320));}
  }
  const range=text.match(/(?:online )?(?:application|registration|portal|window|opportunity|submission)(?:s)?[^0-9]{0,140}(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})[^0-9]{0,100}(?:to|till|upto|up to|[-–])[^0-9]*(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i);
  if(range){out.applicationDates=range[1]+" to "+range[2];e.push("applicationDates");evidenceSnippets.push(range[0].slice(0,320));}
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
  return{data:out,evidence:e,evidenceSnippets};
}
function deriveCycleYear(title,text){
  const current=new Date().getUTCFullYear();
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
  const titleYears=[...String(title||"").matchAll(/\b20\d{2}\b/g)].map(m=>Number(m[0]));
  const candidate=titleYears.find(y=>y>=current-1&&y<=current+2);
  return candidate||null;
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
  "Indian Railways / RRB":["rrb","railway recruitment board"],
  "National Testing Agency":["nta"],
  "CTET":["ctet","central teacher eligibility test"],
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
  "family-ssc-stenographer":["stenographer","grade c","grade d"],
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
  "family-jssc-matric":["jssc matric","matric level"]
};
const matchExam=(title,source,evidence="")=>{
  const t=norm(title+" "+evidence), sourceNames=[source.organization,...(ORG_ALIASES[source.organization]||[])].map(norm);
  let best=null;
  for(const e of exams){
    const sourceOrg=norm(e.organization);
    const orgMatch=sourceNames.some(a=>a&&sourceOrg===a)||sourceNames.some(a=>a&&t.includes(a));
    if(!orgMatch)continue;
    const custom=(EXAM_ALIASES[e.slug]||[]).map(norm);
    const aliases=[norm(e.slug),norm(e.name),...custom,...aliasTokens(e.name)];
    let score=0;
    for(const a of [...new Set(aliases)].filter(x=>x.length>=3)){
      if(t.includes(a)) score+=a.length>=8?8:4;
    }
    const titleTokens=aliasTokens(title);
    const customHits=custom.filter(a=>t.includes(a)).length;
    const distinctive=titleTokens.filter(x=>x.length>=4&&t.includes(x));
    if(customHits>=2)score+=8;
    if(distinctive.length>=2)score+=4;
    const year=(e.name.match(/\b20\d{2}\b/)||[])[0];
    if(year&&t.includes(year))score+=5;
    if(e.slug.startsWith("family-")&&custom.length){
      const familyHits=custom.filter(a=>t.includes(a)).length;
      if(familyHits===0)continue;
      score+=familyHits*3;
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
    for(const {item,exam} of candidates){
      // An application notice may not map to an exam profile. Ignore it safely;
      // never let one unmatched item mark the entire official source as failed.
      if(!exam) continue;
      const pdf=await findPdf(item.notificationUrl);if(!pdf)continue;
      const txt=await pdfText(pdf);if(!txt)continue;
      const normalized=norm(txt.slice(0,80000));
      const customIdentity=(EXAM_ALIASES[exam.slug]||[]).map(norm);
      const aliases=[norm(exam.name),norm(exam.slug),...customIdentity,...aliasTokens(exam.name)].filter(x=>x.length>3);
      const identityMatches=new Set(aliases.filter(k=>normalized.includes(k))).size;
      const titleIdentity=new Set([item.title,...customIdentity].flatMap(x=>aliasTokens(x)).filter(k=>k.length>3&&normalized.includes(k))).size;
      const identityScore=identityMatches+Math.min(2,titleIdentity);
      const p=parseStructured(txt);
      if(p.data.lastDate) item.applicationLastDate=p.data.lastDate;
      if(p.data.applicationDates) item.applicationDates=p.data.applicationDates;
      if(p.data.examDate) item.examDate=p.data.examDate;
      if(item.stage==="Application Open" && applicationWindowClosed(p.data)){
        item.stage=p.data.examDate ? "Upcoming" : "Notice";
      }
      const derivedYear=deriveCycleYear(item.title,txt);
      const dateYears=[p.data.examDate,p.data.lastDate,p.data.applicationDates].filter(Boolean).join(" ").match(/\b20\d{2}\b/g)?.map(Number)||[];
      const cycleYear=derivedYear || dateYears.find(y=>y>=new Date().getUTCFullYear()-1&&y<=new Date().getUTCFullYear()+1) || null;
      const isFamily=exam?.slug?.startsWith("family-");
      if(!exam) continue;
      if(identityScore<1 || p.evidence.length<2 || !(p.data.examDate || p.data.lastDate || p.data.applicationDates || p.data.vacancies))continue;
      if(exam.slug.startsWith("family-") && identityScore<2)continue;
      if(isFamily && !cycleYear)continue;
      const confidence=identityScore>=2 && p.evidence.length>=2 ? "high" : "medium";
      const cycleSlug=isFamily ? exam.slug.replace(/^family-/,"")+"-"+cycleYear : exam.slug;
      const cycleName=isFamily ? (cycleYear ? exam.name+" "+cycleYear : exam.name) : exam.name;
      overrides[cycleSlug]={...p.data,slug:cycleSlug,cycleSlug,familySlug:isFamily?exam.slug:undefined,cycleYear:isFamily?cycleYear:undefined,name:cycleName,organization:exam.organization,notificationUrl:pdf,sourceUrl:item.officialUrl,lastVerified:today(),detectedAt:today(),confidence,evidenceCount:p.evidence.length,evidence:p.evidence,evidenceSnippets:p.evidenceSnippets,sourceTitle:item.title};
    }
    statuses.push({id:source.id,organization:source.organization,category:source.category,region:source.region,sourceUrl:f.url,ok:true,health:f.usedFallback?"degraded":"healthy",detected:det.length,lastChecked:today(),method:f.method,attempts:f.attempts});
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
