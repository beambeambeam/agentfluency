import { createFileRoute, getRouteApi } from "@tanstack/react-router";

import { getInterview, Interview } from "@/features/interview";

const dashboardRoute = getRouteApi("/_auth/dashboard");

const Dashboard = () => {
  const { session } = dashboardRoute.useRouteContext();
  const data = dashboardRoute.useLoaderData();
  return <Interview key={session.user.id} data={data} />;
};

export const Route = createFileRoute("/_auth/dashboard")({
  loader: () => getInterview(),
  component: Dashboard,
});
