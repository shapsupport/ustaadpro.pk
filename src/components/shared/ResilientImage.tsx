"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface ResilientImageProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  fallback: React.ReactNode;
  timeoutMs?: number;
  quality?: number;
}

export function ResilientImage(props: ResilientImageProps) {
  return <ResilientImageInner key={props.src} {...props} />;
}

function ResilientImageInner({ src, alt, sizes, className = "object-cover", priority = false, fallback, timeoutMs = 3000, quality = 85 }: ResilientImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setTimedOut(true), timeoutMs);
    return () => window.clearTimeout(timer);
  }, [timeoutMs]);

  return <>
    {!loaded && !timedOut && !failed && <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 via-slate-200 to-emerald-100" aria-hidden="true"><div className="absolute inset-x-5 bottom-5 h-3 rounded-full bg-white/70" /><div className="absolute bottom-10 left-5 h-3 w-2/3 rounded-full bg-white/70" /></div>}
    {!loaded && (timedOut || failed) && <div className="absolute inset-0">{fallback}</div>}
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      quality={quality}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      className={`${className} [image-rendering:auto] transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      onLoad={() => {
        setLoaded(true);
        setFailed(false);
      }}
      onError={() => setFailed(true)}
    />
  </>;
}
