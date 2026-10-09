export type AutoExamOverride = {
 slug:string; name:string; organization:string; notificationUrl:string; sourceUrl:string; lastVerified:string; detectedAt:string; confidence:"medium"|"high"; evidenceCount:number; evidence:string[]; evidenceSnippets?:string[]; sourceTitle?:string;
 familySlug?:string; cycleSlug?:string; cycleYear?:number;
 applicationDates?:string; lastDate?:string; examDate?:string; vacancies?:string; minAge?:number; maxAge?:number; fee?:string; correctionDates?:string; qualification?:string; selectionProcess?:string; payScale?:string; nationality?:string; domicile?:string; ageRelaxation?:string; dataCertainty?:"confirmed"|"tentative"|"calendar"; applicationStatus?:"open"|"closed"|"upcoming"|"unknown"; stale?:boolean; refreshedThisCycle?:boolean;
};

export const autoExamDataMeta = {
  "generatedAt": "2026-10-10",
  "sourceCount": 78,
  "overrideCount": 0,
  "policy": "Only conservative values extracted from an official notice/bulletin are applied. Missing or ambiguous fields are never invented."
};

export const autoExamData:Record<string,AutoExamOverride> = {};
