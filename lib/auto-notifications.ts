export type AutoNotification = {
  id:string;
  title:string;
  organization:string;
  category:string;
  stage:"Application Open"|"Upcoming"|"Admit Card"|"Answer Key"|"Result"|"Recruitment";
  status:"Verified official";
  publishedDate:string;
  lastChecked:string;
  officialUrl:string;
  notificationUrl?:string;
  description:string;
};

export const autoNotificationMeta = {
  generatedAt: "2026-09-27",
  sourcePolicy: "Automatically checked official authority pages; original authority links remain the controlling source."
};

export const autoNotifications:AutoNotification[]=[];
