"use client";

import { Analytics } from "@vercel/analytics/react";
import { track } from "@vercel/analytics";

export function AnalyticsProvider(){
  return <Analytics />;
}

export function trackEvent(name:string,data?:Record<string,string|number|boolean|null|undefined>){
  try{ track(name,data); }catch{}
}
