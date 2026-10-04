import type {Exam} from "@/lib/exams";
import {autoExamData} from "@/lib/auto-exam-data";

export type DetailProfile = {
  statusLabel:string;
  statusNote:string;
  fee:string;
  correction:string;
  selection:string[];
  pattern:string[];
  vacancy:string[];
  documents:string[];
  physical:string;
  faqs:Array<[string,string]>;
};

const isPhysical=(e:Exam)=>/defence|police/i.test(e.category);
const selectionFor=(e:Exam)=>{
  if(/banking/i.test(e.category)) return ["Online written stage(s) as prescribed","Shortlisting / score-based stage(s) as prescribed","Interview where the notification specifies it","Final allotment / appointment subject to the authority's rules"];
  if(/medical/i.test(e.category)) return ["Entrance / eligibility examination as prescribed","Score, rank and counselling/admission process where applicable","Document/eligibility verification as prescribed by the authority"];
  if(/teaching/i.test(e.category)) return ["Written / eligibility examination as prescribed","Score / qualification-based eligibility or recruitment stage","Document verification / appointment where applicable"];
  if(isPhysical(e)) return ["Written examination / screening as prescribed","Physical and medical standards/tests where applicable","Document verification and final selection under the notification"];
  return ["Written examination stage(s) as prescribed","Skill / physical / interview stage only where the notification requires it","Document verification and final appointment/allotment under the authority's rules"];
};
const patternFor=(e:Exam)=>{
  if(/banking/i.test(e.category)) return ["Section-wise online test structure can vary by recruitment","Prelims/mains/interview structure depends on the post and cycle","Exact marks, duration and negative marking: latest notification"];
  if(/medical/i.test(e.category)) return ["Paper/mode and duration are cycle-specific","Subject coverage follows the official bulletin/syllabus","Exact marking, tie-break and counselling rules: latest official bulletin"];
  if(isPhysical(e)) return ["Written-paper structure is notification-specific","Physical/medical standards can be post/force-specific","Exact marks, duration and qualifying rules: latest notification"];
  return ["Paper/stage structure is recruitment-specific","Sections, marks, duration and negative marking must be taken from the current notice","Any skill test/interview/qualifying paper is controlled by the current notification"];
};

export function getDetailProfile(e:Exam):DetailProfile{
  const o=autoExamData[e.slug];
  const live=e.dataStatus==="official-verified";
  const family=e.status==="family";
  const lifecycle=e.lifecycleStatus;
  return {
    statusLabel:live?"Officially verified current cycle":family?"Recurring recruitment family":lifecycle==="upcoming"?"Upcoming cycle":lifecycle==="application-open"?"Applications open":lifecycle==="application-closed"?"Applications closed":lifecycle==="exam-completed"?"Exam completed — post-exam cycle":lifecycle==="result-declared"?"Result declared":lifecycle==="counselling-active"?"Counselling / admission active":lifecycle==="cycle-closed"?"Cycle closed":"Historical/reference guide",
    statusNote:live
      ?"Current-cycle facts shown here are tied to an official authority source; the original notification remains controlling."
      :lifecycle==="exam-completed"||lifecycle==="result-declared"||lifecycle==="counselling-active"
      ?"This is a current-year post-exam cycle, not an archived historical reference. Live dates/results/admission notices must be checked against the latest official authority update."
      :lifecycle==="upcoming"||lifecycle==="application-open"||lifecycle==="application-closed"
      ?"This is a current-year cycle. Fields marked calendar/reference are not treated as live verified facts until the official notice supports them."
      :family
      ?"This profile explains the recurring recruitment route. Cycle-specific vacancies, dates, fee and eligibility are intentionally not invented."
      :"This guide is useful for orientation and preparation, but it does not claim current-cycle vacancies or dates unless separately verified.",
    fee:o?.fee||"See latest official notification",
    correction:o?.correctionDates||"See latest official notification",
    selection:selectionFor(e),
    pattern:patternFor(e),
    vacancy:[
      e.vacancies==="Notification-wise"||e.vacancies==="See latest official notification"||e.vacancies==="See official notification"
        ?"Post-wise vacancy breakup is published only in the relevant cycle notification."
        :`Headline vacancy figure: ${e.vacancies}`,
      "Reservation/category/post/department-wise breakup can change through corrigenda or revised notices.",
      "Do not treat a family-level vacancy figure as a current-cycle vacancy."
    ],
    documents:[
      "Recent photograph and signature in the exact format/size requested by the authority",
      "Government/accepted identity proof as specified in the notice",
      "Educational qualification and marks/certificate documents",
      "Category / EWS / PwBD / ESM / other reservation certificates where applicable",
      "Experience, NOC, domicile or other post-specific documents where the notification requires them"
    ],
    physical:isPhysical(e)
      ?"Physical and medical requirements are applicable where the notification specifies them. Exact measurements, events, medical standards and exemptions must be checked in the current notice."
      :"No separate physical/medical requirement is asserted for this profile unless the latest notification specifically prescribes one.",
    faqs:[
      ["Is the information guaranteed to be current?","Only fields explicitly marked as officially verified are treated as current-cycle facts. The authority's latest notice always controls."],
      ["Where can I apply?","Use the Apply Online link on this page when available, and verify that the destination is the authority's official domain before submitting anything."],
      ["Why do some fields say 'See latest official notification'?","SarkariPrep does not invent missing fees, vacancies, dates or eligibility. The field stays open until a reliable official source supports a cycle-specific value."],
      ["Can I use the family page for the next cycle?","Yes for orientation and preparation. Before applying, switch to the latest cycle notification because dates, posts, eligibility, fee and selection rules can change."]
    ]
  };
}
