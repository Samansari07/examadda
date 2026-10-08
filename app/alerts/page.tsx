"use client";

import { useEffect, useState } from "react";
import EngagementAlerts from "@/components/engagement-alerts";
import { autoNotifications } from "@/lib/auto-notifications";
import { cleanFeedTitle, isFeedUseful } from "@/lib/notification-feed";

export default function AlertsLanding() {
  const [source, setSource] = useState("");
  const [campaign, setCampaign] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setSource(p.get("utm_source") || "");
    setCampaign(p.get("utm_campaign") || "");
  }, []);

  const updates = autoNotifications.filter((n) => isFeedUseful(n)).slice(0, 5);

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
      <section className="adSection adLight">
        <div className="adWrap">
          <div className="adSectionHead"><span className="adEyebrow">LATEST FEED</span><h2>Abhi SarkariPrep par kya aa raha hai?</h2><p>Automatic feed official-source links ke saath. Dates/status ko final karne se pehle official notification check karein.</p></div>
          <div className="adUpdates">
            {updates.map((n, i) => (
              <a href={n.notificationUrl || n.officialUrl || "/notifications"} target="_blank" rel="noopener noreferrer" key={(n.notificationUrl || n.officialUrl || n.title) + i}>
                <span>NEW</span><div><b>{cleanFeedTitle(n.title)}</b><small>{n.organization || "Official source"} · {n.stage || "Update"}</small></div><strong>↗</strong>
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
