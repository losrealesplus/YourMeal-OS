import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fixture } from "./fixtures.mjs";
import { intentDigest, productionExecution } from "./contract.mjs";
export async function startLabUi(port = 8787) {
  const f = await fixture();
  const data = JSON.stringify({
    intent: f.intent,
    digest: intentDigest(f.intent),
    productionExecution,
  });
  const html = readFileSync(new URL("./ui.html", import.meta.url)),
    js = readFileSync(new URL("./ui.mjs", import.meta.url));
  const server = createServer((req, res) => {
    const headers = {
      "Content-Security-Policy":
        "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    };
    const routes = {
      "/": [html, "text/html; charset=utf-8"],
      "/ui.mjs": [js, "text/javascript; charset=utf-8"],
      "/demo.json": [data, "application/json"],
    };
    if (req.method !== "GET" || !routes[req.url]) {
      res.writeHead(405, headers);
      res.end("TEST_UI_READ_ONLY");
      return;
    }
    const [body, type] = routes[req.url];
    res.writeHead(200, { ...headers, "Content-Type": type });
    res.end(body);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    async close() {
      await new Promise((resolve) => server.close(resolve));
      f.cleanup();
    },
  };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 2) throw new Error("NO_PRODUCTION_ARGUMENTS");
  const ui = await startLabUi();
  console.log(ui.url + " TEST_ONLY / PRODUCTION HARD_DISABLED");
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () => ui.close().then(() => process.exit(0)));
}
