#!/usr/bin/env node
import fs from "node:fs/promises";
import {URL} from "node:url";

const sources = JSON.parse(await fs.readFile(new URL("../config/official-sources.json", import.meta.url), "utf8"));
const auto = await import(new URL("../lib/auto-notifications.ts", import.meta.url)).catch(() => null);

if (!auto?.autoNotifications) {
  console.error("validate-notice-feed: could not load auto-notifications");
  process.exit(1);
}

const sourceHosts = new Set();
for (const source of sources) {
  for (const value of [source.updatesUrl, ...(Array.isArray(source.fallbackUrls) ? source.fallbackUrls : [])]) {
    try { sourceHosts.add(new URL(value).hostname.replace(/^www\./, "").toLowerCase()); } catch {}
  }
}

const seen = new Map();
const errors = [];
for (const notice of auto.autoNotifications) {
  let officialHost = "";
  try { officialHost = new URL(notice.officialUrl).hostname.replace(/^www\./, "").toLowerCase(); } catch {}
  if (!officialHost || !sourceHosts.has(officialHost)) {
    errors.push(`Unregistered official source host for ${notice.id}: ${notice.officialUrl}`);
  }
  if (notice.notificationUrl) {
    const key = notice.notificationUrl.replace(/#.*$/, "");
    const prior = seen.get(key);
    if (prior && prior.organization !== notice.organization) {
      errors.push(`Conflicting organizations share notification URL: ${key} (${prior.organization} vs ${notice.organization})`);
    } else {
      seen.set(key, notice);
    }
  }
}

if (errors.length) {
  console.error(`validate-notice-feed: FAILED with ${errors.length} issue(s)`);
  for (const error of errors.slice(0, 50)) console.error(" - " + error);
  process.exit(1);
}

console.log(`validate-notice-feed: OK — ${auto.autoNotifications.length} notices checked against ${sourceHosts.size} registered source hosts.`);
