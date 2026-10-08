/** Local E2E only. Synthetic Auth actor -> real isolated SQL; never provider/OAuth credentials. */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { build } from "esbuild";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";
const root = process.cwd(),
  evidence = resolve(root, "../../reports/eatclean-sprint-02");
await mkdir(evidence, { recursive: true });
const database = spawn("python3", ["-u", "supabase/tests/p34/local-integration.py", "--serve-ui"], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
});
let logs = "",
  errors = "";
database.stdout.on("data", (b) => (logs += b.toString()));
database.stderr.on("data", (b) => (errors += b.toString()));
let server, browser;
try {
  const port = await new Promise((accept, reject) => {
    const timer = setTimeout(() => reject(new Error("Local DB startup timeout: " + errors)), 30000);
    const inspect = () => {
      const match = logs.match(/P34_UI_PORT:(\d+)/);
      if (match) {
        clearTimeout(timer);
        accept(Number(match[1]));
      }
    };
    database.stdout.on("data", inspect);
    database.on("exit", (c) => {
      clearTimeout(timer);
      reject(new Error("Local DB exited " + c + ": " + errors));
    });
  });
  const api = "http://127.0.0.1:" + port;
  const fakeModules = {
    auth: `export function useAuth(){const n=Number(new URLSearchParams(location.search).get('actor')||1);return {tenantId:'10000000-0000-4000-8000-000000000001',user:{id:'20000000-0000-4000-8000-'+String(n).padStart(12,'0'),email:n===6?'opaque@privaterelay.appleid.com':'access@example.test',user_metadata:{}},roles:n===3?['operations_manager']:['customer']};}`,
    lookup: `import {useQuery} from '@tanstack/react-query';import {api} from 'lab-api';export function useCurrentCustomerId(){return useQuery({queryKey:['current-customer-id'],queryFn:()=>api('customer_id',{})});}`,
    api: `export async function api(mode,data){const actor=Number(new URLSearchParams(location.search).get('actor')||1);const response=await fetch('${api}',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mode,actor,...data})});const value=await response.json();if(!response.ok)throw new Error(value.error);if(mode==='command'&&window.__loseResponse){window.__loseResponse=false;throw new Error('LAB_RESPONSE_LOST');}if(mode==='links'&&window.__holdRefresh){await new Promise(resolve=>window.__releaseRefresh=resolve);}return value.data;}export const customerProfileClient={read:(tenantId,customerId)=>api('read',{tenantId,customerId}),command:request=>api('command',request),identityRequests:tenantId=>api('links',{tenantId}),readback:(tenantId,requestId)=>api('readback',{tenantId,requestId})};`,
    router: `import React from 'react';export const createFileRoute=()=>options=>({options});export const Link=({to,children,...p})=><a href={to} {...p}>{children}</a>;`,
    consumer: `import React from 'react';export const ScreenHeader=({title})=><h1>{title}</h1>;`,
    toast: `function show(message){let n=document.getElementById('status');if(!n){n=document.createElement('p');n.id='status';n.setAttribute('role','status');document.body.append(n);}n.textContent=message;}export const toast={success:show,error:show,info:show};`,
  };
  const plugin = {
    name: "p34-lab-boundaries",
    setup(b) {
      b.onResolve({ filter: /.*/ }, (args) => {
        const path = args.path;
        let key;
        if (path === "@/hooks/use-auth") key = "auth";
        else if (path.endsWith("use-current-customer-id")) key = "lookup";
        else if (path.endsWith("customer-profile-client") || path === "lab-api") key = "api";
        else if (path === "@tanstack/react-router") key = "router";
        else if (path === "@/components/consumer") key = "consumer";
        else if (path === "sonner") key = "toast";
        if (key) return { path: key, namespace: "p34-lab" };
      });
      b.onLoad({ filter: /.*/, namespace: "p34-lab" }, (args) => ({
        contents: fakeModules[args.path],
        loader: "tsx",
        resolveDir: root,
      }));
    },
  };
  const entry = `import React from 'react';import {createRoot} from 'react-dom/client';import {QueryClient,QueryClientProvider} from '@tanstack/react-query';import {Route as P} from './src/routes/_authenticated/app.settings.profile';import {Route as A} from './src/routes/_authenticated/app.addresses';import {CustomerIdentityLinkReview} from './src/components/customer/customer-identity-link-review';const q=new QueryClient({defaultOptions:{queries:{retry:false}}});const params=new URLSearchParams(location.search);const Page=params.get('screen')==='addresses'?A.options.component:P.options.component;createRoot(document.getElementById('root')).render(<QueryClientProvider client={q}>{params.get('screen')==='review'?<CustomerIdentityLinkReview customerId={params.get('cid')} revision={1} displayName="Ficha LAB"/>:<Page/>}</QueryClientProvider>);`;
  const bundled = await build({
    stdin: { contents: entry, loader: "tsx", resolveDir: root },
    bundle: true,
    write: false,
    jsx: "automatic",
    alias: { "@": resolve(root, "src") },
    plugins: [plugin],
    define: { "process.env.NODE_ENV": '"test"' },
    platform: "browser",
  });
  const html =
    '<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px system-ui;max-width:700px;margin:20px auto;padding:12px}label{display:block;margin:10px 0}input:not([type=checkbox]),select{display:block;box-sizing:border-box;width:100%;padding:8px}button{padding:8px;margin:5px}h1{font-size:24px}</style><div id="root"></div><script>' +
    bundled.outputFiles[0].text.replaceAll("</script", "<\\/script") +
    "</script></html>";
  server = createServer((_q, res) => {
    res.setHeader("content-type", "text/html");
    res.end(html);
  });
  await new Promise((ok, fail) => {
    server.once("error", fail);
    server.listen(4179, "127.0.0.1", ok);
  });
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const pageErrors = [];
  const blocked = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.route("**/*", (r) => {
    const u = new URL(r.request().url());
    if (u.hostname !== "127.0.0.1") {
      blocked.push(u.hostname);
      return r.abort();
    }
    return r.continue();
  });
  const checked = [];
  const url = "http://127.0.0.1:4179";
  await page.goto(url);
  await page.getByRole("button", { name: "Editar mis datos" }).click();
  await page.getByLabel("Nombre", { exact: true }).fill("Ana Browser");
  await page.getByLabel("Correo de contacto").fill("contact@example.test");
  await page.getByLabel("Teléfono").fill("777888");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page.getByText("Nombre: Ana Browser", { exact: true }).waitFor();
  checked.push("canonical profile edit");
  const request = async (actor, mode, data = {}) => {
    const r = await fetch(api, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor, mode, ...data }),
    });
    const j = await r.json();
    assert.equal(r.status, 200, JSON.stringify(j));
    return j.data;
  };
  const cid = await request(1, "customer_id");
  const staffRead = await request(3, "read", {
    customerId: cid,
    tenantId: "10000000-0000-4000-8000-000000000001",
  });
  assert.equal(staffRead.displayName, "Ana Browser");
  assert.equal(staffRead.phone, "777888");
  checked.push("staff sees same canonical CRM");
  await page.goto(url + "?screen=addresses");
  await page.getByLabel("Calle y número").fill("Browser Street 3");
  await page.getByLabel("Nombre de la dirección").fill("Browser Casa");
  await page.getByLabel("Ciudad", { exact: true }).fill("LAB");
  await page.getByRole("button", { name: "Guardar dirección" }).click();
  await page
    .locator("p")
    .filter({ hasText: /^Browser Casa\s*$/ })
    .waitFor();
  checked.push("address creation");
  const block = page
    .locator("div.rounded-xl")
    .filter({ has: page.locator("p").filter({ hasText: /^Browser Casa/ }) });
  await block.getByRole("button", { name: "Usar como predeterminada" }).click();
  await page.getByText("Browser Casa · Predeterminada").waitFor();
  checked.push("atomic default switch");
  await block.getByRole("button", { name: "Editar", exact: true }).click();
  await page.getByLabel("Calle y número").fill("Browser Street edited");
  // Hold another invalidated query after the new profile is already visible.
  await page.evaluate(() => (window.__holdRefresh = true));
  await page.getByRole("button", { name: "Guardar dirección" }).click();
  await page.getByText("Browser Street edited, LAB").waitFor();
  checked.push("address edit");
  await page.waitForFunction(() => typeof window.__releaseRefresh === "function");
  assert.equal(await block.locator("select").isDisabled(), true);
  await page.evaluate(() => {
    window.__holdRefresh = false;
    window.__releaseRefresh();
  });
  checked.push("replacement selection locked until previous command finishes");
  assert.equal(
    await block.getByRole("button", { name: "Archivar", exact: true }).isDisabled(),
    true,
  );
  const canonicalAddresses = await request(1, "read", {
    customerId: cid,
    tenantId: "10000000-0000-4000-8000-000000000001",
  });
  assert.equal(canonicalAddresses.customerId, cid);
  const replacementAddress = canonicalAddresses.addresses.find((a) => !a.archived && !a.isDefault);
  assert.ok(replacementAddress, "An active replacement of the same canonical customer is required");
  await block.locator("select").selectOption(replacementAddress.id);
  assert.equal(await block.locator("select").inputValue(), replacementAddress.id);
  await block.getByRole("button", { name: "Archivar", exact: true }).click();
  await page.getByText("Browser Casa · Archivada").waitFor();
  checked.push("default archive requires replacement");
  await block.getByRole("button", { name: "Restaurar" }).click();
  await page
    .locator("p")
    .filter({ hasText: /^Browser Casa\s*$/ })
    .waitFor();
  checked.push("restore preserves current default");
  await page.goto(url);
  await page.getByRole("button", { name: "Editar mis datos" }).click();
  await page.getByLabel("Nombre", { exact: true }).fill("After Lost Response");
  await page.evaluate(() => (window.__loseResponse = true));
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page.getByRole("button", { name: "Comprobar resultado" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Guardar", exact: true }).isDisabled(), true);
  await page.getByRole("button", { name: "Comprobar resultado" }).click();
  await page.getByText("Nombre: After Lost Response", { exact: true }).waitFor();
  checked.push("lost response reconciles without second mutation");
  await page.screenshot({ path: resolve(evidence, "p34-profile-mobile.png"), fullPage: true });
  const newStaff = await request(3, "command", {
    tenantId: "10000000-0000-4000-8000-000000000001",
    requestId: crypto.randomUUID(),
    command: { operation: "create_staff", displayName: "Ficha LAB" },
  });
  const link = await request(5, "command", {
    tenantId: "10000000-0000-4000-8000-000000000001",
    requestId: crypto.randomUUID(),
    command: { operation: "request_link" },
  });
  await page.goto(url + "?screen=review&actor=3&cid=" + newStaff.customerId);
  await page.locator("select").selectOption(link.linkRequestId);
  assert.equal(
    await page
      .getByRole("button", { name: "Aprobar vinculación para confirmación del cliente" })
      .isDisabled(),
    true,
  );
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Aprobar vinculación para confirmación del cliente" })
    .click();
  await page.getByRole("status").getByText("Verificación registrada.", { exact: false }).waitFor();
  checked.push("staff verifies exact selected CRM");
  await page.goto(url + "?actor=5");
  await page.getByText("Ficha verificada: Ficha LAB").waitFor();
  await page.getByRole("button", { name: "Confirmar vinculación verificada" }).click();
  await page.getByText("Nombre: Ficha LAB", { exact: true }).waitFor();
  checked.push("customer second confirmation");
  await page.goto(url + "?actor=3");
  await page
    .getByText("Tu acceso de personal no crea una ficha de cliente automáticamente.")
    .waitFor();
  checked.push("no staff auto-materialization");
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(blocked, []);
  checked.push("no runtime errors or external connections");
  await writeFile(
    resolve(evidence, "p34-browser-evidence.json"),
    JSON.stringify(
      {
        state: "LOCAL_E2E_SQL_AND_UI_PASS",
        checks: checked,
        sqlRuntime: "linux/aarch64",
        auth: "synthetic laboratory sessions only; no real OAuth or JWT certification",
        styling: "functional harness CSS; product visual/device certification not claimed",
        providerConnections: 0,
      },
      null,
      2,
    ),
  );
  console.log(checked.length + " local browser/SQL checks PASS");
} finally {
  if (browser) await browser.close();
  if (server) await new Promise((ok) => server.close(ok));
  database.kill("SIGINT");
  await new Promise((ok) => {
    database.once("exit", ok);
    setTimeout(ok, 5000);
  });
  await writeFile(resolve(evidence, "p34-browser-sql.log"), logs + errors);
}
