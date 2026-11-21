import {
  createFileRoute,
  getRouteApi,
  notFound,
  redirect,
} from "@tanstack/react-router";
import { z } from "zod";

import { getInvitation } from "@/features/interview";
import { Invitation } from "@/features/invitation";
import { getUser } from "@/functions/get-user";

const invitationRoute = getRouteApi("/invite/$inviteId");

const InvitationPage = () => {
  const data = invitationRoute.useLoaderData();
  const { inviteId } = invitationRoute.useParams();
  const { candidateId } = invitationRoute.useRouteContext();
  return (
    <Invitation
      key={`${candidateId}/${inviteId}`}
      data={data}
      inviteId={inviteId}
    />
  );
};

export const Route = createFileRoute("/invite/$inviteId")({
  beforeLoad: async ({ params }) => {
    if (!z.uuid().safeParse(params.inviteId).success) {
      throw notFound();
    }
    const session = await getUser();
    if (!session) {
      throw redirect({ to: "/login", search: { invite: params.inviteId } });
    }
    return { candidateId: session.user.id };
  },
  loader: ({ params }) =>
    getInvitation({ data: { inviteId: params.inviteId } }),
  component: InvitationPage,
});
