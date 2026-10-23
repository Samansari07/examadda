import {NextResponse} from "next/server";
import {autoNotifications, autoNotificationMeta} from "@/lib/auto-notifications";
import {autoExamData, autoExamDataMeta} from "@/lib/auto-exam-data";
import {discoveredOfficialNotices, discoveryMeta} from "@/lib/discovered-official-notices";
import {sourceStatuses} from "@/lib/source-status";
import {isFeedUseful} from "@/lib/notification-feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const sources = Object.values(sourceStatuses);
  const healthy = sources.filter(s => s.health === "healthy").length;
  const degraded = sources.filter(s => s.health === "degraded").length;
  const unreachable = sources.filter(s => s.health === "unreachable" || s.ok === false).length;
  const usefulAutomatic = autoNotifications.filter(n => isFeedUseful(n)).length;
  const usefulDiscovered = discoveredOfficialNotices.filter(n => isFeedUseful(n)).length;
  const generatedAt = String(discoveryMeta.generatedAt || autoNotificationMeta.generatedAt || "");
  const ageHours = generatedAt ? Math.max(0, (Date.now() - new Date(generatedAt).getTime()) / 3600000) : null;
  const freshness = ageHours === null || !Number.isFinite(ageHours) ? "unknown" : ageHours <= 8 ? "fresh" : ageHours <= 24 ? "stale" : "outdated";
  const warnings: string[] = [];
  if (unreachable) warnings.push(`${unreachable}/${sources.length} official sources are unreachable or failed`);
  if (Object.keys(autoExamData).length === 0) warnings.push("No structured exam overrides were generated; discovered notices do not automatically update catalogue dates or vacancies");
  if (freshness !== "fresh") warnings.push("The latest discovery feed is not fresh");
  if (usefulAutomatic + usefulDiscovered === 0) warnings.push("No useful notifications passed the public feed filter");
  return NextResponse.json({
    ok: warnings.length === 0,
    status: warnings.length === 0 ? "healthy" : "degraded",
    checkedAt: new Date().toISOString(),
    freshness: {status: freshness, generatedAt: generatedAt || null, ageHours: ageHours === null || !Number.isFinite(ageHours) ? null : Math.round(ageHours * 10) / 10},
    sources: {total: sources.length, healthy, degraded, unreachable},
    feed: {
      automatic: autoNotifications.length,
      automaticUseful: usefulAutomatic,
      discovered: discoveredOfficialNotices.length,
      discoveredUseful: usefulDiscovered,
      generatedAt: autoNotificationMeta.generatedAt
    },
    structuredExamData: {count: Object.keys(autoExamData).length, generatedAt: autoExamDataMeta.generatedAt},
    discovery: {registeredSources: discoveryMeta.registeredSources, checkedSources: discoveryMeta.checkedSources, generatedAt: discoveryMeta.generatedAt},
    warnings
  }, {headers: {"Cache-Control": "no-store, max-age=0"}});
}
