export type SourceStatus={id:string;organization:string;sourceUrl:string;ok:boolean;lastChecked:string;error?:string};
export const sourceStatuses:Record<string,SourceStatus>={};
