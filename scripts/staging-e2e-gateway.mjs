/** Local transport only: routes to real GoTrue/PostgREST, never mocks their responses. */
import http from "node:http";
import { spawn } from "node:child_process";
const transport = (request) =>
  new Promise((resolve, reject) => {
    const code = `let input='';for await(const c of process.stdin)input+=c;const x=JSON.parse(input);if(!['yourmeal-e2e-auth','yourmeal-e2e-rest'].includes(new URL(x.url).hostname))process.exit(2);const r=await fetch(x.url,{method:x.method,headers:x.headers,body:x.body?Buffer.from(x.body,'base64'):undefined,redirect:'error',signal:AbortSignal.timeout(12000)});console.log(JSON.stringify({status:r.status,headers:Object.fromEntries(r.headers),body:Buffer.from(await r.arrayBuffer()).toString('base64')}));`;
    const p = spawn(
      "docker",
      [
        "--context",
        "orbstack",
        "exec",
        "-i",
        "yourmeal-e2e-transport",
        "node",
        "--input-type=module",
        "-e",
        code,
      ],
      { stdio: ["pipe", "pipe", "ignore"] },
    );
    let output = "";
    p.stdout.on("data", (c) => (output += c));
    p.on("error", reject);
    p.on("exit", (c) => {
      try {
        if (c) throw new Error("TRANSPORT_FAILED");
        resolve(JSON.parse(output));
      } catch (e) {
        reject(e);
      }
    });
    p.stdin.end(JSON.stringify(request));
  });
const counts = { auth: 0, rest: 0, rejected: 0 };
const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && origin !== "http://127.0.0.1:8080") {
    counts.rejected++;
    res.writeHead(403).end();
    return;
  }
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:8080");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "authorization,apikey,content-type,x-client-info,prefer,accept-profile,content-profile,x-supabase-api-version",
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Expose-Headers", "content-range");
  if (req.method === "OPTIONS") {
    res.writeHead(204).end();
    return;
  }
  if (req.url === "/local-e2e-counters") {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(counts));
    return;
  }
  const auth = req.url.startsWith("/auth/v1/"),
    rest = req.url.startsWith("/rest/v1/");
  if (!auth && !rest) {
    counts.rejected++;
    res.writeHead(404).end();
    return;
  }
  counts[auth ? "auth" : "rest"]++;
  const prefix = auth ? "/auth/v1" : "/rest/v1";
  const target =
    "http://" +
    (auth ? "yourmeal-e2e-auth:9999" : "yourmeal-e2e-rest:3000") +
    req.url.slice(prefix.length);
  try {
    const headers = { ...req.headers };
    delete headers.host;
    delete headers.connection;
    delete headers["content-length"];
    delete headers["accept-encoding"];
    const parts = [];
    for await (const part of req) parts.push(part);
    const body = Buffer.concat(parts);
    const upstream = await transport({
      url: target,
      method: req.method,
      headers,
      body: body.length ? body.toString("base64") : null,
    });
    res.statusCode = upstream.status;
    for (const k of ["content-type", "content-range", "preference-applied", "www-authenticate"])
      if (upstream.headers[k]) res.setHeader(k, upstream.headers[k]);
    res.end(Buffer.from(upstream.body, "base64"));
  } catch {
    res.writeHead(502).end('{"code":"LOCAL_UPSTREAM_FAILED"}');
  }
});
server.listen(54331, "127.0.0.1", () => console.log("LOCAL_GATEWAY_READY"));
for (const s of ["SIGTERM", "SIGINT"]) process.once(s, () => server.close(() => process.exit()));
