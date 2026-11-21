import { createFileRoute } from "@tanstack/react-router";

import { createServices } from "../../../services";

const handle = ({ request }: { request: Request }) =>
  createServices().auth.handler(request);

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
});
