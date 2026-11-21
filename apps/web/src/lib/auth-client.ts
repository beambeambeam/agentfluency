import type { createAuth } from "@agentfluency/auth";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<ReturnType<typeof createAuth>>()],
});
