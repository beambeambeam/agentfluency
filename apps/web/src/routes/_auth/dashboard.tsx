import { useQuery } from "@tanstack/react-query";
import { createFileRoute, getRouteApi } from "@tanstack/react-router";

import { orpc } from "@/utils/orpc";

const dashboardRoute = getRouteApi("/_auth/dashboard");

const Dashboard = () => {
  const { session } = dashboardRoute.useRouteContext();

  const privateData = useQuery(orpc.privateData.queryOptions());

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {session?.user.name}</p>
      <p>API: {privateData.data?.message}</p>
    </div>
  );
};

export const Route = createFileRoute("/_auth/dashboard")({
  component: Dashboard,
});
