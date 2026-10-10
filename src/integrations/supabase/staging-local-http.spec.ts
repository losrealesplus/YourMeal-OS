/** Real supabase-js against a loopback protocol fixture. No provider and no genuine credentials. */
import { createServer } from "node:http";
import { createHmac } from "node:crypto";
import { afterAll, afterEach, beforeAll, expect, it, vi } from "vitest";
import { LOCAL_STAGING_CONFIG, LOCAL_STAGING_URL } from "@/lib/local-staging-runtime";
import { LOCAL_STAGING_SERVICE_KEY } from "./local-staging.server";
vi.mock("@/platform/storage-provider", () => ({ createSupabaseAuthStorage: () => undefined }));
const seen: { path: string; key: string; authorization: string }[] = [];
const user = {
  id: "20000000-0000-4000-8000-000000000011",
  aud: "authenticated",
  role: "authenticated",
  email: "synthetic@example.test",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-10-10T00:00:00Z",
};
const encode = (x: unknown) => Buffer.from(JSON.stringify(x)).toString("base64url");
const body =
  encode({ alg: "HS256", typ: "JWT" }) +
  "." +
  encode({
    sub: user.id,
    role: "authenticated",
    aud: "authenticated",
    iss: LOCAL_STAGING_URL + "/auth/v1",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
const token =
  body +
  "." +
  createHmac("sha256", "p34-local-synthetic-signing-secret-not-for-production-2026")
    .update(body)
    .digest("base64url");
const server = createServer((req, res) => {
  seen.push({
    path: req.url ?? "",
    key: String(req.headers.apikey ?? ""),
    authorization: String(req.headers.authorization ?? ""),
  });
  res.setHeader("content-type", "application/json");
  if (req.url?.startsWith("/auth/v1/token"))
    res.end(
      JSON.stringify({
        access_token: token,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "synthetic-refresh",
        user,
      }),
    );
  else if (req.url?.startsWith("/auth/v1/user")) res.end(JSON.stringify(user));
  else if (req.url?.startsWith("/rest/v1/rpc/p34_customer_profile"))
    res.end(JSON.stringify({ customerId: "synthetic-customer", revision: 1, addresses: [] }));
  else if (req.url?.startsWith("/rest/v1/customers"))
    res.end(JSON.stringify([{ id: "synthetic-customer" }]));
  else {
    res.statusCode = 404;
    res.end("{}");
  }
});
beforeAll(async () => {
  await new Promise<void>((ok, fail) => {
    server.once("error", fail);
    server.listen(54321, "127.0.0.1", ok);
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
afterAll(async () => {
  await new Promise<void>((ok, fail) => server.close((e) => (e ? fail(e) : ok())));
});
it("real browser client logs in and calls RPC through synthetic loopback only", async () => {
  vi.resetModules();
  vi.stubEnv("VITE_YOURMEAL_RUNTIME_ENV", undefined);
  vi.stubGlobal("window", {
    location: { hostname: "localhost" },
    __INSTANCE_CONFIG__: LOCAL_STAGING_CONFIG,
  });
  const { supabase } = await import("./client");
  try {
    const login = await supabase.auth.signInWithPassword({
      email: user.email,
      password: "synthetic-password",
    });
    expect(login.error).toBeNull();
    expect(login.data.user?.id).toBe(user.id);
    const client = supabase as unknown as {
      rpc: (
        name: string,
        args: Record<string, string>,
      ) => Promise<{ error: unknown; data: unknown }>;
    };
    const result = await client.rpc("p34_customer_profile", {
      _tenant: "10000000-0000-4000-8000-000000000001",
      _customer: "30000000-0000-4000-8000-000000000011",
    });
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ customerId: "synthetic-customer", revision: 1, addresses: [] });
    expect(seen.every((x) => x.key === LOCAL_STAGING_CONFIG.supabasePublishableKey)).toBe(true);
    expect(seen.find((x) => x.path.includes("/rpc/"))?.authorization).toBe("Bearer " + token);
  } finally {
    supabase.auth.stopAutoRefresh();
  }
});
it("real server client reads only loopback fixture with synthetic service key", async () => {
  vi.resetModules();
  vi.stubGlobal("window", undefined);
  for (const [k, v] of Object.entries({
    YOURMEAL_RUNTIME_ENV: "staging_local",
    TENANT_SLUG: "eatclean-staging",
    SUPABASE_URL: LOCAL_STAGING_URL,
    SUPABASE_PUBLISHABLE_KEY: LOCAL_STAGING_CONFIG.supabasePublishableKey,
    SUPABASE_SERVICE_ROLE_KEY: LOCAL_STAGING_SERVICE_KEY,
  }))
    vi.stubEnv(k, v);
  const { supabaseAdmin } = await import("./client.server");
  const result = await supabaseAdmin.from("customers").select("id");
  expect(result.error).toBeNull();
  expect(result.data).toEqual([{ id: "synthetic-customer" }]);
  expect(seen.at(-1)?.key).toBe(LOCAL_STAGING_SERVICE_KEY);
});
