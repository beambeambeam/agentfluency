import { createFileRoute, notFound } from "@tanstack/react-router";

import { sessionIdSchema } from "@/features/interview/session-config";
import { SessionReport } from "@/features/interview/session-report";
import { getSessionReport } from "@/features/interview/sessions";

const ReportPage = () => <SessionReport report={Route.useLoaderData()} />;

export const Route = createFileRoute("/_auth/dashboard_/report/$sessionId")({
  loader: async ({ params }) => {
    if (!sessionIdSchema.safeParse(params.sessionId).success) {
      throw notFound();
    }
    const report = await getSessionReport({ data: params.sessionId });
    if (!report) {
      throw notFound();
    }
    return report;
  },
  component: ReportPage,
});
