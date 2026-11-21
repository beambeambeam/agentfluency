import { Link } from "@tanstack/react-router";

import { InterviewerWorkspace } from "./interviewer";
import type { InterviewData } from "./server";

export { CandidateWorkspace } from "./candidate";
export { getInterview, getInvitation, startWarmup } from "./server";
export type { InvitationData } from "./server";

export const Interview = ({ data }: { data: InterviewData }) => {
  if (data.role === "interviewer") {
    return <InterviewerWorkspace {...data} />;
  }
  return (
    <main className="mx-auto w-full max-w-2xl space-y-5 p-6">
      <h1 className="text-3xl font-semibold">Your assessments</h1>
      {data.invites.length ? (
        <ul className="space-y-2">
          {data.invites.map((invite) => (
            <li key={invite.id}>
              <Link
                className="underline"
                to="/invite/$inviteId"
                params={{ inviteId: invite.id }}
              >
                {invite.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          Open the invitation link or scan the QR code from your interviewer to
          start your warmup.
        </p>
      )}
      {data.legacySubmission && (
        <section className="rounded-lg border p-4">
          <h2 className="font-medium">Previous demo submission</h2>
          <p className="whitespace-pre-wrap">{data.legacySubmission}</p>
        </section>
      )}
    </main>
  );
};
