"use client";

import { useState } from "react";

/** Square, bordered, object-contain pack shot; falls back to a placeholder when there is no image or the link is broken. */
export function DiaperImage({ src, alt, color, className = "w-28" }: { src: string; alt: string; color: string; className?: string }) {
  const [failed, setFailed] = useState<string>("");
  const ok = !!src && failed !== src;
  return (
    <div className={`flex-none aspect-square bg-white border border-honey-400 rounded-xl overflow-hidden grid place-items-center ${className}`}>
      {ok ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="w-full h-full object-contain p-1" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(src)} />
      ) : (
        <div className="text-center p-1">
          <svg viewBox="0 0 80 80" className="w-12 h-12 mx-auto" role="img" aria-label={`${alt} placeholder`}>
            <rect width="80" height="80" rx="12" fill={color} opacity=".12" />
            <path d="M12 24h56v10c0 18-12 28-28 28S12 52 12 34z" fill="#fff" stroke={color} strokeWidth="3" />
            <rect x="12" y="24" width="56" height="8" fill={color} />
            <circle cx="40" cy="46" r="6" fill="var(--color-highlight)" />
          </svg>
          <div className="text-[10px] text-gray-500 leading-tight">{src ? "Link broken" : "No image yet"}</div>
        </div>
      )}
    </div>
  );
}
