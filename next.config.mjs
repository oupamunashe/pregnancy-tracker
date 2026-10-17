// Static-export SPA, served from GitHub Pages at https://<user>.github.io/pregnancy-tracker/
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/pregnancy-tracker";

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "export",                 // plain static files in ./out — no Node server needed
  basePath,                         // every route and asset lives under /pregnancy-tracker/
  trailingSlash: true,              // /settings/ → settings/index.html (works on any static host)
  images: { unoptimized: true },
  reactStrictMode: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },   // inlined for client code (service worker, auth redirects)
  // Lets phones/tablets on the home Wi-Fi load `npm run dev:lan` from the laptop's private IP.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*", "*.local"],
};
export default nextConfig;
