export type AutoExamOverride = {
 slug:string; name:string; organization:string; notificationUrl:string; sourceUrl:string; lastVerified:string; detectedAt:string; confidence:"medium"|"high"; evidenceCount:number; evidence:string[]; evidenceSnippets?:string[]; sourceTitle?:string;
 applicationDates?:string; lastDate?:string; examDate?:string; vacancies?:string; minAge?:number; maxAge?:number; fee?:string; correctionDates?:string;
};

export const autoExamDataMeta = {
  "generatedAt": "2026-10-01",
  "sourceCount": 64,
  "overrideCount": 0,
  "policy": "Only conservative values extracted from an official notice/bulletin are applied. Missing or ambiguous fields are never invented."
};

export const autoExamData:Record<string,AutoExamOverride> = {};
