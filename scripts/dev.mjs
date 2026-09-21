const indexFile = Bun.file(new URL("../index.html", import.meta.url));
const port = Number(process.env.PORT ?? 8000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

const server = Bun.serve({
  port,
  fetch(request) {
    const { pathname } = new URL(request.url);
    if (pathname === "/" || pathname === "/index.html") {
      return new Response(indexFile, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    return new Response("Not found", { status: 404 });
  }
});

console.log(`flipbook is available at ${server.url}`);
