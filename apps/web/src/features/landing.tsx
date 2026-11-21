import {
  ArrowRight01Icon,
  FolderLibraryIcon,
  Task01Icon,
  Chat01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";

import { DitherArtwork } from "@/components/dither-artwork";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const workflow = [
  {
    icon: FolderLibraryIcon,
    title: "Build the workspace",
    description:
      "Set the task, provide the files, and choose the AI tools available to candidates.",
  },
  {
    icon: Chat01Icon,
    title: "Work with AI",
    description:
      "Candidates explore the files, work with an assistant, and submit their reasoning.",
  },
  {
    icon: Task01Icon,
    title: "Review the work",
    description:
      "Read the candidate’s recommendation alongside the task and materials you provided.",
  },
];

export const Landing = () => (
  <main className="overflow-y-auto">
    <div className="mx-auto max-w-7xl px-5 pb-8 sm:px-8 lg:px-12">
      <section className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:py-20">
        <div>
          <h1 className="max-w-xl text-[clamp(3.4rem,6.8vw,6.25rem)] leading-[0.96] font-semibold tracking-[-0.065em]">
            See how people
            <span className="text-muted-foreground block">work with AI.</span>
          </h1>
          <p className="text-muted-foreground mt-6 max-w-sm text-base leading-relaxed sm:text-lg">
            Assess AI fluency with realistic tasks in a workspace you configure
            for any role.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className={cn(buttonVariants({ size: "lg" }), "h-11 gap-3 px-4")}
            >
              Open dashboard
              <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="dither-plate relative aspect-[1.29] overflow-hidden rounded-3xl border shadow-sm">
          <DitherArtwork animated />
        </div>
      </section>
      <section
        aria-label="How interviews work"
        className="grid border-y sm:grid-cols-3 sm:divide-x"
      >
        {workflow.map(({ icon, title, description }) => (
          <div
            className="flex items-start gap-3 py-5 not-last:border-b sm:px-5 sm:not-last:border-b-0 sm:first:pl-0 lg:gap-4 lg:py-7"
            key={title}
          >
            <span className="bg-muted grid size-9 shrink-0 place-items-center rounded-lg border">
              <HugeiconsIcon
                icon={icon}
                className="size-4"
                aria-hidden="true"
              />
            </span>
            <div>
              <h2 className="font-semibold">{title}</h2>
              <p className="text-muted-foreground mt-1 max-w-64 text-sm leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        ))}
      </section>
    </div>
  </main>
);
