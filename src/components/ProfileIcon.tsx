import { isUrl } from "@/lib/utils";

/** Renders a profile's icon: an emoji character, or an image when the value is a URL. */
export function ProfileIcon({ icon, size = 36 }: { icon?: string; size?: number }) {
  if (isUrl(icon)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={icon} alt="" width={size} height={size} referrerPolicy="no-referrer" className="rounded-full object-cover border border-honey-400" style={{ width: size, height: size }} />;
  }
  return <span aria-hidden="true" className="leading-none" style={{ fontSize: size * 0.85 }}>{icon || "🌸"}</span>;
}
