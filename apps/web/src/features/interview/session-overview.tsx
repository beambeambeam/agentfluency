import {
  Calendar03Icon,
  Copy01Icon,
  Link01Icon,
  QrCodeIcon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";

import type { getInterviewerSessions } from "./sessions";

export type InterviewerSession = Awaited<
  ReturnType<typeof getInterviewerSessions>
>[number];

export const displayTime = (value: string) =>
  `${value.slice(0, 16).replace("T", " ")} UTC`;

export const CopyInvite = ({ invite }: { invite: string }) => {
  const [copied, setCopied] = useState(false);
  const [couldNotCopy, setCouldNotCopy] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const path = `/interview/${invite}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(
              new URL(path, window.location.origin).href
            );
            setCopied(true);
          } catch {
            setCouldNotCopy(true);
          }
        }}
      >
        <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />{" "}
        {copied ? "Copied" : "Copy invite"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-expanded={Boolean(qrUrl)}
        onClick={() =>
          setQrUrl(qrUrl ? null : new URL(path, window.location.origin).href)
        }
      >
        <HugeiconsIcon icon={QrCodeIcon} aria-hidden="true" />{" "}
        {qrUrl ? "Hide QR" : "Show QR"}
      </Button>
      {qrUrl && (
        <div className="basis-full">
          <div className="inline-block rounded-lg bg-white p-3">
            <QRCodeSVG
              value={qrUrl}
              title="Scan to open the candidate invitation"
              size={168}
              level="M"
              marginSize={4}
            />
          </div>
        </div>
      )}
      {couldNotCopy && (
        <input
          className="w-full rounded-md border px-2 text-sm"
          aria-label="Candidate invite link"
          readOnly
          value={new URL(path, window.location.origin).href}
          onFocus={(event) => event.target.select()}
        />
      )}
    </div>
  );
};

export const SessionOverview = ({
  sessions,
}: {
  sessions: InterviewerSession[];
}) => (
  <section
    aria-labelledby="sessions-title"
    className="bg-card space-y-4 rounded-xl border p-5"
  >
    <h2 id="sessions-title" className="flex items-center gap-2 font-semibold">
      <HugeiconsIcon icon={Calendar03Icon} aria-hidden="true" size={18} /> Your
      interviews
    </h2>
    {sessions.length === 0 && (
      <p className="text-muted-foreground text-sm">
        Create an interview session to get a candidate invite.
      </p>
    )}
    {sessions.map((session) => (
      <article
        className="bg-background flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
        key={session.id}
      >
        <div className="min-w-0">
          <h3 className="font-semibold break-words">{session.title}</h3>
          <p className="text-muted-foreground text-sm break-words">
            {session.candidateEmail} · {displayTime(session.scheduledAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-muted rounded-md px-2 py-1 text-xs capitalize">
            {session.status}
          </span>
          <CopyInvite invite={session.invite} />
          <Link
            className={buttonVariants({ size: "sm", variant: "outline" })}
            to="/dashboard/report/$sessionId"
            params={{ sessionId: session.id }}
          >
            <HugeiconsIcon icon={Task01Icon} aria-hidden="true" /> Review
          </Link>
        </div>
      </article>
    ))}
  </section>
);

export const NewInvite = ({ invite }: { invite: string }) => (
  <div className="bg-card flex flex-wrap items-center justify-between gap-2 rounded-xl border p-4">
    <p className="flex items-center gap-2 text-sm font-semibold">
      <HugeiconsIcon icon={Link01Icon} aria-hidden="true" size={18} /> Candidate
      invitation created
    </p>
    <CopyInvite invite={invite} />
  </div>
);
