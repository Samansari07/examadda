import {getApplicationState,getExamState} from "../lib/exam-status.ts";
import {inferExamLifecycle} from "../lib/exam-lifecycle.ts";

const now=Date.UTC(2026,9,6,12,0,0);
const failures=[];
const expect=(label,actual,wanted)=>{if(actual!==wanted)failures.push(label+": expected "+wanted+", got "+actual);};

// Core calendar semantics used by every exam record.
expect("historical application",getApplicationState({name:"LIC AAO 2025",slug:"lic-aao-2025",lastDate:"Applications closed"},undefined,now),"closed");
expect("future application",getApplicationState({name:"Test Exam 2026",slug:"test-2026",lastDate:"Applications: 10 October 2026 to 20 October 2026"},undefined,now),"upcoming");
expect("open application",getApplicationState({name:"Test Exam 2026",slug:"test-2026",lastDate:"Applications: 01 October 2026 to 20 October 2026"},undefined,now),"open");
expect("closed application",getApplicationState({name:"Test Exam 2026",slug:"test-2026",lastDate:"Applications: 01 September 2026 to 20 September 2026"},undefined,now),"closed");

// Cross-month ranges must not collapse to the first month.
expect("cross-month exam range",getExamState({name:"SSC CHSL 2026",slug:"ssc-chsl-2026",examDate:"30 November 2026 to 31 December 2026"},undefined,now),"upcoming");

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
