// Serves the exported site (./out) under the same /pregnancy-tracker/ base path GitHub Pages uses.
//   npm run build && npm run start:lan      → http://<this computer's IP>:3000/pregnancy-tracker/
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "/pregnancy-tracker").replace(/\/$/, "");
const root = path.resolve("out");
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";
if (!fs.existsSync(root)) { console.error("No ./out folder — run `npm run build` first."); process.exit(1); }

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".map": "application/json" };

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  let p = decodeURIComponent(url.pathname);
  if (p === "/" || p === "") { res.writeHead(302, { Location: base + "/" }).end(); return; }
  if (p !== base && !p.startsWith(base + "/")) return notFound(res);
  p = p.slice(base.length) || "/";
  let file = path.join(root, path.normalize(p));
  if (!file.startsWith(root)) return notFound(res);
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file) && fs.existsSync(file + ".html")) file += ".html";
  if (!fs.existsSync(file)) return notFound(res);
  res.writeHead(200, { "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream", "Content-Length": fs.statSync(file).size, "Cache-Control": file.includes("_next/static") ? "public, max-age=31536000, immutable" : "no-cache" });
  fs.createReadStream(file).pipe(res);
}).listen(port, host, () => {
  console.log(`Serving ${root}\n  local:   http://localhost:${port}${base}/\n  network: http://<your-ip>:${port}${base}/   (npm run ip)`);
});

function notFound(res) {
  const f = path.join(root, "404.html");
  res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
  fs.existsSync(f) ? fs.createReadStream(f).pipe(res) : res.end("Not found");
}
