import type { Metadata } from "next";

export const metadata: Metadata = { title: "Government Job & Exam Alerts | SarkariPrep", description: "Get government job, exam, deadline, admit-card and result alerts from SarkariPrep.", alternates: { canonical: "https://sarkariprep.online/alerts" }, robots: { index: true, follow: true } };

"use client";

import { useEffect, useState } from "react";
import EngagementAlerts from "@/components/engagement-alerts";
import { autoNotifications } from "@/lib/auto-notifications";
import { exams } from "@/lib/exams";
import { autoExamData } from "@/lib/auto-exam-data";
import { getApplicationState, getExamState, applicationLabel, examLabel } from "@/lib/exam-status";
import { cleanFeedTitle, isFeedUseful } from "@/lib/notification-feed";
import { trackEvent } from "@/components/analytics";

export default function AlertsLanding() {
  const [source, setSource] = useState("");
  const [campaign, setCampaign] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setSource(p.get("utm_source") || "");
    setCampaign(p.get("utm_campaign") || "");
  }, []);

  const updates = autoNotifications.filter((n) => isFeedUseful(n)).slice(0, 5);

  // Paid-traffic page shows actionable opportunities first and collapses
  // duplicate language/notice variants from the same recruitment.
  const jobCandidates = autoNotifications
    .filter((n) => isFeedUseful(n) && (/Application Open|Recruitment/i.test(n.stage || "") || /recruit|recruitment|vacan|career|appointment|engagement|constable|technician|apprentice|nurse|teacher|engineer|officer/i.test(cleanFeedTitle(n.title))))
    .sort((a, b) => Number(/Application Open/i.test(b.stage || "")) - Number(/Application Open/i.test(a.stage || "")));

  const jobKey = (n: any) => {
    const title = cleanFeedTitle(n.title)
      .toLowerCase()
      .replace(/\((english|hindi)\s*(version)?\)/gi, "")
      .replace(/\b(english|hindi)\s+version\b/gi, "")
      .replace(/\bbrief advertisement\b/gi, "advertisement")
      .replace(/\b(part\s*[-–—]?\s*[ivx]+)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    const org = String(n.organization || "official").toLowerCase();
    if (/gail/i.test(org) && /advertisement/.test(title)) return org + "|current recruitment";
    return (org + "|" + title).replace(/[^a-z0-9|]+/g, " ");
  };

  const groupedJobs = Array.from(new Map(jobCandidates.map((n: any) => [jobKey(n), n])).values()).slice(0, 6);

  const upcomingExams = exams
    .map((exam) => {
      const data = autoExamData[exam.slug];
      return { exam, data, state: getExamState(exam, data), app: getApplicationState(exam, data) };
    })
    .filter((x) => x.state === "upcoming")
    .sort((a, b) => {
      const at = a.data?.examDate ? Date.parse(a.data.examDate) : Number.MAX_SAFE_INTEGER;
      const bt = b.data?.examDate ? Date.parse(b.data.examDate) : Number.MAX_SAFE_INTEGER;
      return at - bt;
    })
    .slice(0, 6);

  return (
    <main className="adLanding">
      <div className="adTop">
        <span>🇮🇳 SARKARIPREP</span>
        <span>Official-source linked updates</span>
      </div>
      <section className="adHero">
        <div className="adWrap">
          <div className="adBadge">🔔 FREE GOVERNMENT JOB ALERTS</div>
          <h1>Government job ka update <span>miss mat karo.</span></h1>
          <p>New jobs, application deadlines, admit cards, results, answer keys aur important government notices — SarkariPrep par ek jagah.</p>
          <div className="adCtaCard">
            <div>
              <strong>Important updates ke alerts ON rakho</strong>
              <small>Alerts OFF hone par aapko timely push update nahi milega. Final details hamesha official notification se verify karein.</small>
            </div>
            <EngagementAlerts />
          </div>
          <div className="adTrust">
            <span>✓ New jobs</span><span>✓ Last dates</span><span>✓ Admit cards</span><span>✓ Results</span><span>✓ Official notices</span>
          </div>
        </div>
      </section>
      <section className="adSection">
        <div className="adWrap">
          <div className="adSectionHead"><span className="adEyebrow">WHY TURN ALERTS ON?</span><h2>Ek baar setup karo, important updates ke liye ready raho.</h2></div>
          <div className="adBenefits">
            <article><b>01</b><h3>New opportunity</h3><p>Relevant recruitment aur exam updates ko jaldi discover karne mein help.</p></article>
            <article><b>02</b><h3>Deadline awareness</h3><p>Application closing dates aur cycle changes ko track karna easier.</p></article>
            <article><b>03</b><h3>Exam lifecycle</h3><p>Admit card, answer key aur result jaise stages ek flow mein.</p></article>
          </div>
        </div>
      </section>
      <section className="adSection adOpportunities">
        <div className="adWrap">
          <div className="adSectionHead">
            <span className="adEyebrow">🚨 LIVE DISCOVERY</span>
            <h2>Jo kaam ka hai, woh pehle dekho.</h2>
            <p>Open government jobs, upcoming exams aur important notices — official-source feed se priority ke saath. Same recruitment ke duplicate language/notice variants ko yahan group kiya gaya hai.</p>
          </div>
          <div className="adOpportunityGrid">
            <div className="adOpportunityCol">
              <div className="adOpportunityHead"><b>🟢 Open Government Jobs</b><a onClick={()=>trackEvent("jobs_view_all",{location:"alerts_landing"})} href="/notifications">View all →</a></div>
              <div className="adOpportunityList">
                {groupedJobs.map((n: any, i) => (
                  <a onClick={()=>trackEvent("job_click",{organization:String(n.organization||"official")})} href={n.notificationUrl || n.officialUrl || "/notifications"} target="_blank" rel="noopener noreferrer" key={(n.notificationUrl || n.officialUrl || n.title) + i}>
                    <span className="adOppIcon">JOB</span>
                    <div><b>{cleanFeedTitle(n.title)}</b><small>{n.organization || "Official source"} · {n.stage || "Recruitment update"} · Official source linked</small></div>
                    <strong>↗</strong>
                  </a>
                ))}
                {!groupedJobs.length && <div className="adEmpty">No current open recruitment is confirmed in this snapshot.</div>}
              </div>
            </div>
            <div className="adOpportunityCol">
              <div className="adOpportunityHead"><b>🔵 Upcoming Exams</b><a onClick={()=>trackEvent("exams_view_all",{location:"alerts_landing"})} href="/upcoming-government-exams">View all →</a></div>
              <div className="adOpportunityList">
                {upcomingExams.map(({ exam, data, app }) => (
                  <a onClick={()=>trackEvent("exam_click",{exam:exam.slug,organization:exam.organization})} href={"/exams/" + exam.slug} key={exam.slug}>
                    <span className="adOppIcon exam">EXAM</span>
                    <div><b>{exam.name}</b><small>{exam.organization} · {examLabel("upcoming")} · {applicationLabel(app)}{data?.examDate ? " · " + data.examDate : ""}</small></div>
                    <strong>→</strong>
                  </a>
                ))}
                {!upcomingExams.length && <div className="adEmpty">No upcoming exam cycle is currently confirmed in this snapshot.</div>}
              </div>
            </div>
          </div>
          <div className="adOpportunityTrust"><span>✓ Official-source links</span><span>✓ Automatic feed</span><span>✓ Upcoming exam tracking</span><span>✓ Verify final details in notification</span></div>
        </div>
      </section>
      <section className="adSection adLight">
        <div className="adWrap">
          <div className="adSectionHead"><span className="adEyebrow">LATEST FEED</span><h2>Abhi SarkariPrep par kya aa raha hai?</h2><p>Automatic feed official-source links ke saath. Dates/status ko final karne se pehle official notification check karein.</p></div>
          <div className="adUpdates">
            {updates.map((n, i) => (
              <a onClick={()=>trackEvent("notice_click",{organization:String(n.organization||"official")})} href={n.notificationUrl || n.officialUrl || "/notifications"} target="_blank" rel="noopener noreferrer" key={(n.notificationUrl || n.officialUrl || n.title) + i}>
                <span>NEW</span><div><b>{cleanFeedTitle(n.title)}</b><small>{n.organization || "Official source"} · {n.stage || "Update"} · Official source linked</small></div><strong>↗</strong>
              </a>
            ))}
            {!updates.length && <div className="adEmpty">Latest official updates yahan appear karenge.</div>}
          </div>
        </div>
      </section>
      <section className="adFinal" id="top">
        <div className="adWrap">
          <span className="adBadge">📲 INSTALL + 🔔 ALERTS</span>
          <h2>Ready ho? SarkariPrep ko apna government-exam alert centre banao.</h2>
          <p>Install karo, Free Alerts ON karo aur apne important exam/job cycles ko track karo.</p>
          <a href="/" className="adPrimary">Open SarkariPrep →</a>
          <small>{source || campaign ? "Campaign: " + (campaign || source) : "Free for users · No payment required for alerts"}</small>
        </div>
      </section>
    </main>
  );
}
