import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const Textarea = ({ className, ...props }: ComponentProps<"textarea">) => (
  <textarea
    data-slot="textarea"
    className={cn(
      "border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-2.5 py-2 text-sm outline-none focus-visible:ring-3 disabled:opacity-50",
      className
    )}
    {...props}
  />
);

export { Textarea };
