#!/usr/bin/env node
import fs from "node:fs/promises";

const SOURCES = [
  {id:"upsc", organization:"UPSC", category:"Central Government", url:"https://www.upsc.gov.in/whats-new"},
  {id:"ssc", organization:"Staff Selection Commission", category:"Central Government", url:"https://ssc.gov.in/"},
  {id:"ibps", organization:"IBPS", category:"Banking", url:"https://www.ibps.in/index.php/crp-updates/"},
  {id:"nta", organization:"National Testing Agency", category:"Entrance / Eligibility", url:"https://www.nta.ac.in/NoticeBoardArchive"},
  {id:"ctet", organization:"CTET", category:"Teaching", url:"https://ctet.nic.in/"},
  {id:"railways", organization:"Indian Railways / RRB", category:"Railway", url:"https://indianrailways.gov.in/"},
  {id:"jpsc", organization:"Jharkhand Public Service Commission", category:"State Government", url:"https://jpsc.gov.in/"},
  {id:"jssc", organization:"Jharkhand Staff Selection Commission", category:"State Government", url:"https://jssc.jharkhand.gov.in/"},
  {id:"rbi", organization:"Reserve Bank of India", category:"Banking", url:"https://opportunities.rbi.org.in/"},
  {id:"sbi", organization:"State Bank of India", category:"Banking", url:"https://sbi.co.in/web/careers"}
];

const KEYWORDS = /notification|notice|recruitment|vacanc|corrigendum|application|apply|admit card|answer key|result|calendar|schedule|examination|exam|shortlist|interview|extension|registration|provisional|final/i;
const STAGE = (title) => {
  const t=title.toLowerCase();
  if(/admit card|hall ticket/.test(t)) return "Admit Card";
  if(/answer key|response sheet/.test(t)) return "Answer Key";
  if(/result|score card|cut.?off/.test(t)) return "Result";
  if(/apply|application|registration|notification/.test(t)) return "Application Open";
  if(/vacanc|recruitment|corrigendum/.test(t)) return "Recruitment";
  return "Upcoming";
};
const clean = (s) => s.replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/<[^>]+>/g," ").replace(/\\s+/g," ").trim();

function extract(html, source) {
  const out=[];
  const seen=new Set();
  const re=/<a\\b[^>]*href=["']([^"']+)["'][^>]*>([\\s\\S]*?)<\\/a>/gi;
  let m;
  while((m=re.exec(html)) && out.length<60){
    const title=clean(m[2]);
    if(title.length<8 || title.length>220 || !KEYWORDS.test(title)) continue;
    const href=m[1].trim();
    if(/^(#|javascript:|mailto:)/i.test(href)) continue;
    let url;
    try { url=new URL(href, source.url).href; } catch { continue; }
    const key=title.toLowerCase()+"|"+url;
    if(seen.has(key)) continue;
    seen.add(key);
    out.push({
      id:"auto-"+source.id+"-"+Buffer.from(key).toString("base64url").slice(0,24),
      title,
      organization:source.organization,
      category:source.category,
      stage:STAGE(title),
      status:"Verified official",
      publishedDate:new Date().toISOString().slice(0,10),
      lastChecked:new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"}),
      officialUrl:source.url,
      notificationUrl:url,
      description:"Automatically detected on the official "+source.organization+" source page. Open the original notice for the complete and legally controlling details."
    });
  }
  return out;
}

async function main(){
  const results=[];
  const failures=[];
  const sourceStatus=[];
  for(const source of SOURCES){
    try{
      const response=await fetch(source.url,{headers:{"user-agent":"SarkariPrep-Official-Checker/1.0","accept":"text/html,application/xhtml+xml"}});
      if(!response.ok) throw new Error("HTTP "+response.status);
      const html=await response.text();
      results.push(...extract(html,source));
      sourceStatus.push({id:source.id,organization:source.organization,sourceUrl:source.url,ok:true,lastChecked:new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"})});
      console.log("OK",source.organization,results.length);
    }catch(error){
      failures.push({source:source.organization,error:String(error)});
      sourceStatus.push({id:source.id,organization:source.organization,sourceUrl:source.url,ok:false,lastChecked:new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"}),error:String(error)});
      console.error("FAIL",source.organization,String(error));
    }
  }

  const unique=[];
  const seen=new Set();
  for(const item of results){
    const key=item.notificationUrl||item.title;
    if(seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  unique.sort((a,b)=>b.lastChecked.localeCompare(a.lastChecked)||a.organization.localeCompare(b.organization)||a.title.localeCompare(b.title));

  const today=new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"});
  const statusBody=[
    "export type SourceStatus = {id:string; organization:string; sourceUrl:string; ok:boolean; lastChecked:string; error?:string};",
    "",
    "export const sourceStatuses:Record<string,SourceStatus> = "+JSON.stringify(Object.fromEntries(sourceStatus.map(x=>[x.organization,x])),null,2)+";",
    ""
  ].join("\\n");
  await fs.writeFile("lib/source-status.ts",statusBody,"utf8");

  const body=[
    "export type AutoNotification = {",
    "  id:string; title:string; organization:string; category:string;",
    '  stage:"Application Open"|"Upcoming"|"Admit Card"|"Answer Key"|"Result"|"Recruitment";',
    '  status:"Verified official"; publishedDate:string; lastChecked:string;',
    "  officialUrl:string; notificationUrl?:string; description:string;",
    "};",
    "",
    "export const autoNotificationMeta = "+JSON.stringify({generatedAt:today,sourcePolicy:"Automatically checked official authority pages; original authority links remain the controlling source.",successfulSources:SOURCES.length-failures.length,failedSources:failures.map(x=>x.source)},null,2)+";",
    "",
    "export const autoNotifications:AutoNotification[] = "+JSON.stringify(unique,null,2)+";",
    ""
  ].join("\n");

  await fs.writeFile("lib/auto-notifications.ts",body,"utf8");
  console.log("Wrote",unique.length,"official updates");
  if(failures.length) console.log("Source failures:",JSON.stringify(failures));
}
main().catch(error=>{console.error(error);process.exit(1)});
