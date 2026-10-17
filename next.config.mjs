const staticExport = process.env.STATIC_EXPORT === "1";   // set by the GitHub Pages workflow
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";   // e.g. "/pregnancy-tracker" for a GitHub Pages project site

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets phones/tablets on the home Wi-Fi load the dev server (npm run dev:lan) from the laptop's private IP.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*", "*.local"],
  // The app is entirely client-side (localStorage + Supabase), so it can be exported as plain static files.
  ...(staticExport ? { output: "export", trailingSlash: true, images: { unoptimized: true }, ...(basePath ? { basePath } : {}) } : {}),
};
export default nextConfig;
