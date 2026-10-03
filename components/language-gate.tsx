"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const KEY = "sarkariprep-language";

export default function LanguageGate() {
  const pathname = usePathname();
  const router = useRouter();
  const [choice, setChoice] = useState<"en" | "hinglish" | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY) as "en" | "hinglish" | null;
    setChoice(saved);
    setReady(true);
  }, []);

  function select(lang: "en" | "hinglish") {
    window.localStorage.setItem(KEY, lang);
    setChoice(lang);
    if (lang === "hinglish" && !pathname.startsWith("/hinglish")) router.push("/hinglish");
    if (lang === "en" && pathname.startsWith("/hinglish")) router.push("/");
  }

  if (!ready) return null;

  return (
    <>
      {choice === null && (
        <div className="languageGate" role="dialog" aria-modal="true" aria-labelledby="language-title">
          <div className="languageGateCard">
            <div className="languageFlag">🇮🇳</div>
            <span className="eyebrow">SARKARIPREP</span>
            <h2 id="language-title">Aap kis language mein website use karna chahte hain?</h2>
            <p>Ek baar choose karo. SarkariPrep aapki choice yaad rakhega.</p>
            <div className="languageChoices">
              <button onClick={() => select("en")}><strong>English</strong><small>Full English experience</small></button>
              <button onClick={() => select("hinglish")}><strong>Hinglish 🇮🇳</strong><small>Hindi + English, Roman script</small></button>
            </div>
            <small className="languageNote">Language baad mein bhi change kar sakte ho.</small>
          </div>
        </div>
      )}
      {choice && (
        <button className="languageSwitcher" onClick={() => select(choice === "en" ? "hinglish" : "en")} aria-label="Change language">
          {choice === "en" ? "HI • Hinglish" : "EN • English"}
        </button>
      )}
    </>
  );
}
