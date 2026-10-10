#!/usr/bin/env node
import fs from "node:fs/promises";

const read = (p) => fs.readFile(p, "utf8");
const registry = JSON.parse(await read("config/official-sources.json"));
const notificationsText = await read("lib/auto-notifications.ts");
const discoveredText = await read("lib/discovered-official-notices.ts");
const examText = await read("lib/auto-exam-data.ts");
const statusText = await read("lib/source-status.ts");

function parseExport(text, marker, suffix = ";") {
  const start = text.indexOf(marker);
  if (start < 0) throw new Error("Missing export: " + marker);
  const body = text.slice(start + marker.length).trim();
  const end = suffix === " as const;" ? body.lastIndexOf(suffix) : body.lastIndexOf(suffix);
  if (end < 0) throw new Error("Malformed export: " + marker);
  return JSON.parse(body.slice(0, end).trim());
}
const autoNotifications = parseExport(notificationsText, "export const autoNotifications:AutoNotification[] = ");
const discovered = parseExport(discoveredText, "export const discoveredOfficialNotices = ", " as const;");
const autoMatch = examText.match(/autoExamData:Record<string,AutoExamOverride> = (\{[\s\S]*\});\s*$/);
if (!autoMatch) throw new Error("Could not parse structured exam overrides");
const autoExamData = JSON.parse(autoMatch[1]);
const statusMatch = statusText.match(/sourceStatuses:Record<string,SourceStatus> = (\{[\s\S]*\});\s*$/);
if (!statusMatch) throw new Error("Could not parse source status report");
const sourceStatuses = JSON.parse(statusMatch[1]);

const host = (value) => {
  try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); } catch { return ""; }
};
const norm = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const sourceFor = (organization) => registry.find((s) => norm(s.organization) === norm(organization));
const registeredHost = (url, source) => {
  if (!source) return false;
  const candidate = host(url);
  return [source.updatesUrl, source.applicationUrl, ...(source.fallbackUrls || []), ...(source.discoveryUrls || [])]
    .some((u) => host(u) === candidate);
};
const failures = [];
const warnings = [];
const seen = new Set();
for (const [label, items] of [["automatic feed", autoNotifications], ["discovered feed", discovered]]) {
  for (const item of items) {
    if (!item.title || !item.organization) failures.push(label + ": item missing title/organization");
    if (!item.officialUrl || !/^https?:\/\//i.test(item.officialUrl)) failures.push(label + ": item missing valid authority URL: " + (item.title || "untitled"));
    const key = String(item.id || item.organization + "|" + item.title);
    if (seen.has(label + "|" + key)) warnings.push(label + ": duplicate id " + key);
    seen.add(label + "|" + key);
    if (item.stage === "Application Open") {
      const dateText = [item.applicationLastDate, item.applicationDates, item.lastDate, item.title].filter(Boolean).join(" ");
      const hasDate = /\b(?:last date|closing date|application(?:s)? (?:close|closing|last date))\b/i.test(dateText) &&
        /\b(?:\d{1,2}\s+[A-Za-z]+\s+20\d{2}|\d{1,2}[./-]\d{1,2}[./-]20\d{2})\b/i.test(dateText);
      if (!hasDate) failures.push(label + ": Application Open without a parseable closing-date claim: " + item.title);
    }
    if (item.status === "Verified official" && !item.officialUrl) failures.push(label + ": verified item has no official authority URL: " + item.title);
  }
}
const sourceValues = Object.values(sourceStatuses);
const unhealthy = sourceValues.filter((s) => s.health === "unreachable" || s.ok === false);
const overrideCount = Object.keys(autoExamData).length;
if (overrideCount === 0) warnings.push("No structured automatic exam overrides were generated; detected notices remain a notice feed and do not automatically update catalogue fields.");
if (unhealthy.length) warnings.push(unhealthy.length + "/" + sourceValues.length + " registered sources are currently marked unreachable; use official fallback/manual verification for these sources.");
for (const item of [...autoNotifications, ...discovered]) {
  const source = sourceFor(item.organization);
  if (source && item.officialUrl && !registeredHost(item.officialUrl, source)) {
    failures.push("Authority URL does not match registered source for " + item.organization + ": " + item.officialUrl);
  }
}
for (const [slug, item] of Object.entries(autoExamData)) {
  if (!item.sourceUrl || !item.notificationUrl || !item.lastVerified) failures.push(slug + ": structured override lacks source/notice/verification timestamp");
  if (item.stale) warnings.push(slug + ": using a preserved stale record; it must not be presented as freshly verified.");
}
console.log("validate-publication-pipeline: " + (failures.length ? "FAILED" : "OK"));
console.log("  registered sources: " + registry.length);
console.log("  source statuses: " + sourceValues.length + "; unreachable: " + unhealthy.length);
console.log("  automatic notices: " + autoNotifications.length);
console.log("  discovered notices: " + discovered.length);
console.log("  structured exam overrides: " + overrideCount);
for (const warning of warnings) console.warn("WARNING: " + warning);
if (failures.length) {
  for (const failure of failures.slice(0, 50)) console.error("FAIL: " + failure);
  process.exit(1);
}
