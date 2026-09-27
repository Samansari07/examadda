import sourceRegistryJson from "@/config/official-sources.json";

export type OfficialSource={
 id:string;
 organization:string;
 category:string;
 region:string;
 updatesUrl:string;
 applicationUrl?:string;
 scope:string;
};

export const officialSources:OfficialSource[]=sourceRegistryJson as OfficialSource[];