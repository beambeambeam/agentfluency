import { createFileRoute } from "@tanstack/react-router";

import { InterviewerWorkspace } from "@/features/interview/interviewer";
import {
  getInterviewerDraft,
  getInterviewerSessions,
} from "@/features/interview/sessions";

const Dashboard = () => {
  const { sessions, draft } = Route.useLoaderData();
  return <InterviewerWorkspace sessions={sessions} initialConfig={draft} />;
};

export const Route = createFileRoute("/_auth/dashboard")({
  loader: async () => {
    const [sessions, draft] = await Promise.all([
      getInterviewerSessions(),
      getInterviewerDraft(),
    ]);
    return { sessions, draft };
  },
  component: Dashboard,
});
