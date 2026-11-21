import { createMiddleware } from "@tanstack/react-start";

import { createServices } from "../services";

export const authMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const { auth } = createServices();
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    return next({
      context: { session },
    });
  }
);
