import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const origin = "http://127.0.0.1:4179";
const output = process.env.A4B_BROWSER_EVIDENCE_DIR;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
let checks = 0;
async function test(name, body) {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  const errors = [];
  await page.route("**/*", (route) => {
    if (new URL(route.request().url()).hostname !== "127.0.0.1") {
      errors.push(`External request forbidden: ${route.request().url()}`);
      return route.abort();
    }
    return route.continue();
  });
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await body(page);
    assert.deepEqual(errors, []);
    checks++;
    console.log(`PASS ${name}`);
  } finally {
    await context.close();
  }
}
const add = async (page, price = "18,00", name = "Tarta") => {
  await page.getByRole("button", { name: "+ Añadir personalizado", exact: true }).click();
  const fields = page
    .locator("fieldset")
    .filter({ has: page.locator('input[autocomplete="off"]') });
  const row = fields.last();
  await row.getByLabel("Nombre", { exact: true }).fill(name);
  await row.getByLabel("Precio unidad (€)").fill(price);
  return row;
};
try {
  for (const flag of ["closed", "missing", "error", "loading", "global-only"]) {
    await test(`flag ${flag} stays CLOSED`, async (page) => {
      await page.goto(`${origin}/?flag=${flag}`);
      await page.getByText("Captura Universal de Pedido", { exact: true }).waitFor();
      await page.waitForTimeout(150);
      assert.equal(await page.getByRole("button", { name: "+ Añadir personalizado" }).count(), 0);
      assert.equal(await page.getByRole("button", { name: "Guardar Borrador" }).count(), 1);
      assert.equal(await page.getByRole("button", { name: "Guardar y Confirmar" }).count(), 1);
    });
  }
  for (const role of ["customer", "kitchen", "driver"]) {
    await test(`incompatible role ${role} stays CLOSED`, async (page) => {
      await page.goto(`${origin}/?role=${role}`);
      await page.getByText("Captura Universal de Pedido", { exact: true }).waitFor();
      assert.equal(await page.getByRole("button", { name: "+ Añadir personalizado" }).count(), 0);
    });
  }
  for (const width of [320, 375, 768, 1440]) {
    await test(`custom-only keyboard/responsive ${width}px`, async (page) => {
      await page.setViewportSize({ width, height: 812 });
      await page.goto(origin);
      const first = await add(
        page,
        "0,00",
        "Tarta personalizada con un nombre que ocupa varias líneas",
      );
      await first.getByLabel("Confirmo expresamente el precio de 0 €.").check();
      await first.getByLabel("Cantidad", { exact: true }).fill("2");
      assert.equal(
        await first.getByLabel("Confirmo expresamente el precio de 0 €.").isChecked(),
        false,
      );
      await first.getByLabel("Confirmo expresamente el precio de 0 €.").check();
      await add(page);
      await page.getByRole("button", { name: "Revisar pedido", exact: true }).focus();
      await page.keyboard.press("Enter");
      await page.getByRole("region", { name: "Resumen del pedido a confirmar" }).waitFor();
      assert.equal(
        await page.getByRole("button", { name: "Confirmar envío del pedido" }).isEnabled(),
        true,
      );
      const bounds = await page
        .getByRole("button", { name: "Confirmar envío del pedido" })
        .boundingBox();
      assert.ok(
        bounds.x >= 0 &&
          bounds.x + bounds.width <= width + 1 &&
          bounds.y >= 0 &&
          bounds.y + bounds.height <= 812,
      );
      assert.equal(await page.locator("fieldset input").first().isDisabled(), true);
      assert.deepEqual(await page.evaluate(() => window.a4bCalls), []);
      if (output) await page.screenshot({ path: `${output}/custom-review-${width}.png` });
      await page.getByRole("button", { name: "Confirmar envío del pedido" }).click();
      await page.getByRole("status").filter({ hasText: "Guardado" }).waitFor();
      const calls = await page.evaluate(() => window.a4bCalls);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].kind, "custom");
      assert.equal(calls[0].request.command.lines.length, 2);
      assert.ok(
        calls[0].request.command.lines.every(
          (line) => line.kind === "custom" && !line.lineId && !line.dishId,
        ),
      );
      assert.equal(calls[0].request.command.lines[0].explicitZeroConfirmed, true);
    });
  }
  await test("mixed shows server quote before one atomic commit", async (page) => {
    await page.goto(`${origin}/?menu=published`);
    await page
      .getByText("Pollo sintético", { exact: true })
      .locator("xpath=../../..")
      .getByRole("button")
      .last()
      .click();
    await add(page);
    await page.getByRole("button", { name: "Revisar pedido" }).click();
    await page.getByText("Total cotizado: 29.90 €").waitFor();
    assert.equal((await page.evaluate(() => window.a4bCalls)).length, 1);
    await page.getByRole("button", { name: "Confirmar envío del pedido" }).click();
    await page.getByRole("status").filter({ hasText: "Guardado" }).waitFor();
    const calls = await page.evaluate(() => window.a4bCalls);
    assert.deepEqual(
      calls.map((call) => call.kind),
      ["quote", "mixed"],
    );
    assert.equal(calls[0].request.requestId, calls[1].request.requestId);
    assert.deepEqual(calls[0].request.command, calls[1].request.command);
    assert.equal(calls[1].request.command.lines.length, 2);
  });
  await test("mixed manual Dish override is rejected before quote", async (page) => {
    await page.goto(`${origin}/?menu=published`);
    await page
      .getByText("Pollo sintético", { exact: true })
      .locator("xpath=../../..")
      .getByRole("button")
      .last()
      .click();
    await page.getByPlaceholder("11.90 € (catálogo)").fill("1.00");
    await add(page);
    await page.getByRole("button", { name: "Revisar pedido" }).click();
    await page.getByRole("alert").filter({ hasText: "Retira los precios manuales" }).waitFor();
    assert.deepEqual(await page.evaluate(() => window.a4bCalls), []);
  });
  await test("keyboard focus survives line removal", async (page) => {
    await page.goto(origin);
    const row = await add(page);
    await row.getByRole("button", { name: "Retirar personalizado Tarta" }).focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(50);
    assert.equal(
      await page
        .getByRole("button", { name: "+ Añadir personalizado", exact: true })
        .evaluate((el) => el === document.activeElement),
      true,
    );
  });
  await test("review remains reachable at 200 percent zoom", async (page) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(origin);
    await page.evaluate(() => {
      document.body.style.zoom = "2";
    });
    await add(page);
    await page.getByRole("button", { name: "Revisar pedido" }).click();
    const bounds = await page
      .getByRole("button", { name: "Confirmar envío del pedido" })
      .boundingBox();
    assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= 1000);
    assert.equal(
      await page
        .getByRole("region", { name: "Resumen del pedido a confirmar" })
        .evaluate((el) => el === document.activeElement),
      true,
    );
  });
  await test("invalid custom price does not reach any transport", async (page) => {
    await page.goto(origin);
    await add(page, "12invalid");
    await page.getByRole("button", { name: "Revisar pedido" }).click();
    await page.getByRole("alert").waitFor();
    assert.deepEqual(await page.evaluate(() => window.a4bCalls), []);
  });
  await test("uncertain result retries exact request and freezes close/edit", async (page) => {
    await page.goto(`${origin}/?failure=unknown`);
    await add(page);
    await page.getByRole("button", { name: "Revisar pedido" }).click();
    await page.getByRole("button", { name: "Confirmar envío del pedido" }).click();
    await page.getByRole("button", { name: "Reintentar misma solicitud" }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Volver a editar" }).count(), 0);
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 1);
    await page.getByRole("button", { name: "Reintentar misma solicitud" }).click();
    await page.getByRole("status").filter({ hasText: "Guardado" }).waitFor();
    const calls = await page.evaluate(() => window.a4bCalls);
    assert.equal(calls.length, 2);
    assert.deepEqual(calls[0].request, calls[1].request);
  });
  await test("canonical edit preserves UUID/revision and removes one homonym", async (page) => {
    await page.goto(`${origin}/?surface=edit`);
    await page.getByRole("button", { name: "Editar artículos" }).click();
    const fields = page
      .locator("fieldset")
      .filter({ has: page.locator('input[autocomplete="off"]') });
    await fields
      .last()
      .getByRole("button", { name: "Retirar personalizado Tarta", exact: true })
      .click();
    await page.getByRole("button", { name: "Revisar pedido" }).click();
    await page.getByRole("button", { name: "Confirmar envío del pedido" }).click();
    await page.getByRole("status").filter({ hasText: "Guardado" }).waitFor();
    const command = await page.evaluate(() => window.a4bCalls[0].request.command);
    assert.equal(command.operation, "modify");
    assert.equal(command.expectedRevision, 4);
    assert.equal(command.lines.length, 1);
    assert.equal(command.lines[0].lineId, "80000000-0000-4000-8000-000000000001");
  });
  await test("repeat leaves historical price blank and requires all reconfirmations", async (page) => {
    await page.goto(`${origin}/?surface=edit`);
    await page.getByRole("button", { name: "Repetir con reconfirmación" }).click();
    const fields = page
      .locator("fieldset")
      .filter({ has: page.locator('input[autocomplete="off"]') });
    const rows = await fields.all();
    assert.equal(rows.length, 3);
    // Outer fieldset and two independent custom fieldsets; use labelled inputs directly.
    const prices = await page.getByLabel("Precio unidad (€)").all();
    for (const price of prices) {
      assert.equal(await price.inputValue(), "");
      await price.fill("19,00");
    }
    await page.getByRole("button", { name: "Revisar pedido" }).click();
    await page.getByRole("alert").waitFor();
    assert.deepEqual(await page.evaluate(() => window.a4bCalls), []);
    for (const label of [
      "Confirmo la disponibilidad actual",
      "Confirmo la preparación y la intención actual",
      "Confirmo el precio actual",
    ]) {
      for (const checkbox of await page.getByLabel(label, { exact: true }).all())
        await checkbox.check();
    }
    await page.getByRole("button", { name: "Revisar pedido" }).click();
    await page.getByRole("button", { name: "Confirmar envío del pedido" }).click();
    await page.getByRole("status").filter({ hasText: "Guardado" }).waitFor();
    const command = await page.evaluate(() => window.a4bCalls[0].request.command);
    assert.equal(command.operation, "capture");
    assert.equal(command.lines.length, 2);
    assert.ok(
      command.lines.every(
        (line) =>
          !line.lineId && line.repeatConfirmation.priceConfirmed && line.unitPrice === "19.00",
      ),
    );
  });
  console.log(
    `A4b browser checks: ${checks} PASS; synthetic local doubles only; zero production requests.`,
  );
} finally {
  await browser.close();
}
