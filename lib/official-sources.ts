export type OfficialSource={
 id:string; organization:string; category:string; updatesUrl:string; applicationUrl?:string; scope:string;
};

export const officialSources:OfficialSource[]=[
 {id:"upsc",organization:"UPSC",category:"Central Government",updatesUrl:"https://www.upsc.gov.in/whats-new",applicationUrl:"https://upsconline.nic.in",scope:"Exam notifications, recruitment advertisements, admit cards, results, corrigenda and notices."},
 {id:"ssc",organization:"Staff Selection Commission",category:"Central Government",updatesUrl:"https://ssc.gov.in/",scope:"Recruitment notices, calendars, admit cards, answer keys and results."},
 {id:"ibps",organization:"IBPS",category:"Banking",updatesUrl:"https://www.ibps.in/index.php/crp-updates/",scope:"CRP recruitment notifications, corrigenda, calendars, results and vacancy updates."},
 {id:"nta",organization:"National Testing Agency",category:"Entrance / Eligibility",updatesUrl:"https://www.nta.ac.in/NoticeBoardArchive",scope:"NEET, JEE Main, UGC-NET, CUET, CSIR-NET and other NTA public notices."},
 {id:"ctet",organization:"CTET",category:"Teaching",updatesUrl:"https://ctet.nic.in/",scope:"CTET information bulletins, application notices, admit cards, answer keys and results."},
 {id:"railways",organization:"Indian Railways / RRB",category:"Railway",updatesUrl:"https://indianrailways.gov.in/",scope:"Railway recruitment information; exact CEN notice should be verified on the relevant regional RRB website."},
 {id:"jpsc",organization:"Jharkhand Public Service Commission",category:"State Government",updatesUrl:"https://jpsc.gov.in/",scope:"Jharkhand state examinations, recruitment advertisements, notices and results."},
 {id:"jssc",organization:"Jharkhand Staff Selection Commission",category:"State Government",updatesUrl:"https://jssc.jharkhand.gov.in/",scope:"Jharkhand recruitment notifications, exam notices, admit cards and results."},
 {id:"rbi",organization:"Reserve Bank of India",category:"Banking",updatesUrl:"https://opportunities.rbi.org.in/",scope:"RBI recruitment opportunities and official recruitment notices."},
 {id:"sbi",organization:"State Bank of India",category:"Banking",updatesUrl:"https://sbi.co.in/web/careers",scope:"SBI recruitment advertisements, application windows, admit cards and results."}
];
