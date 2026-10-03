#!/usr/bin/env node
import fs from "node:fs/promises";
import {URL} from "node:url";

const sources=JSON.parse(await fs.readFile(new URL("../config/official-sources.json",import.meta.url),"utf8"));
const generated=await fs.readFile(new URL("../lib/auto-notifications.ts",import.meta.url),"utf8");
const marker="export const autoNotifications:AutoNotification[] = ";
const start=generated.indexOf(marker);
if(start<0) throw new Error("autoNotifications export not found");
const json=generated.slice(start+marker.length).replace(/;\s*$/,"").trim();
const autoNotifications=JSON.parse(json);

const sourceHosts=new Set();
for(const source of sources){
  for(const value of [source.updatesUrl,...(Array.isArray(source.fallbackUrls)?source.fallbackUrls:[])]){
    try{sourceHosts.add(new URL(value).hostname.replace(/^www\./,"").toLowerCase())}catch{}
  }
}

const months={january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11};
function parseDateToken(value){
  const s=String(value||"").trim();
  let m=s.match(/^(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})$/i);
  if(m)return new Date(Date.UTC(+m[3],months[m[2].toLowerCase()],+m[1]));
  m=s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);
  if(m){const y=+m[3]<100?2000+ +m[3]:+m[3];return new Date(Date.UTC(y,+m[2]-1,+m[1]));}
  return null;
}
function applicationEnd(notice){
  const values=[notice.applicationLastDate,notice.applicationDates,notice.title].filter(Boolean);
  for(const value of values){
    const direct=parseDateToken(value);
    if(direct&&!Number.isNaN(direct.getTime()))return direct;
    const m=String(value).match(/(?:last date|closing date|last date for application|application(?:s)? (?:will )?close(?:s)?)[^0-9]{0,100}(\d{1,2}\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}|\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4})/i);
    const parsed=parseDateToken(m?.[1]);
    if(parsed&&!Number.isNaN(parsed.getTime()))return parsed;
    const parts=String(value).split(/\s+to\s+/i);
    const tail=parseDateToken(parts.at(-1));
    if(tail&&!Number.isNaN(tail.getTime()))return tail;
  }
  return null;
}
const now=new Date();
const today=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
const seen=new Map(),errors=[];
for(const notice of autoNotifications){
  let officialHost="";
  try{officialHost=new URL(notice.officialUrl).hostname.replace(/^www\./,"").toLowerCase()}catch{}
  if(!officialHost||!sourceHosts.has(officialHost))errors.push("Unregistered official source host for "+notice.id+": "+notice.officialUrl);
  if(notice.stage==="Application Open"){
    const end=applicationEnd(notice);
    if(end&&end.getTime()<today)errors.push("Expired application still marked open: "+notice.id+" ("+(notice.applicationLastDate||notice.applicationDates||notice.title)+")");
  }
  if(notice.notificationUrl){
    const key=notice.notificationUrl.replace(/#.*$/,"");
    const prior=seen.get(key);
    if(prior&&prior.organization!==notice.organization)errors.push("Conflicting organizations share notification URL: "+key+" ("+prior.organization+" vs "+notice.organization+")");
    else seen.set(key,notice);
  }
}
if(errors.length){
  console.error("validate-notice-feed: FAILED with "+errors.length+" issue(s)");
  for(const error of errors.slice(0,50))console.error(" - "+error);
  process.exit(1);
}
console.log("validate-notice-feed: OK — "+autoNotifications.length+" notices checked against "+sourceHosts.size+" registered source hosts.");
