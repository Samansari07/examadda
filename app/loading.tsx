"use client";

import { useEffect, useState } from "react";

export default function Loading() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setDone(true), 520);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="launchScreen" aria-label="SarkariPrep loading">
      <div className="launchGlow launchGlowOne" />
      <div className="launchGlow launchGlowTwo" />
      <section className="launchCard">
        <div className="launchMark"><span>S</span><i>✦</i></div>
        <div className="launchBrand">Sarkari<span>Prep</span></div>
        <p>Government exams. Jobs. Your next move.</p>
        <div className="launchProgress"><span className={done ? "done" : ""} /></div>
        <small>{done ? "Opening your exam command centre…" : "Preparing your workspace…"}</small>
      </section>
    </main>
  );
}
