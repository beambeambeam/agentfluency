import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { CandidateWorkspace, startWarmup } from "@/features/interview";
import type { InvitationData } from "@/features/interview";

const Joining = ({ inviteId }: { inviteId: string }) => {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const join = async () => {
      try {
        await startWarmup({ data: { inviteId } });
        if (active) {
          await router.invalidate();
        }
      } catch {
        if (active) {
          setFailed(true);
        }
      }
    };
    void join();
    return () => {
      active = false;
    };
  }, [inviteId, router]);
  return failed ? (
    <div>
      <p>Could not start your warmup.</p>
      <Button onClick={() => window.location.reload()}>Try again</Button>
    </div>
  ) : (
    <output>Opening your warmup…</output>
  );
};

const Warmup = ({ remaining }: { remaining: number }) => {
  const router = useRouter();
  const [seconds, setSeconds] = useState(Math.ceil(remaining / 1000));
  const [answer, setAnswer] = useState("");
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const deadline = Date.now() + remaining;
    const tick = () =>
      setSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    const timer = window.setInterval(tick, 250);
    tick();
    return () => window.clearInterval(timer);
  }, [remaining]);
  const open = async () => {
    setOpening(true);
    setError(false);
    try {
      await router.invalidate();
    } catch {
      setError(true);
    }
    setOpening(false);
  };
  return (
    <div className="space-y-6">
      <p>
        Your assessment opens after a three-minute warmup. Use this unscored
        exercise to practice checking an assistant’s claim.
      </p>
      <section
        className="bg-card space-y-4 rounded-xl border p-5"
        aria-labelledby="practice-title"
      >
        <h2 id="practice-title" className="font-semibold">
          Practice with a source
        </h2>
        <dl className="space-y-1 text-sm">
          <dt className="font-medium">Dispatch record</dt>
          <dd>Parcel collected at 14:10. Delivery date unknown.</dd>
          <dt className="mt-3 font-medium">Assistant’s draft</dt>
          <dd>“The customer received the parcel at 14:10.”</dd>
        </dl>
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">
            What does the record confirm?
          </legend>
          {[
            "The carrier collected the parcel.",
            "The customer received the parcel.",
          ].map((choice) => (
            <label className="flex items-center gap-2 text-sm" key={choice}>
              <input
                type="radio"
                name="practice"
                value={choice}
                checked={answer === choice}
                onChange={() => setAnswer(choice)}
              />
              {choice}
            </label>
          ))}
        </fieldset>
        {answer && (
          <output className="text-sm">
            {answer.startsWith("The carrier")
              ? "Correct. Collection is recorded. Delivery is still unverified."
              : "Look at the recorded event. Collection tells you who has the parcel, but does not confirm delivery."}
          </output>
        )}
      </section>
      <div className="flex flex-wrap items-center gap-4">
        <Button disabled={seconds > 0 || opening} onClick={open}>
          {opening ? "Opening…" : "Begin assessment"}
        </Button>
        {seconds > 0 ? (
          <span
            role="timer"
            className="text-muted-foreground text-sm tabular-nums"
          >
            Opens in {Math.floor(seconds / 60)}:
            {String(seconds % 60).padStart(2, "0")}
          </span>
        ) : (
          <output>Your assessment is ready.</output>
        )}
      </div>
      {error && (
        <p role="alert">Could not open the assessment. Please try again.</p>
      )}
    </div>
  );
};

export const Invitation = ({
  inviteId,
  data,
}: {
  inviteId: string;
  data: InvitationData;
}) => {
  if (data.stage === "assessment") {
    return <CandidateWorkspace {...data} inviteId={inviteId} />;
  }
  if (data.stage === "unavailable" || data.stage === "candidate-only") {
    return (
      <main className="mx-auto max-w-lg space-y-4 p-6">
        <h1 className="text-2xl font-semibold">
          {data.stage === "unavailable"
            ? "Invitation unavailable"
            : "Candidate account required"}
        </h1>
        <p>
          {data.stage === "unavailable"
            ? "Ask your interviewer for a new invitation link."
            : "Open this link while signed in with a candidate account."}
        </p>
        <Link to="/dashboard" className="underline">
          Return to dashboard
        </Link>
      </main>
    );
  }
  return (
    <main className="mx-auto w-full max-w-xl space-y-4 p-6">
      <p className="text-muted-foreground text-sm">{data.title}</p>
      <h1 className="text-3xl font-semibold">Assessment warmup</h1>
      {data.stage === "join" ? (
        <Joining inviteId={inviteId} />
      ) : (
        <Warmup remaining={data.remaining} />
      )}
    </main>
  );
};
