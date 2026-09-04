"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-[0_1px_2px_rgb(0_0_0/0.16),0_8px_20px_-10px_rgb(0_0_0/0.35)] hover:bg-accent-deep hover:shadow-[0_1px_2px_rgb(0_0_0/0.2),0_12px_26px_-10px_rgb(0_0_0/0.45)] disabled:bg-surface-3 disabled:text-faint disabled:opacity-100 disabled:shadow-none",
  secondary: "border border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-2",
  outline: "border border-line-strong bg-transparent text-ink hover:border-ink/40 hover:bg-surface-2",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
  danger: "border border-dissent/35 bg-surface text-dissent hover:bg-dissent-soft",
};

const SIZE: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[12px] gap-1.5 rounded-full",
  md: "h-10 px-5 text-[13px] gap-2 rounded-full",
  lg: "h-11 px-6 text-[14px] gap-2 rounded-full",
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
      className={`inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-40 ${
        rest.disabled ? "" : "press"
      } ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      {...rest}
    />
  );
}
