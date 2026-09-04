"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-[inset_0_-1px_0_oklch(0%_0_0/0.08)] hover:bg-accent-deep disabled:hover:bg-accent",
  secondary: "border border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-2",
  outline: "border border-accent-line bg-accent-soft text-accent-deep hover:border-accent hover:bg-accent-line/50",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
  danger: "border border-dissent/35 bg-surface text-dissent hover:bg-dissent-soft",
};

const SIZE: Record<Size, string> = {
  sm: "h-8 px-3 text-[12.5px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-[13.5px] gap-2 rounded-xl",
  lg: "h-11 px-5 text-[14px] gap-2 rounded-xl",
};

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...rest}
    />
  );
}
