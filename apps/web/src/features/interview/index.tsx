import { CandidateWorkspace } from "./candidate";
import { InterviewerWorkspace } from "./interviewer";
import type { InterviewData } from "./server";

export { getInterview } from "./server";

export const Interview = ({ data }: { data: InterviewData }) => {
  if (data.role === "interviewer") {
    return <InterviewerWorkspace {...data} />;
  }
  return <CandidateWorkspace {...data} />;
};
