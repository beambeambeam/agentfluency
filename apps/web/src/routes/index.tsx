import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { orpc } from "@/utils/orpc";

const statusText = {
  pending: "Checking API status…",
  success: "API connected",
  error: "API disconnected",
};

const Home = () => {
  const { status } = useQuery(orpc.healthCheck.queryOptions());

  return (
    <output
      className="text-muted-foreground data-[status=error]:before:bg-destructive flex items-center gap-2 px-4 py-2 text-sm before:size-2 before:rounded-full before:bg-current data-[status=success]:before:bg-green-500"
      data-status={status}
    >
      {statusText[status]}
    </output>
  );
};

export const Route = createFileRoute("/")({
  component: Home,
});
