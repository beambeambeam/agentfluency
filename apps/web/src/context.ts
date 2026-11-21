import type { Context as ApiContext } from "@agentfluency/api/context";

import { createServices } from "./services";

export const createContext = async ({
  req,
}: {
  req: Request;
}): Promise<ApiContext> => {
  const { auth, db } = createServices();
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  return {
    db,
    session,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
