import { createFileRoute, getRouteApi } from "@tanstack/react-router";

import { AssistantChat } from "@/features/assistant-chat";

const dashboardRoute = getRouteApi("/_auth/dashboard");

const Dashboard = () => {
  const { session } = dashboardRoute.useRouteContext();


  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome, {session.user.name}.</p>
      </div>
      <AssistantChat key={session.user.id} />
    </main>
  );
};

export const Route = createFileRoute("/_auth/dashboard")({
  component: Dashboard,
});
