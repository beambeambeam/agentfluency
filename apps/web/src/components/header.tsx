import { DashboardSquare01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

import { BrandLogo } from "./brand-logo";
import { ThemeToggle } from "./theme-toggle";
import UserMenu from "./user-menu";

export default function Header() {
  const { data: session } = authClient.useSession();
  return (
    <header className="bg-background/95 border-b">
      <div className="mx-auto flex h-16 max-w-[100rem] items-center justify-between gap-2 px-3 sm:gap-3 sm:px-8">
        <Link
          to="/"
          aria-label="AgentFluency home"
          className="rounded-md focus-visible:ring-2"
        >
          <BrandLogo />
        </Link>
        <nav aria-label="Main" className="flex items-center sm:gap-3">
          {session?.user.role === "interviewer" && (
            <Link
              to="/dashboard"
              aria-label="Dashboard"
              className="text-muted-foreground hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground inline-flex size-9 items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 sm:w-auto sm:px-3"
            >
              <HugeiconsIcon
                icon={DashboardSquare01Icon}
                className="size-4"
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}
          <ThemeToggle />
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
