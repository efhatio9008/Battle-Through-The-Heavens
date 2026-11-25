import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] ?? 8000);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".glb": "model/gltf-binary"
};

function rangeFor(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2]) || !size) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  return start <= end ? { start, end } : null;
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }

  try {
    const url = new URL(request.url, "http://localhost");
    const pathname = decodeURIComponent(url.pathname);
    const file = resolve(root, pathname === "/" ? "index.html" : "." + pathname);
    const type = types[extname(file).toLowerCase()];
    if (!file.startsWith(root + sep) || !type) {
      response.writeHead(404).end();
      return;
    }

    const { size } = await stat(file);
    const range = request.headers.range ? rangeFor(request.headers.range, size) : undefined;
    if (range === null) {
      response.writeHead(416, { "Content-Range": `bytes */${size}` }).end();
      return;
    }
    const headers = { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": size };
    if (range) {
      headers["Content-Range"] = `bytes ${range.start}-${range.end}/${size}`;
      headers["Content-Length"] = range.end - range.start + 1;
    }
    response.writeHead(range ? 206 : 200, headers);
    if (request.method === "HEAD") {
      response.end();
      return;
    }

    const stream = createReadStream(file, range);
    stream.on("error", () => response.destroy());
    response.on("close", () => stream.destroy());
    stream.pipe(response);
  } catch (error) {
    if (response.headersSent) response.destroy();
    else response.writeHead(error instanceof URIError ? 400 : 404).end();
  }
});

server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () => {
  console.log(`Open http://127.0.0.1:${port}/ (Ctrl+C to stop)`);
});
