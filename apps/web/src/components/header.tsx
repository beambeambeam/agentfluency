import { DashboardSquare01Icon, Home01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";

import UserMenu from "./user-menu";

export default function Header() {
  const links = [
    { to: "/", label: "Home", icon: Home01Icon },
    { to: "/dashboard", label: "Dashboard", icon: DashboardSquare01Icon },
  ] as const;

  return (
    <div>
      <div className="bg-card flex min-h-10 flex-row items-center justify-between px-3 py-1">
        <nav aria-label="Main" className="flex gap-1 text-sm">
          {links.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className="text-muted-foreground hover:bg-accent hover:text-foreground aria-[current=page]:bg-accent aria-[current=page]:text-foreground inline-flex items-center gap-1.5 rounded-md px-2 py-1.5"
            >
              <HugeiconsIcon icon={icon} size={15} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <UserMenu />
        </div>
      </div>
      <hr />
    </div>
  );
}
