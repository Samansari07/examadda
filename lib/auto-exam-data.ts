export type AutoExamOverride = {
 slug:string; name:string; organization:string; notificationUrl:string; sourceUrl:string; lastVerified:string; detectedAt:string; confidence:"medium"|"high"; evidenceCount:number; evidence:string[]; evidenceSnippets?:string[]; sourceTitle?:string;
 familySlug?:string; cycleSlug?:string; cycleYear?:number;
 applicationDates?:string; lastDate?:string; examDate?:string; vacancies?:string; minAge?:number; maxAge?:number; fee?:string; correctionDates?:string; qualification?:string; selectionProcess?:string; payScale?:string; nationality?:string; domicile?:string; ageRelaxation?:string; dataCertainty?:"confirmed"|"tentative"|"calendar"; applicationStatus?:"open"|"closed"|"upcoming"|"unknown"; stale?:boolean; refreshedThisCycle?:boolean;
};

export const autoExamDataMeta = {
  "generatedAt": "2026-11-27",
  "sourceCount": 78,
  "overrideCount": 1,
  "policy": "Only conservative values extracted from an official notice/bulletin are applied. Missing or ambiguous fields are never invented."
};

export const autoExamData:Record<string,AutoExamOverride> = {
  "sbi-po-2026": {
    "slug": "sbi-po-2026",
    "name": "SBI Probationary Officer",
    "organization": "State Bank of India",
    "notificationUrl": "https://sbi.co.in/webfiles/uploads/files_2627/11/Biodata_Form_for_PO.pdf",
    "sourceUrl": "https://sbi.co.in/web/careers",
    "lastVerified": "2026-11-27",
    "detectedAt": "2026-11-27",
    "confidence": "high",
    "evidenceCount": 2,
    "evidence": [
      "qualification",
      "nationality"
    ],
    "evidenceSnippets": [
      "educational qualifications the aggregate marks of all subjects whether optional pass course or honors course should be shown in total marks marks obtained column please enclose copies of relevant certificates mark sheets marks educational qualification month year total marks percentage obtained of passing 10 10th std certificate proof of age 12 12th std cert",
      "nationality religion a b 4 a father s husband s name and occupation profession designation b mother s name and occupation 5 a nationality father mother husband wife b place of birth of husband wife district state 6 a category tick the approp"
    ],
    "sourceTitle": "METRIC TEST IN REMOTE PROCTORED (RPA) MODE (NEW) --> NOTICE: THE INTERVIEWS FOR THE RECRUITMENT OF PROBATIONARY OFFICERS WILL COMMENCE FROM 01",
    "cycleYear": 2026,
    "cycleSlug": "sbi-po-2026",
    "qualification": "rse should be shown in total marks marks obtained column please enclose copies of relevant certificates mark sheets marks educational qualification month year total marks percentage obtained of passing 10 10th std certificate proof of age 12 12th std certifica",
    "nationality": "pation profession designation b mother s name and occupation 5 a nationality father mother husband wife b place of birth of husband wife district state 6 a category tick the approp",
    "dataCertainty": "confirmed",
    "applicationStatus": "unknown",
    "refreshedThisCycle": true
  }
};
