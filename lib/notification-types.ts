export type NotificationItem={
 id:string; title:string; organization:string; category:string; stage:"Application Open"|"Upcoming"|"Admit Card"|"Answer Key"|"Result"|"Recruitment";
 status:"Verified official"|"Auto-detected official link"; publishedDate:string; lastChecked:string; applicationLastDate?:string; examDate?:string; vacancies?:string; qualification?:string;
 officialUrl:string; notificationUrl?:string; applyUrl?:string; description:string;
};

