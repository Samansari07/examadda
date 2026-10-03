import {NextResponse} from "next/server";
import {notifications} from "@/lib/notifications";
import {autoNotifications,autoNotificationMeta} from "@/lib/auto-notifications";
import {discoveredOfficialNotices} from "@/lib/discovered-official-notices";
import {officialSources} from "@/lib/official-sources";
import {sourceStatuses} from "@/lib/source-status";
import {isFeedUseful} from "@/lib/notification-feed";

const notificationKey=(n:{title:string;notificationUrl?:string;officialUrl?:string})=>
 (n.notificationUrl||n.officialUrl||n.title).split("#")[0].replace(/\/$/,"").toLowerCase();

export async function GET(){
 const items=Array.from(new Map(
   [...autoNotifications,...discoveredOfficialNotices,...notifications]
     .map(n=>[notificationKey(n),n] as const)
 ).values()).filter(n=>isFeedUseful(n));
 return NextResponse.json({
  updatedAt:autoNotificationMeta.generatedAt,
  sourcePolicy:"Official-source checked; original authority links remain the controlling source.",
  sourceCount:officialSources.length,
  healthySources:officialSources.filter(s=>sourceStatuses[s.id]?.ok).length,
  automaticSourceCount:autoNotificationMeta.sourceCount,
  count:items.length,
  items
 });
}