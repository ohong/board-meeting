"use client";

import Image from "next/image";

/**
 * Round portrait at a fixed pixel size. Source files are 1826x1620, so we always
 * render with `fill` + object-cover inside a fixed box: no aspect-ratio warnings,
 * no layout shift while loading.
 */
export function Portrait({
  src,
  alt,
  size,
  className = "",
  grayscale = false,
}: {
  src: string;
  alt: string;
  size: number;
  className?: string;
  grayscale?: boolean;
}) {
  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-full bg-walnut-deep ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${size}px`}
        className={`object-cover object-top ${grayscale ? "grayscale-[0.35] contrast-[1.05]" : ""}`}
      />
    </span>
  );
}
