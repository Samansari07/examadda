"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const KEY = "sarkariprep-language";
type Language = "en" | "hinglish";

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "hinglish";
}

function localizedPath(pathname: string, lang: Language) {
  const clean = pathname || "/";
  if (lang === "hinglish") {
    return clean.startsWith("/hinglish") ? clean : clean === "/" ? "/hinglish" : "/hinglish" + clean;
  }
  if (!clean.startsWith("/hinglish")) return clean;
  const english = clean.slice("/hinglish".length);
  return english || "/";
}

export default function LanguageGate() {
  const pathname = usePathname();
  const router = useRouter();
  const [choice, setChoice] = useState<Language | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(KEY);
    const language = isLanguage(saved) ? saved : null;
    setChoice(language);
    document.documentElement.lang = language === "hinglish" ? "hi-Latn-IN" : "en-IN";
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      document.documentElement.lang = choice === "hinglish" ? "hi-Latn-IN" : "en-IN";
    }
  }, [choice, ready]);

  function select(lang: Language) {
    window.localStorage.setItem(KEY, lang);
    setChoice(lang);
    const nextPath = localizedPath(pathname || "/", lang);
    if (nextPath !== pathname) router.push(nextPath);
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
