import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-xs font-medium text-muted-foreground", className)}>
      {children}
    </p>
  );
}

export function PageTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "max-w-2xl text-3xl font-semibold tracking-tight text-pretty sm:text-4xl",
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function SectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("text-xl font-semibold tracking-tight", className)}>
      {children}
    </h2>
  );
}

export function Panel({
  children,
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-2xl border border-border/80 bg-card/60 p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ id: T; label: string; icon?: ReactNode }>;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full border border-border/80 bg-muted/40 p-1">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors",
            value === option.id
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
