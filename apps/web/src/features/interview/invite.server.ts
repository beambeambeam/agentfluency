import { Buffer } from "node:buffer";

import { getServerEnv } from "@/env.server";

import { sessionIdSchema } from "./session-config";

const inviteKey = () =>
  crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getServerEnv().BETTER_AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );

const inviteMessage = (id: string) =>
  new TextEncoder().encode(`agentfluency:interview:v1:${id}`);

export const createInvite = async (id: string) => {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await inviteKey(),
    inviteMessage(id)
  );
  return `${id}.${Buffer.from(signature).toString("hex")}`;
};

export const verifyInvite = async (token: string) => {
  const [id, signature] = token.split(".");
  if (!sessionIdSchema.safeParse(id).success || !signature) {
    return null;
  }
  const valid = await crypto.subtle.verify(
    "HMAC",
    await inviteKey(),
    Buffer.from(signature, "hex"),
    inviteMessage(id)
  );
  return valid ? id : null;
};
