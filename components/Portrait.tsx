"use client";

import Image from "next/image";
import { useState } from "react";

export function Portrait({
  slug,
  name,
  initials,
  size = "catalog",
}: {
  slug: string;
  name: string;
  initials: string;
  size?: "catalog" | "preview" | "roster";
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <span className={`portrait portrait-size-${size}`}>
      <span className="portrait-monogram" aria-hidden="true">
        {initials}
      </span>
      {!imageFailed ? (
        <Image
          src={`/portraits/${slug}.jpg`}
          alt={`${name} portrait`}
          fill
          sizes={
            size === "catalog"
              ? "(min-width: 1280px) 144px, (min-width: 1024px) 120px, 38vw"
              : "64px"
          }
          className="portrait-image"
          onError={() => setImageFailed(true)}
        />
      ) : null}
    </span>
  );
}
