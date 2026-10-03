#!/usr/bin/env node
import fs from "node:fs/promises";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {URL} from "node:url";
const execFileAsync=promisify(execFile);

const registryPath = new URL("../config/official-sources.json", import.meta.url);
const outputPath = new URL("../lib/discovered-official-notices.ts", import.meta.url);
const sources = JSON.parse(await fs.readFile(registryPath, "utf8"));

const KEYWORDS = /recruit|recruitment|vacanc|career|job|jobs|advertisement|exam|examination|application|apply|admit\s*card|hall\s*ticket|answer\s*key|result|written\s*test|shortlist|selection|interview|corrigendum|appointment|engagement|opportunit/i;
const NOISE = /tender|procurement|supplier|vendor|purchase|e-proc|financial|audited\s+results?|quarterly\s+results?|annual\s+report|investor|shareholder|contract|ge(m|m)|bid\b/i;
const IGNORE = /facebook|twitter|instagram|youtube|linkedin|mailto:|tel:/i;
const MAX_PER_SOURCE = 12;
const TIMEOUT_MS = 12000;
const CURL_TIMEOUT_SECONDS = 15;

function cleanText(value="") {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/&#39;/g, "'").replace(/&quot;/gi, '"').replace(/\s+/g, " ").trim();
}

async function fetchText(url) {
  const headers = {
    "user-agent": "SarkariPrep-Official-Source-Discovery/2.0 (+https://sarkariprep.online)",
    "accept": "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8"
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {signal:controller.signal,redirect:"follow",headers});
    if (response.ok) {
      const type=response.headers.get("content-type")||"";
      if(type.includes("text/html")||type.includes("application/xhtml+xml")) return {html:await response.text(),method:"fetch"};
    }
  } catch {}
  finally { clearTimeout(timer); }
  try {
    const {stdout}=await execFileAsync("curl",[
      "-L","--max-time",String(CURL_TIMEOUT_SECONDS),"--retry","1","-A",headers["user-agent"],
      "-H","Accept: text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",url
    ],{maxBuffer:20*1024*1024});
    if(stdout && stdout.length>120) return {html:stdout,method:"curl"};
  } catch {}
  return null;
}

function extractLinks(html, source, pageUrl) {
  const results = [];
  const seen = new Set();
  const base = new URL(pageUrl);
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(html)) && results.length < MAX_PER_SOURCE) {
    const href = match[1].trim();
    const title = cleanText(match[2]);
    const candidateText = href + " " + title;
    if (!href || !title || title.length < 5 || IGNORE.test(href) || NOISE.test(candidateText) || !KEYWORDS.test(candidateText)) continue;
    let absolute;
    try { absolute = new URL(href, base); } catch { continue; }
    if (!/^https?:$/i.test(absolute.protocol)) continue;
    if (absolute.hostname !== base.hostname && !absolute.hostname.endsWith("." + base.hostname)) continue;
    const normalized = absolute.href.replace(/#.*$/, "");
    if (normalized === source.updatesUrl.replace(/#.*$/, "") || seen.has(normalized)) continue;
    seen.add(normalized);
    const lower = (title + " " + normalized).toLowerCase();
    const stage = /result|merit|selection list|answer key/i.test(lower) ? "Result"
      : /admit card|hall ticket|call letter/i.test(lower) ? "Admit Card"
      : /apply|application|recruit|vacanc|career|job|engagement/i.test(lower) ? "Recruitment"
      : "Notice";
    results.push({
      id: "discover-" + source.id + "-" + Buffer.from(normalized).toString("base64url").slice(0, 18),
      title,
      organization: source.organization,
      category: source.category,
      stage,
      status: "Detected on official source",
      lastChecked: new Date().toISOString().slice(0, 10),
      officialUrl: source.updatesUrl,
      notificationUrl: normalized,
      description: "Discovered automatically from a registered official source. Verify the original authority notice before applying."
    });
  }
  return results;
}

const discovered = [];
const sourceResults = [];
for (const source of sources) {
  const candidateUrls = [source.updatesUrl, ...(Array.isArray(source.fallbackUrls) ? source.fallbackUrls : [])]
    .filter((url, index, list) => url && list.indexOf(url) === index);
  let payload = null;
  let fetchedUrl = null;
  let method = null;
  for (const candidateUrl of candidateUrls) {
    payload = await fetchText(candidateUrl);
    if (payload) {
      fetchedUrl = candidateUrl;
      method = payload.method;
      break;
    }
  }
  const items = payload && fetchedUrl ? extractLinks(payload.html, source, fetchedUrl) : [];
  sourceResults.push({
    id: source.id,
    discovered: items.length,
    checked: Boolean(payload),
    fetchedUrl,
    method
  });
  discovered.push(...items);
}

const unique = Array.from(new Map(discovered.map(item => [item.notificationUrl, item])).values());
const generated = `// AUTO-GENERATED by scripts/discover-official-notices.mjs. Do not edit manually.
export const discoveredOfficialNotices = ${JSON.stringify(unique, null, 2)} as const;
export const discoveryMeta = ${JSON.stringify({
  generatedAt: new Date().toISOString(),
  registeredSources: sources.length,
  checkedSources: sourceResults.filter(x => x.checked).length,
  discoveredItems: unique.length,
  sourceResults
}, null, 2)} as const;
`;

await fs.writeFile(outputPath, generated + "\n");
console.log(JSON.stringify({registeredSources: sources.length, checkedSources: sourceResults.filter(x => x.checked).length, discoveredItems: unique.length}));
