import { cn } from "@/lib/utils";

export const BrandLogo = ({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) => {
  const variant = compact ? "" : "-long";
  return (
    <span
      className={cn(
        "relative block shrink-0",
        compact ? "size-10" : "h-12 w-31 sm:h-15 sm:w-39",
        className
      )}
    >
      <img
        src={`/statics/logo/agf-dark${variant}.svg`}
        alt=""
        className="size-full object-contain dark:hidden"
      />
      <img
        src={`/statics/logo/agf-light${variant}.svg`}
        alt=""
        className="hidden size-full object-contain dark:block"
      />
    </span>
  );
};
