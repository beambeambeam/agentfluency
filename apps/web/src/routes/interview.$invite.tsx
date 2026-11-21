import {
  createFileRoute,
  notFound,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { CandidateWorkspace } from "@/features/interview/candidate";
import {
  inviteSchema,
  metricLabels,
} from "@/features/interview/session-config";
import {
  beginInterviewSession,
  getCandidateInvite,
} from "@/features/interview/sessions";
import { getUser } from "@/functions/get-user";

const CandidateInterview = () => {
  const session = Route.useLoaderData();
  const { invite } = Route.useParams();
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [unlocked, setUnlocked] = useState(session.status === "ready");

  useEffect(() => {
    if (session.status !== "scheduled") {
      return;
    }
    const timer = window.setTimeout(
      () => setUnlocked(true),
      Math.min(
        2_147_000_000,
        Math.max(0, Date.parse(session.scheduledAt) - Date.now())
      )
    );
    return () => window.clearTimeout(timer);
  }, [session.status, session.scheduledAt]);

  if (session.status === "active" && session.assessment && session.workspace) {
    return (
      <CandidateWorkspace
        key={session.id}
        config={session.assessment}
        initialWorkspace={session.workspace}
        sessionId={session.id}
        endsAt={session.endsAt}
        metrics={session.metrics}
        onComplete={() => {
          void router.invalidate();
        }}
      />
    );
  }

  const finished =
    session.status === "submitted" || session.status === "expired";
  const readyLabel = unlocked
    ? "Start interview"
    : "Opens at the scheduled time";
  return (
    <main className="grid min-h-0 place-items-center overflow-auto p-5">
      <section className="bg-card w-full max-w-lg space-y-4 rounded-2xl border p-6 sm:p-8">
        <BrandLogo />
        <p className="text-muted-foreground text-sm">Interview workspace</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {session.title}
        </h1>
        <p className="text-sm" suppressHydrationWarning>
          {new Date(session.scheduledAt).toLocaleString()} –{" "}
          {new Date(session.endsAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            timeZoneName: "short",
          })}
        </p>
        {finished ? (
          <p className="text-sm">
            {session.status === "submitted"
              ? "Your work was submitted."
              : "The scheduled interview window has ended."}
          </p>
        ) : (
          <>
            <p className="text-muted-foreground text-sm">
              This is a timed session. The workspace closes at the scheduled
              end. Your final submission and session timing are included in the
              review.
            </p>
            {session.metrics.length > 0 && (
              <div className="space-y-1 text-sm">
                <p className="font-medium">Also recorded</p>
                <ul className="text-muted-foreground ml-5 list-disc">
                  {session.metrics.map((metric) => (
                    <li key={metric}>{metricLabels[metric]}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              type="button"
              disabled={starting || !unlocked}
              onClick={async () => {
                setError("");
                setStarting(true);
                void document.documentElement
                  .requestFullscreen?.()
                  .catch(() => null);
                try {
                  await beginInterviewSession({ data: invite });
                  await router.invalidate();
                } catch (error_) {
                  setError(
                    error_ instanceof Error
                      ? error_.message
                      : "Could not open the workspace. Try again."
                  );
                }
                setStarting(false);
              }}
            >
              {starting ? "Preparing workspace…" : readyLabel}
            </Button>
            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
};

export const Route = createFileRoute("/interview/$invite")({
  beforeLoad: async ({ params }) => {
    if (!inviteSchema.safeParse(params.invite).success) {
      throw notFound();
    }
    if (!(await getUser())) {
      throw redirect({ to: "/login", search: { invite: params.invite } });
    }
  },
  loader: async ({ params }) => {
    const session = await getCandidateInvite({ data: params.invite });
    if (!session) {
      throw notFound();
    }
    return session;
  },
  head: () => ({
    meta: [
      { name: "referrer", content: "no-referrer" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CandidateInterview,
});
