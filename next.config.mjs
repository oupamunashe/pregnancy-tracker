/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets phones/tablets on the home Wi-Fi load the dev server (npm run dev:lan) from the laptop's private IP.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*", "*.local"],
};
export default nextConfig;
