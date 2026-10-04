export function educationMatches(profile:string, qualification:string){
 const p=profile.toLowerCase().replace(/[.\-_/]+/g," ");
 const q=qualification.toLowerCase();
 if(/b tech|btech|b e|be\b|engineering|bachelor|graduate/.test(p) && /engineering|graduate|bachelor|degree/.test(q)) return true;
 if(/diploma|polytechnic/.test(p) && /diploma|engineering|degree/.test(q)) return true;
 if(/10 2|12th|12 pass|intermediate|higher secondary/.test(p) && /10th|12th|10\+2|higher secondary|graduate|degree/.test(q)) return true;
 if(/10th|matric|ssc pass/.test(p) && /10th|12th|graduate|degree|iti/.test(q)) return true;
 if(/iti|industrial training/.test(p) && /iti|10th|diploma|engineering/.test(q)) return true;
 if(/mbbs/.test(p) && /mbbs|medical/.test(q)) return true;
 if(/bds/.test(p) && /bds|dental/.test(q)) return true;
 if(/b ed|bed|d el ed|deled|teacher training/.test(p) && /b ed|d el|teaching|education|graduate/.test(q)) return true;
 if(/master|post graduate|postgraduate|m tech|mtech|m a |ma |m sc|msc|m com|mcom/.test(p) && /master|postgraduate|post graduate|graduate|degree/.test(q)) return true;
 const words=p.split(/\s+/).filter(w=>w.length>2);
 return words.some(w=>q.includes(w));
}
