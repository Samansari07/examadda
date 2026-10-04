import type {Exam} from "@/lib/exams";

// Current-cycle Railway records must come from the official-source refresh engine.
// This prevents stale CEN numbers/dates from being presented as official.
export const currentExamOverrides:Exam[]=[];
