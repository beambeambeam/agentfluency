import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { DitherArtwork } from "@/components/dither-artwork";
import { buttonVariants } from "@/components/ui/button";
import { inviteSchema } from "@/features/interview/session-config";
import SignInForm from "@/features/sign-in";
import SignUpForm from "@/features/sign-up";
import { cn } from "@/lib/utils";

const Login = () => {
  const { invite } = Route.useSearch();
  const [showSignIn, setShowSignIn] = useState(true);

  return (
    <main className="overflow-y-auto">
      <div className="mx-auto grid min-h-full max-w-6xl items-center px-4 py-6 sm:px-8 sm:py-12">
        <div className="bg-card grid overflow-hidden rounded-3xl border shadow-sm md:grid-cols-2">
          <div className="dither-plate dither-plate-auth relative hidden min-h-[36rem] flex-col justify-end overflow-hidden p-9 text-white md:flex lg:p-12">
            <div className="absolute inset-x-0 top-0 h-[78%]">
              <DitherArtwork />
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[var(--dither-paper)] via-[var(--dither-paper)] to-transparent"
            />
            <div className="relative">
              <p className="max-w-sm text-4xl leading-[1.05] font-semibold tracking-[-0.05em] lg:text-5xl">
                Real work.
                <br />
                Real AI fluency.
              </p>
            </div>
          </div>
          <div className="flex min-h-[30rem] flex-col px-5 py-6 sm:px-10 md:min-h-[36rem] lg:px-14">
            <Link
              to="/"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "-ml-2.5 self-start"
              )}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
              Back to home
            </Link>
            <div className="mx-auto flex w-full max-w-sm flex-1 items-center py-8">
              {showSignIn ? (
                <SignInForm
                  invite={invite}
                  onSwitchToSignUp={() => setShowSignIn(false)}
                />
              ) : (
                <SignUpForm
                  invite={invite}
                  onSwitchToSignIn={() => setShowSignIn(true)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { invite?: string } => ({
    invite: inviteSchema.safeParse(search.invite).data,
  }),
  head: () => ({ meta: [{ name: "referrer", content: "no-referrer" }] }),
  component: Login,
});
