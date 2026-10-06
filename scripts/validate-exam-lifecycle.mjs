import {exams} from "../lib/exams.ts";
import {getApplicationState,getExamState} from "../lib/exam-status.ts";
import {inferExamLifecycle} from "../lib/exam-lifecycle.ts";

const now=Date.now();
const currentYear=new Date(now).getUTCFullYear();
const yearOf=(e)=>{
  if(typeof e.cycleYear==="number") return e.cycleYear;
  const m=(e.name+" "+e.slug).match(/\b20\d{2}\b/);
  return m?Number(m[0]):currentYear;
};
const failures=[];
for(const e of exams){
  const app=getApplicationState(e,undefined,now);
  const exam=getExamState(e,undefined,now);
  const life=inferExamLifecycle(e,[]);
  const year=yearOf(e);

  if(year<currentYear && (app==="open"||app==="upcoming"))
    failures.push(`${e.slug}: historical cycle incorrectly has application state ${app}`);
  if(life==="application-open" && app!=="open")
    failures.push(`${e.slug}: lifecycle=${life} but application state=${app}`);
  if(e.applicationStatus==="open" && app!=="open" && year>=currentYear)
    failures.push(`${e.slug}: explicit applicationStatus=open but computed state=${app}`);
  if(exam==="ongoing" && year<currentYear)
    failures.push(`${e.slug}: historical cycle incorrectly marked exam ongoing`);
}
if(failures.length){
  console.error("validate-exam-lifecycle: FAILED with "+failures.length+" issue(s)");
  for(const x of failures.slice(0,100)) console.error(" - "+x);
  process.exit(1);
}
console.log("validate-exam-lifecycle: OK — "+exams.length+" exam records checked.");
