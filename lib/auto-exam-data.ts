export type AutoExamOverride = {
 slug:string; name:string; organization:string; notificationUrl:string; sourceUrl:string; lastVerified:string; detectedAt:string; confidence:"medium"|"high"; evidenceCount:number; evidence:string[];
 applicationDates?:string; lastDate?:string; examDate?:string; vacancies?:string; minAge?:number; maxAge?:number; fee?:string; correctionDates?:string;
};
export const autoExamDataMeta={generatedAt:"not yet refreshed",sourceCount:0,overrideCount:0,policy:"Only conservative values extracted from an official notice/bulletin are applied. Missing or ambiguous fields are never invented."};
export const autoExamData:Record<string,AutoExamOverride>={};
