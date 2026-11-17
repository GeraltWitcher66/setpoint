/**
 * Serves the static export in ./out the way GitHub Pages would.
 *
 *   npm start                     → http://localhost:3000/
 *   PORT=8080 npm start           → custom port
 *   BASE_PREFIX=/setpoint npm start → mount under a project path
 */
import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const root = normalize(join(process.cwd(), "out"));
const prefix = (process.env.BASE_PREFIX ?? "").replace(/\/+$/, "");
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]).replace(/\/+$/, "");
  let candidate = normalize(join(root, clean));
  if (!candidate.startsWith(root)) return null;
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    candidate = join(candidate, "index.html");
  } else if (!extname(candidate)) {
    candidate = join(candidate, "index.html");
  }
  return existsSync(candidate) && statSync(candidate).isFile() ? candidate : null;
}

http
  .createServer((request, response) => {
    const url = request.url ?? "/";

    if (prefix && url !== prefix && !url.startsWith(`${prefix}/`)) {
      response.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      response.end("<h1>404</h1><p>Outside the site's base path.</p>");
      return;
    }

    const file = resolveFile(url.slice(prefix.length) || "/");
    if (!file) {
      const notFound = resolveFile("/404.html");
      if (!notFound) {
        response.writeHead(404);
        response.end();
        return;
      }
      response.writeHead(404, { "content-type": contentTypes[".html"] });
      createReadStream(notFound).pipe(response);
      return;
    }

    response.writeHead(200, {
      "content-type": contentTypes[extname(file)] ?? "application/octet-stream",
    });
    createReadStream(file).pipe(response);
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`Serving ./out at http://127.0.0.1:${port}${prefix}/`);
  });
