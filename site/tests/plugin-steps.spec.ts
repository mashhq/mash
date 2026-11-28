import { expect, type Locator, type Page, test } from "@playwright/test";

const phone = { width: 390, height: 844 };
const steps = [
  "You chat with Codex",
  "Mash remembers",
  "Later, you ask Claude",
  "Claude already knows",
];

/** Opens the landing page with the plugin band's rail running and on screen. */
async function open(page: Page): Promise<Locator> {
  await page.goto("/");
  await expect(page.locator(".mash-welcome")).toHaveClass(/\breveal\b/);
  const band = page.locator("#welcome-plugin");
  await band.locator("[data-rail-track]").scrollIntoViewIfNeeded();
  await expect(band.locator("[data-rail-go]")).toBeVisible();
  return band;
}

const track = (band: Locator) => band.locator("[data-rail-track]");
const left = (band: Locator) => track(band).evaluate((node) => node.scrollLeft);
/** How far the rail is from resting on card `count`, in pixels. */
const off = async (band: Locator, count: number, step: number) =>
  Math.abs((await left(band)) - count * step);

test("the plugin band comes straight after the agents row, and the surfaces after Mashy", async ({
  page,
}) => {
  await page.goto("/");
  const order = await page
    .locator(".mash-welcome > *")
    .evaluateAll((nodes) => nodes.slice(0, 6).map((node) => node.id || node.className));
  expect(order[0]).toContain("mash-agents");
  expect(order.slice(1)).toEqual([
    "welcome-plugin",
    "welcome-shortcuts",
    "welcome-mashy",
    "welcome-surfaces",
    "welcome-speed",
  ]);
  // Each card's words come under its picture, one line of them.
  const card = page.locator("#welcome-plugin [data-flow-card]").first();
  const [picture, words] = [
    await card.locator(".flow-picture").boundingBox(),
    await card.locator(".flow-foot").boundingBox(),
  ];
  expect(words?.y).toBeGreaterThanOrEqual((picture?.y ?? 0) + (picture?.height ?? 0));
  for (const says of await page.locator("#welcome-plugin .flow-says").all()) {
    const lines = await says.evaluate(
      (node) =>
        node.getBoundingClientRect().height / Number.parseFloat(getComputedStyle(node).lineHeight),
    );
    expect(Math.round(lines)).toBe(1);
  }
  const band = page.locator("#welcome-plugin");
  await expect(band.getByRole("heading", { level: 2 })).toHaveText(
    "Start in one agent. Finish in another.",
  );
  await expect(band.getByRole("list", { name: /step by step/ }).locator(".flow-head b")).toHaveText(
    steps,
  );
  await expect(band.locator(".rail-foot a")).toHaveAttribute("href", "/plugin/");
});

test("the steps rail snaps to its cards, shows the next one at the edge, and its buttons step a card", async ({
  page,
}) => {
  await page.setViewportSize(phone);
  const band = await open(page);
  const cards = track(band).getByRole("listitem");
  const [first, second] = [await cards.nth(0).boundingBox(), await cards.nth(1).boundingBox()];
  if (!first || !second) throw new Error("The rail has no cards");
  expect(first.x).toBe(16);
  expect(second.x).toBeLessThan(phone.width - 24);
  expect(second.x + second.width).toBeGreaterThan(phone.width);
  await expect(track(band)).toHaveCSS("scroll-snap-type", "x mandatory");
  const step = second.x - first.x;
  const previous = band.getByRole("button", { name: /^Previous/ });
  const next = band.getByRole("button", { name: /^Next/ });
  await expect(previous).toBeDisabled();
  await next.click();
  await expect.poll(() => off(band, 1, step)).toBeLessThan(2);
  await next.click();
  await expect.poll(() => off(band, 2, step)).toBeLessThan(2);
  await previous.click();
  await expect.poll(() => off(band, 1, step)).toBeLessThan(2);
  // The arrow keys step a card while the rail has the focus.
  await track(band).evaluate((node) => node.scrollTo({ left: 0, behavior: "instant" }));
  await track(band).focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => off(band, 1, step)).toBeLessThan(2);
  // At the far end there is no further to go.
  await track(band).evaluate((node) =>
    node.scrollTo({ left: node.scrollWidth, behavior: "instant" }),
  );
  await expect(next).toBeDisabled();
  for (const button of [previous, next]) {
    const box = await button.boundingBox();
    expect(Math.min(box?.width ?? 0, box?.height ?? 0)).toBeGreaterThanOrEqual(44);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(phone.width);
});

test("a card's picture plays in once the card is on screen", async ({ page }) => {
  await page.setViewportSize(phone);
  const band = await open(page);
  const cards = track(band).getByRole("listitem");
  await expect(cards.nth(0)).toHaveClass(/\bseen\b/);
  await expect(cards.nth(3)).not.toHaveClass(/\bseen\b/);
  await expect(cards.nth(3).locator("[data-in]").first()).toHaveCSS("opacity", "0");
  await track(band).evaluate((node) =>
    node.scrollTo({ left: node.scrollWidth, behavior: "instant" }),
  );
  await expect(cards.nth(3)).toHaveClass(/\bseen\b/);
  await expect(cards.nth(3).locator("[data-in]").last()).toHaveCSS("opacity", "1");
});

test("without scripting every step and its picture shows, and the rail scrolls by itself", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: phone });
  const page = await context.newPage();
  await page.goto("/");
  const band = page.locator("#welcome-plugin");
  await expect(band.locator("[data-rail-go]")).toBeHidden();
  for (const part of await band.locator("[data-in]").all())
    await expect(part).toHaveCSS("opacity", "1");
  expect(await track(band).evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(phone.width);
  await context.close();
});
