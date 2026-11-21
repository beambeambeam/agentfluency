import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";

import { Button } from "@/components/ui/button";

export const ThemeToggle = () => {
  const { setTheme } = useTheme();

  const toggleTheme = () => {
    const theme = document.documentElement.classList.contains("dark")
      ? "light"
      : "dark";
    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(theme);
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => setTheme(theme));
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      title="Toggle color theme"
    >
      <HugeiconsIcon
        icon={Moon02Icon}
        className="dark:hidden"
        aria-hidden="true"
      />
      <HugeiconsIcon
        icon={Sun03Icon}
        className="hidden dark:block"
        aria-hidden="true"
      />
    </Button>
  );
};
