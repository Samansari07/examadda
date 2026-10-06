export type AutoNotification = {
  id:string; title:string; organization:string; category:string;
  stage:"Application Open"|"Upcoming"|"Admit Card"|"Answer Key"|"Result"|"Recruitment"|"Notice";
  status:"Verified official"|"Detected on official source"; publishedDate?:string; lastChecked:string; applicationLastDate?:string; applicationDates?:string; examDate?:string;
  officialUrl:string; notificationUrl?:string; description:string;
};

export const autoNotificationMeta = {
  "generatedAt": "2026-10-06",
  "sourceCount": 78,
  "successfulSources": 46,
  "healthySources": 1,
  "degradedSources": 45,
  "unreachableSources": 32,
  "failedSources": [
    "Assam Public Service Commission",
    "Haryana Employment Portal",
    "Indian Navy",
    "Bihar Public Service Commission",
    "Uttarakhand Public Service Commission",
    "Indian Coast Guard",
    "Chhattisgarh Public Service Commission",
    "Punjab Public Service Commission",
    "West Bengal Public Service Commission",
    "Jammu & Kashmir Employment Portal",
    "Tamil Nadu Employment Portal",
    "Madhya Pradesh Public Service Commission",
    "Rajasthan Public Service Commission",
    "Karnataka Employment Wing",
    "Indian Army",
    "Gujarat Public Service Commission",
    "Sikkim Public Service Commission",
    "West Bengal Employment Bank",
    "Haryana Public Service Commission",
    "Tamil Nadu Public Service Commission",
    "Jharkhand Government Recruitment Portal",
    "Madhya Pradesh Employment Portal",
    "Andhra Pradesh Public Service Commission",
    "Himachal Pradesh Public Service Commission",
    "Telangana Public Service Commission",
    "Maharashtra Employment Portal",
    "Indian Railways / RRB",
    "ESIC",
    "Jammu & Kashmir Public Service Commission",
    "Tripura Public Service Commission",
    "Gujarat Employment Portal",
    "Odisha Employment Portal"
  ],
  "sourcePolicy": "Direct official-source checks with retries, official fallback URLs, PDF extraction and last-verified preservation. Detected links are never treated as authoritative over the original notice.",
  "integrityPolicy": "Only notices whose detected URL belongs to the registered authority are published as official-source updates."
};

export const autoNotifications:AutoNotification[] = [];
