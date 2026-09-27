#!/usr/bin/env node
import fs from "node:fs/promises";

const SOURCES = JSON.parse(await fs.readFile(new URL("../config/official-sources.json", import.meta.url), "utf8"));

const KEYWORDS = /notification|notice|recruitment|vacanc|corrigendum|application|apply|admit card|answer key|result|calendar|schedule|examination|exam|shortlist|interview|extension|registration|provisional|final|advertisement|engagement/i;
const STAGE = (title) => {
  const t=title.toLowerCase();
  if(/admit card|hall ticket/.test(t)) return "Admit Card";
  if(/answer key|response sheet/.test(t)) return "Answer Key";
  if(/result|score card|cut.?off/.test(t)) return "Result";
  if(/apply|application|registration|notification/.test(t)) return "Application Open";
  if(/vacanc|recruitment|corrigendum|advertisement|engagement/.test(t)) return "Recruitment";
  return "Upcoming";
};
const clean = (s) => s.replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();

function extract(html, source) {
  const out=[];
  const seen=new Set();
  const re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while((m=re.exec(html)) && out.length<50){
    const title=clean(m[2]);
    if(title.length<8 || title.length>220 || !KEYWORDS.test(title)) continue;
    const href=m[1].trim();
    if(/^(#|javascript:|mailto:|tel:)/i.test(href)) continue;
    let url;
    try { url=new URL(href, source.updatesUrl).href; } catch { continue; }
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
      publishedDate:new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"}),
      lastChecked:new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"}),
      officialUrl:source.updatesUrl,
      notificationUrl:url,
      description:"Automatically detected on the registered official "+source.organization+" source. Open the original notice for the complete and legally controlling details."
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
      const response=await fetch(source.updatesUrl,{headers:{"user-agent":"SarkariPrep-Official-Checker/2.0","accept":"text/html,application/xhtml+xml","accept-language":"en-IN,en;q=0.9"},redirect:"follow"});
      if(!response.ok) throw new Error("HTTP "+response.status);
      const contentType=response.headers.get("content-type")||"";
      if(!contentType.includes("html") && !contentType.includes("xml") && !contentType.includes("text")) {
        throw new Error("Unsupported content type "+contentType);
      }
      const html=await response.text();
      const detected=extract(html,source);
      results.push(...detected);
      sourceStatus.push({id:source.id,organization:source.organization,category:source.category,region:source.region,sourceUrl:source.updatesUrl,ok:true,detected:detected.length,lastChecked:new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"})});
      console.log("OK",source.organization,"detected",detected.length);
    }catch(error){
      failures.push({source:source.organization,error:String(error)});
      sourceStatus.push({id:source.id,organization:source.organization,category:source.category,region:source.region,sourceUrl:source.updatesUrl,ok:false,detected:0,lastChecked:new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"}),error:String(error)});
      console.error("FAIL",source.organization,String(error));
    }
  }

  const unique=[];
  const seen=new Set();
  for(const item of results){
    const key=(item.notificationUrl||item.title).replace(/#.*$/,"");
    if(seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  unique.sort((a,b)=>b.lastChecked.localeCompare(a.lastChecked)||a.organization.localeCompare(b.organization)||a.title.localeCompare(b.title));

  const today=new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Kolkata"});
  const statusBody=[
    "export type SourceStatus = {id:string; organization:string; category:string; region:string; sourceUrl:string; ok:boolean; detected:number; lastChecked:string; error?:string};",
    "",
    "export const sourceStatuses:Record<string,SourceStatus> = "+JSON.stringify(Object.fromEntries(sourceStatus.map(x=>[x.id,x])),null,2)+";",
    ""
  ].join("\n");
  await fs.writeFile("lib/source-status.ts",statusBody,"utf8");

  const body=[
    "export type AutoNotification = {",
    "  id:string; title:string; organization:string; category:string;",
    '  stage:"Application Open"|"Upcoming"|"Admit Card"|"Answer Key"|"Result"|"Recruitment";',
    '  status:"Verified official"; publishedDate:string; lastChecked:string;',
    "  officialUrl:string; notificationUrl?:string; description:string;",
    "};",
    "",
    "export const autoNotificationMeta = "+JSON.stringify({
      generatedAt:today,
      sourceCount:SOURCES.length,
      successfulSources:SOURCES.length-failures.length,
      failedSources:failures.map(x=>x.source),
      sourcePolicy:"Automatically checked registered official authority pages; original authority links remain the controlling source."
    },null,2)+";",
    "",
    "export const autoNotifications:AutoNotification[] = "+JSON.stringify(unique,null,2)+";",
    ""
  ].join("\n");

  await fs.writeFile("lib/auto-notifications.ts",body,"utf8");
  console.log("Wrote",unique.length,"official updates from",SOURCES.length,"registered sources");
  if(failures.length) console.log("Source failures:",JSON.stringify(failures));
}
main().catch(error=>{console.error(error);process.exit(1)});