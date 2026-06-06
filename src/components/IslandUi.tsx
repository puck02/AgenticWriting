import type { ButtonHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

type IslandButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "default";
  size?: "small" | "middle" | "large";
  loading?: boolean;
  loadingLabel?: string;
};

export function IslandButton({
  variant = "default",
  size = "middle",
  loading = false,
  loadingLabel = "处理中...",
  className,
  children,
  disabled,
  ...props
}: IslandButtonProps) {
  return (
    <button
      className={[
        "island-button",
        `island-button-${variant}`,
        `island-button-${size}`,
        className
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? loadingLabel : children}
    </button>
  );
}

export function IslandCard({
  children,
  className,
  color = "default"
}: {
  children: ReactNode;
  className?: string;
  color?: "default" | "yellow" | "teal";
}) {
  return (
    <div
      className={["island-card", `island-card-${color}`, className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

export function IslandSelect({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={["island-select", className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </select>
  );
}

export function IslandGlyph({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="island-glyph" aria-hidden="true" title={label}>
      {children}
    </span>
  );
}
