export type AutoExamOverride = {
 slug:string; name:string; organization:string; notificationUrl:string; sourceUrl:string; lastVerified:string; detectedAt:string; confidence:"medium"|"high"; dataCertainty:"confirmed"|"tentative"|"calendar"; applicationStatus:"open"|"closed"|"upcoming"|"unknown"; evidenceCount:number; evidence:string[]; evidenceSnippets?:string[]; sourceTitle?:string;
 familySlug?:string; cycleSlug?:string; cycleYear?:number;
 applicationDates?:string; lastDate?:string; examDate?:string; vacancies?:string; minAge?:number; maxAge?:number; fee?:string; correctionDates?:string; qualification?:string; selectionProcess?:string; payScale?:string; nationality?:string; domicile?:string; ageRelaxation?:string; stale?:boolean; refreshedThisCycle?:boolean;
};

export const autoExamDataMeta = {
  "generatedAt": "2026-10-04",
  "sourceCount": 76,
  "overrideCount": 1,
  "policy": "Only conservative values extracted from an official notice/bulletin are applied. Missing or ambiguous fields are never invented."
};

export const autoExamData:Record<string,AutoExamOverride> = {
  "ctet-2026": {
    "lastDate": "01 September 2026",
    "applicationDates": "25 August 2026 to 01 September 2026",
    "examDate": "12 and 13 December 2026",
    "correctionDates": "07 September 2026 to 10 September 2026",
    "slug": "ctet-2026",
    "cycleSlug": "ctet-2026",
    "name": "CTET 2026",
    "organization": "CBSE",
    "notificationUrl": "https://ctet.nic.in/document/public-notice-exam-dates-for-22nd-edition-of-ctet/",
    "sourceUrl": "https://ctet.nic.in/",
    "lastVerified": "2026-10-04",
    "detectedAt": "2026-10-04",
    "confidence": "high",
    "dataCertainty": "confirmed",
    "applicationStatus": "closed",
    "evidenceCount": 6,
    "evidence": [
      "lastDate",
      "examDate",
      "correctionDates",
      "revisedExamDate",
      "reopenedApplicationWindow",
      "correctionWindow"
    ],
    "evidenceSnippets": [
      "bility Test (CTET) on 06th September, 2026 (Sunday) (Paper- I and Paper-II). The online application process will start from 11.05.2026. The last date for submitting the online application is 10.06.2026 (11:59 PM). The test will be conducted in twenty seven languages in 132 cities all over the country. IMPORTANT INFORMATION AT A GLANCE FOR CTET – SEPTEMBER, 2026 Start of submission of online application through CTET 1",
      "corrections candidate shall be allowed under any circumstances after this date) Download Admit Card Two Days before the day of examination Date of Examination 06-09-2026 (SUNDAY)*** Declaration of Result By the end of OCTOBER, 2026 (TENTATIVELY) ***In case the number of candidates increases, the examination may also be conducted on 05th September, 2026 (Saturday). Further, it is informed to all applicants that there",
      "edit 10.06.2026 upto"
    ],
    "sourceTitle": "PUBLIC NOTICE: Exam Dates for 22nd edition of CTET",
    "refreshedThisCycle": true
  }
};
