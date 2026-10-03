export const hinglish = {
  home: {
    eyebrow: "🇮🇳 INDIA KA GOVERNMENT EXAM & JOBS PLATFORM",
    title: "Sahi exam dhoondo.\nSahi career banao.",
    intro: "UPSC, SSC, Banking, Railway, Defence, Teaching, Medical, Engineering aur State PSC — sab kuch ek clean, student-first experience mein.",
    search: "UPSC, SSC CGL, Railway, Police, Banking search karo…",
    explore: "Explore karo",
    official: "Official source links",
    pathways: "10th → PG career pathways",
    verified: "Officially verified cycle data",
    safe: "Fake live vacancy claims nahi",
    discover: "01 · Discover",
    discoverText: "Qualification, category, organisation aur career route dekho.",
    understand: "02 · Samjho",
    understandText: "Eligibility, syllabus, pattern, selection aur documents samjho.",
    verify: "03 · Verify",
    verifyText: "Final dates, vacancies aur application official portal par verify karo.",
    start: "Start exploring →",
    happening: "Abhi kya important hai?",
    officialHeadlines: "Official-source headlines, upcoming exams aur recruitment updates — bina fake urgency ke.",
    upcoming: "UPCOMING EXAMS",
    jobs: "GOVERNMENT JOBS & NOTICES",
    officialSource: "Official source linked",
    autoFeed: "Automatic feed",
    verifyFinal: "Final details official notification mein verify karo",
    career: "Apne career route se start karo.",
    directory: "EXAM DIRECTORY",
    everything: "Jo exam discover karna hai, yahin milega.",
    matching: "matching exam guides",
    qualification: "Qualification",
    age: "Age",
    status: "Status",
    vacancies: "Vacancies",
    openGuide: "Complete guide kholo →",
    officialPortal: "Official ↗",
    jobsTitle: "Qualification → opportunities.",
    jobsText: "Apni qualification ke hisaab se government job routes explore karo.",
    guides: "POPULAR SEARCH GUIDES",
    guidesTitle: "Jo dhoondh rahe ho, wahi se start karo.",
    notifications: "LATEST OFFICIAL UPDATES",
    prep: "PREPARATION HUB",
    source: "SOURCE OF TRUTH",
    officialPortals: "Official portals",
    saved: "Saved exams",
    saveHint: "Exam cards par ☆ tap karke apni shortlist banao.",
    contact: "HELP & SUPPORT",
    footer: "Independent student-information platform. SarkariPrep government website nahi hai; final details latest official notification se verify karo."
  },
  nav: {
    home: "Home", explore: "Explore", exams: "Exams", jobs: "Jobs", prep: "Preparation",
    notifications: "Notifications", official: "Official", saved: "Saved"
  }
} as const;

export function romanize(text: string) {
  const map: Record<string, string> = {
    "Government Jobs": "Sarkari Jobs", "Government Exams": "Sarkari Exams",
    "Eligibility": "Eligibility", "Syllabus": "Syllabus", "Exam Date": "Exam Date",
    "Latest notification": "Latest notification", "Official website": "Official website",
    "Back to SarkariPrep": "SarkariPrep par wapas jao", "Back to SarkariPrep exams": "SarkariPrep exams par wapas jao",
    "All Government Exams": "Saare Sarkari Exams", "Search exam, organisation or qualification…": "Exam, organisation ya qualification search karo…",
    "Open complete guide": "Complete guide kholo", "Explore jobs →": "Jobs explore karo →",
    "Browse all exams →": "Saare exams dekho →", "Open notifications →": "Notifications kholo →"
  };
  return map[text] || text;
}
