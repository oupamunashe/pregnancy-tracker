import clsx, { type ClassValue } from "clsx";

export const cx = (...v: ClassValue[]) => clsx(v);
export const uid = (prefix = "") => prefix + Math.random().toString(36).slice(2, 9);
export const isUrl = (v: string | undefined | null): v is string => !!v && /^(https?:\/\/|data:image\/)/i.test(v.trim());
export const isHttpUrl = (v: string | undefined | null): v is string => !!v && /^https?:\/\//i.test(v.trim());

export const money = (n: number) => "R " + Math.round(n).toLocaleString("en-ZA").replace(/ /g, " ");

/** Black or white text, whichever reads better on `hex`. */
export function onColor(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lum = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  return lum > 150 ? "#2b2110" : "#ffffff";
}

export function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

/** Downscales an image file to max 700px JPEG so uploads stay small enough for localStorage. */
export function shrinkImage(file: File, max = 700): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Not a readable image")); };
    img.src = url;
  });
}
