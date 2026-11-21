import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { getInterview, Interview } from "@/features/interview";

const dashboardRoute = getRouteApi("/_auth/dashboard");

const Dashboard = () => {
  const { session } = dashboardRoute.useRouteContext();
  const data = dashboardRoute.useLoaderData();
  return (
    <>
      <Interview key={session.user.id} data={data} />
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </>
  );
};

export const Route = createFileRoute("/_auth/dashboard")({
  loader: () => getInterview(),
  component: Dashboard,
});
