import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
await ctx.addInitScript(() => {
  localStorage.setItem("tenant_onboarding_done", "1");
  localStorage.setItem("i18nextLng", "es");
});
const page = await ctx.newPage();
const blocked = [],
  errors = [];
await ctx.route("**/*", async (route) => {
  const u = new URL(route.request().url());
  if (["127.0.0.1", "localhost"].includes(u.hostname) && ["8080", "54331"].includes(u.port))
    return route.continue();
  if (["data:", "blob:"].includes(u.protocol)) return route.continue();
  blocked.push(u.origin);
  return route.abort("blockedbyclient");
});
page.on("pageerror", (e) => errors.push(e.message));
page.on("response", async (r) => {
  if (r.status() >= 400)
    console.log(
      "HTTP_FAILURE",
      new URL(r.url()).pathname,
      r.status(),
      (await r.text()).slice(0, 300),
    );
});
try {
  await page.goto("http://127.0.0.1:8080/auth", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page
    .locator("input[type=email]")
    .waitFor({ timeout: 30000 })
    .catch(async (e) => {
      console.log("LOGIN_RENDER_FAILED", (await page.locator("body").innerText()).slice(0, 1600));
      await browser.close();
      throw e;
    });
  await page.locator("input[type=email]").fill("customer@e2e.example.test");
  await page.locator("input[type=password]").fill("E2E-synthetic-Only-2026!");
  await page.locator("form button").first().click();
  await page.waitForTimeout(5000);
  await page.goto("http://127.0.0.1:8080/app/settings/profile", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  if (await page.getByRole("button", { name: "Soy nuevo cliente: crear ficha" }).count()) {
    await page.getByLabel("Nombre comercial").fill("Cliente sintético E2E");
    await page.getByRole("button", { name: "Soy nuevo cliente: crear ficha" }).click();
    await page.waitForTimeout(1500);
    console.log("ONBOARDING_RESPONSE", (await page.locator("body").innerText()).slice(0, 2000));
  }
  await page.getByRole("button", { name: "Editar mis datos" }).waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: "Editar mis datos" }).click();
  await page.getByLabel("Teléfono", { exact: true }).fill("600000001");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await page.getByRole("button", { name: "Editar mis datos" }).waitFor({ timeout: 15000 });
  await page.goto("http://127.0.0.1:8080/app/addresses", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Guardar dirección" }).waitFor();
  if (!(await page.getByText("Calle Sintética 1", { exact: false }).count())) {
    const inputs = page.locator("form input");
    console.log("ADDRESS_INPUTS", await inputs.count());
    for (const [i, value] of [
      "Casa sintética",
      "Calle Sintética 1",
      "Santa Cruz",
      "38001",
    ].entries())
      await inputs.nth(i).fill(value);
    await page.getByRole("button", { name: "Guardar dirección" }).click();
    await page.getByText("Calle Sintética 1", { exact: false }).waitFor();
  }
  await page.goto("http://127.0.0.1:8080/app/schedule", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800);
  await page.getByRole("button", { name: "Semana siguiente" }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Añadir", exact: true }).waitFor({ timeout: 15000 });
  await page.getByRole("button", { name: "Añadir", exact: true }).click();
  await page.getByRole("button", { name: "Ver resumen", exact: true }).click();
  console.log("SUMMARY", (await page.locator("body").innerText()).slice(-1800));
  await page.getByRole("button", { name: /Confirmar.*pedido/i }).click();
  await page.waitForTimeout(2500);
  await page.waitForURL("**/app/orders/*", { timeout: 15000 });
  const orderId = new URL(page.url()).pathname.split("/").at(-1);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1800);
  await writeFile("/private/tmp/yourmeal-e2e-order-public.json", JSON.stringify({ orderId }));
  const detail = await page.locator("body").innerText();
  if (!detail.includes("Plato sintético E2E") || !detail.includes("8,50") || errors.length)
    throw Error("ORDER_RELOAD_OR_BROWSER_FAILED");
  console.log("LOCAL_STAGING_BROWSER_PASS");
  console.log("URL", page.url());
  console.log("TEXT", (await page.locator("body").innerText()).slice(0, 4500));
  console.log("ERRORS", JSON.stringify(errors));
  console.log("BLOCKED", JSON.stringify([...new Set(blocked)]));
} catch (e) {
  process.exitCode = 1;
  console.log("FAIL", e.message.split("\n")[0]);
  console.log("BODY", (await page.locator("body").innerText()).slice(0, 3000));
  console.log("ERRORS", JSON.stringify(errors));
} finally {
  await browser.close();
}
