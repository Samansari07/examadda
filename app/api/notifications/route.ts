import {NextResponse} from "next/server";
import {notifications} from "@/lib/notifications";
import {autoNotifications,autoNotificationMeta} from "@/lib/auto-notifications";
import {officialSources} from "@/lib/official-sources";
import {sourceStatuses} from "@/lib/source-status";

export async function GET(){
 const items=[...autoNotifications,...notifications.filter(n=>!autoNotifications.some(a=>a.notificationUrl===n.notificationUrl))];
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