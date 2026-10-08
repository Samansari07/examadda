import {getApplicationState,getExamState} from "../lib/exam-status.ts";
import {inferExamLifecycle} from "../lib/exam-lifecycle.ts";

const now=Date.UTC(2026,9,6,12,0,0);
const failures=[];
const expect=(label,actual,wanted)=>{if(actual!==wanted)failures.push(label+": expected "+wanted+", got "+actual);};

// Core calendar semantics used by every exam record.
expect("single deadline before cutoff",getApplicationState({name:"ESE 2027",slug:"ese-2027",lastDate:"06 October 2026 · 6:00 PM"},undefined,Date.UTC(2026,9,6,12,0,0)),"open");
expect("single deadline after cutoff",getApplicationState({name:"ESE 2027",slug:"ese-2027",lastDate:"06 October 2026 · 6:00 PM"},undefined,Date.UTC(2026,9,6,13,0,0)),"closed");
expect("date-only deadline closes at IST day end",getApplicationState({name:"Test Exam 2026",slug:"test-2026",lastDate:"06 October 2026"},undefined,Date.UTC(2026,9,6,18,30,1)),"closed");
expect("correction dates cannot reopen closed application",getApplicationState({name:"SSC CGL 2026",slug:"ssc-cgl-2026",lastDate:"Application closed · 25 June 2026; correction 01–03 July 2026",applicationStatus:"closed"},undefined,now),"closed");
expect("historical application",getApplicationState({name:"LIC AAO 2025",slug:"lic-aao-2025",lastDate:"Applications closed"},undefined,now),"closed");
expect("future application",getApplicationState({name:"Test Exam 2026",slug:"test-2026",lastDate:"Applications: 10 October 2026 to 20 October 2026"},{applicationDates:"10 October 2026 to 20 October 2026"},now),"upcoming");
expect("open application",getApplicationState({name:"Test Exam 2026",slug:"test-2026",lastDate:"Applications: 01 October 2026 to 20 October 2026"},{applicationDates:"01 October 2026 to 20 October 2026"},now),"open");
expect("closed application",getApplicationState({name:"Test Exam 2026",slug:"test-2026",lastDate:"Applications: 01 September 2026 to 20 September 2026"},undefined,now),"closed");

// Cross-month ranges must not collapse to the first month.
expect("cross-month exam range",getExamState({name:"SSC CHSL 2026",slug:"ssc-chsl-2026",examDate:"30 November 2026 to 31 December 2026"},undefined,now),"upcoming");

expect("future cycle ignores previous-cycle result",inferExamLifecycle({name:"UPSC Engineering Services (Preliminary) Examination 2027",slug:"upsc-ese-2027",examDate:"31 January 2027",lastDate:"06 October 2026",officialUrl:"https://www.upsc.gov.in/examinations/Engineering%20Services%20%28Preliminary%29%20Examination%2C%202027"},[{title:"Engineering Services (Preliminary) Examination, 2026 — Written Result",stage:"Result",lastChecked:"2026-10-08",officialUrl:"https://www.upsc.gov.in/whats-new"}]),"upcoming");
expect("future cycle ignores impossible same-cycle result",inferExamLifecycle({name:"UPSC Engineering Services (Preliminary) Examination 2027",slug:"upsc-ese-2027",examDate:"31 January 2027",lastDate:"06 October 2026",officialUrl:"https://www.upsc.gov.in/examinations/Engineering%20Services%20%28Preliminary%29%20Examination%2C%202027"},[{title:"Engineering Services (Preliminary) Examination, 2027 — Result",stage:"Result",lastChecked:"2026-10-08",officialUrl:"https://www.upsc.gov.in/whats-new"}]),"upcoming");

// Lifecycle hard stop: old cycles can never become upcoming/open.
expect("historical lifecycle",inferExamLifecycle({
 name:"LIC AAO 2025",slug:"lic-aao-2025",examDate:"03 October 2025 to 08 November 2025",
 lastDate:"16 August 2025 to 08 September 2025",officialUrl:"https://licindia.in"
},[]),"cycle-closed");

if(failures.length){
 console.error("validate-exam-lifecycle: FAILED with "+failures.length+" issue(s)");
 for(const x of failures) console.error(" - "+x);
 process.exit(1);
}
console.log("validate-exam-lifecycle: OK — lifecycle/date regression suite passed.");
