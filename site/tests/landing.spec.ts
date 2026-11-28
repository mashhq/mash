import { expect, type Locator, type Page, test } from "@playwright/test";
import { ferrisOrange, raycastLink } from "../src/brand.ts";

const agents = ["Claude Code", "Codex", "GitHub Copilot", "Cursor", "OpenCode", "Antigravity"];

test("the landing page says what Mash is and which agents it reads", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("Your agents forget. Mash doesn’t.");
  await expect(page).toHaveTitle("Mash: Supercharged context for your agents.");
  const marks = page.locator(".mash-agents li");
  await expect(marks).toHaveCount(agents.length);
  await expect(marks).toHaveText(agents);
  // Every mark is drawn: each tile holds its agent's logo.
  for (const mark of await page.locator(".mash-agents .tile").all()) {
    await expect(mark.locator("svg path").first()).toBeAttached();
  }
  const blurb =
    "Mash supercharges your agents so that they can search and remember from each others' chats. 100% self-hosted and open-source.";
  await expect(page.locator(".hero .tagline")).toHaveText(`${blurb} Read the docs →`);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", blurb);
  // Link previews carry the tagline.
  const tagline = "Supercharged context for your agents.";
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", tagline);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    `Mash: ${tagline}`,
  );
  await expect(page.locator(".hero .actions a:visible")).toHaveText([
    /^\s*Download for \w+$/,
    "Raycast extension",
    "Try the demo",
  ]);
  await expect(page.locator(".mash-welcome h2")).toHaveText([
    "Start in one agent. Finish in another.",
    "Take shortcuts, not detours.",
    "Meet Mashy. Ask him anything about your chats.",
    "One history. Everywhere you work.",
    "Fast, and light on your machine.",
    "Self-hosted, end to end. No cloud. No account.",
    "Written with <3 in Rust.",
    "Give your agents their history back.",
  ]);
  // A heading is a short claim; the sentence that explains one is a paragraph
  // under it, with the keys it names as keycaps.
  const shortcut = page.locator("#welcome-shortcuts .head p");
  await expect(shortcut).toHaveText(
    "Press ⌥ ⇧ Space and the chat you need is one line away, found by its exact words or, with local models, by what it meant.",
  );
  await expect(shortcut.locator("kbd")).toHaveText(["⌥", "⇧", "Space"]);
  // No band lists what it does.
  await expect(page.locator(".mash-welcome .words :is(ul, ol)")).toHaveCount(0);
  // So does the privacy band: one paragraph with the caveat about backups, then the way onward.
  const privacy = page.locator("#welcome-privacy");
  await expect(privacy.locator("h2")).toHaveText("Self-hosted, end to end. No cloud. No account.");
  await expect(privacy.locator(".blurb")).toHaveText(
    "Indexing and search run on your machine, and work offline once the local search service is running. Sharing, remote workers and Mashy stay off until you turn each one on, and search across machines goes through a Mash server you run. Mash masks common keys and tokens in results and outgoing shared history by default, though backups can still contain sensitive text.",
  );
  await expect(privacy.getByRole("link", { name: "search across machines" })).toHaveAttribute(
    "href",
    "/search-across-machines/",
  );
  await expect(privacy.locator(".blurb + a")).toHaveText("How Mash handles your history ›");
  await expect(privacy.locator(".blurb + a")).toHaveAttribute("href", "/privacy/");
  await expect(privacy.locator(":is(ul, ol, h3, svg)")).toHaveCount(0);
  // The windows are drawn in HTML, each one image named for what it shows.
  const illustrations = page.locator(".mash-welcome [role=img]");
  // Five of them are the showcase's surfaces, of which one shows at a time.
  await expect(illustrations).toHaveCount(7);
  for (const illustration of await illustrations.all()) {
    await expect(illustration).toHaveAttribute("aria-label", /\w/);
  }
  await page.locator(".mash-agents").scrollIntoViewIfNeeded();
  for (const mark of await marks.all()) await expect(mark).toBeVisible();
  // The conditions behind the figures are folded away, and open on request.
  const measured = page.locator(".mash-welcome .measured");
  await expect(measured.locator("p")).toBeHidden();
  await measured.locator("summary").click();
  await expect(measured.locator("dt")).toHaveText(["66 ms and 103k", "5× and 9×"]);
  await expect(measured.locator("p")).toContainText("experimental and off until you");
  await expect(page.getByRole("navigation", { name: "Footer" }).getByRole("link")).toHaveText([
    "Docs",
    "Try the demo",
    "Privacy",
    "Get help",
    "GitHub",
  ]);
});

test("the landing page fits a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("the hero leads with the app download, then the other systems and ways in", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  // A Linux x86-64 browser here, so the download is the Linux app.
  const download = page.locator(".hero .actions a:visible").first();
  await expect(download).toHaveText(/Download for (Linux|Mac|Windows)/);
  await expect(download).toHaveAttribute(
    "href",
    /^https:\/\/github\.com\/mashhq\/mash\/releases\/latest\/download\/mash-desktop-/,
  );
  // "Also on" names the two other systems and leads to every download.
  const note = page.locator(".hero .download-note");
  const also = note.locator("a[data-also]");
  await expect(also).toHaveAttribute("href", "/downloads/#desktop-app");
  await expect(also).toHaveText(/^(macOS|Windows) and\s+(Windows|Linux)$/, {
    useInnerText: true,
  });
  // The Raycast extension and the demo are buttons of their own beside the
  // download, in that order and the same height. Raycast's shows on every
  // system, this Linux one included: it says Mash has an extension.
  const raycast = page.locator(".hero .actions a:visible").nth(1);
  await expect(raycast).toHaveText("Raycast extension");
  await expect(raycast).toHaveAttribute("href", raycastLink);
  await expect(raycast.locator("svg")).toBeVisible();
  const demo = page.locator(".hero .actions a:visible").nth(2);
  await expect(demo).toHaveText("Try the demo");
  await expect(demo).toHaveAttribute("href", "/demo/");
  await expect(demo.locator("svg")).toBeVisible();
  const boxes = [
    await download.boundingBox(),
    await raycast.boundingBox(),
    await demo.boundingBox(),
  ];
  for (const [index, box] of boxes.entries()) {
    expect(box?.height).toBe(boxes[0]?.height);
    expect(box?.y).toBe(boxes[0]?.y);
    if (index > 0) {
      const before = boxes[index - 1];
      expect(box?.x).toBeGreaterThan((before?.x ?? 0) + (before?.width ?? 0));
    }
  }
  // The docs follow the opening paragraph as its last words, in bold.
  const docs = page.locator(".hero .tagline a.docs");
  await expect(docs).toHaveText("Read the docs →");
  await expect(docs).toHaveAttribute("href", "/guides/");
  expect(
    Number(await docs.evaluate((link) => getComputedStyle(link).fontWeight)),
  ).toBeGreaterThanOrEqual(600);
  // The terminal install is the one quieter way in.
  await expect(note.locator(".ways a")).toHaveText(["Install with curl"]);
  await expect(note.locator(".ways a").first()).toHaveAttribute(
    "href",
    "/quick-start/#install-it-yourself",
  );
  // The terminal install is in the docs, not on this page.
  await expect(page.locator("#install")).toHaveCount(0);
  // The header offers the Mac app beside the docs and the source.
  const header = page.locator("header.header");
  await expect(
    header.getByRole("link", { name: /^Download for (Mac|Windows|Linux)$/ }),
  ).toBeVisible();
  await expect(header.getByRole("link", { name: "Docs", exact: true })).toBeVisible();
  await expect(header.getByRole("link", { name: "GitHub", exact: true })).toBeVisible();
});

test("on a phone the landing header is the logo alone, and the hero's buttons stack", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const header = page.locator("header.header");
  await expect(header.locator("a.brand")).toBeVisible();
  // No menu button and no links: the hero and the footer lead to the docs.
  await expect(header.locator(".mash-menu, .sl-menu-button")).toHaveCount(0);
  await expect(header.getByRole("link")).toHaveCount(1);
  await expect(header.getByRole("button")).toHaveCount(0);
  const buttons = page.locator(".hero .actions a:visible");
  await expect(buttons).toHaveText([
    /Download for (Linux|Mac|Windows)|Download/,
    "Raycast extension",
    "Try the demo",
  ]);
  const stacked = await Promise.all([0, 1, 2].map((index) => buttons.nth(index).boundingBox()));
  const first = stacked[0];
  for (const [index, box] of stacked.entries()) {
    expect(box?.x).toBe(first?.x);
    expect(box?.width).toBe(first?.width);
    expect(box?.height).toBe(first?.height);
    if (index > 0) {
      const before = stacked[index - 1];
      expect(box?.y).toBeGreaterThan((before?.y ?? 0) + (before?.height ?? 0));
    }
  }
  expect(first?.width).toBeGreaterThan(300);
  await expect(page.locator(".hero .tagline a.docs")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Footer" }).getByRole("link", { name: "Docs" }),
  ).toHaveAttribute("href", "/guides/");
});

for (const [name, viewport, columns] of [
  ["a phone", { width: 390, height: 844 }, 2],
  ["a wide screen", { width: 1440, height: 900 }, 4],
] as const) {
  test(`on ${name} the performance band shows its four figures, ${columns} to a row`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const band = page.getByRole("region", { name: "Fast, and light on your machine." });
    const figures = band.locator(".stats > div");
    await expect(figures.locator("dd")).toHaveText([
      "for an exact-phrase search, at its quickest",
      "messages from 1,137 chats, searched in one index on one machine",
      "embedding throughput on a Windows GPU",
      "embedding throughput with an experimental NVIDIA worker",
    ]);
    await expect(figures.locator("dt")).toHaveText(["66 ms", "103k", "5×", "9×"]);
    await expect(figures.locator(".ico svg")).toHaveCount(4);
    // Cards of one width in rows that fill the band, and no card wider than its text allows.
    const boxes = await figures.evaluateAll((all) =>
      all.map((figure) => figure.getBoundingClientRect().toJSON()),
    );
    const row = await band.locator(".stats").boundingBox();
    expect(new Set(boxes.map((box) => Math.round(box.y))).size).toBe(4 / columns);
    for (const box of boxes) expect(box.width).toBeCloseTo(boxes[0].width, 0);
    expect(boxes[0].x).toBeCloseTo(row?.x ?? -1, 0);
    const last = boxes[columns - 1];
    expect(last.x + last.width).toBeCloseTo((row?.x ?? 0) + (row?.width ?? 0), 0);
    for (const figure of await figures.all())
      expect(await figure.evaluate((card) => card.scrollWidth <= card.clientWidth)).toBe(true);
    // What the figures were measured on, the GPU ones included.
    await band.locator(".measured summary").click();
    await expect(band.locator(".measurement-copy dt")).toHaveText(["66 ms and 103k", "5× and 9×"]);
  });
}

test("a Homebrew visitor can review the package source and see what to do next", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/install-methods/#install-with-a-package-manager");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole("link", { name: "MashHQ’s Homebrew formula" })).toHaveAttribute(
    "href",
    "https://github.com/mashhq/homebrew-tap/blob/main/Formula/mash.rb",
  );
  await expect(
    page.getByRole("link", { name: "see which installers passed for each release" }),
  ).toBeVisible();
});

test("the quick start offers a prompt that hands setup to a coding agent", async ({
  page,
  request,
}) => {
  await page.goto("/quick-start/");
  await expect(page.locator(".sl-markdown-content")).toContainText(
    "Read https://getmash.io/setup.md and set up Mash on this machine.",
  );
  // The file the prompt names is published as plain Markdown.
  const setup = await request.get("/setup.md");
  expect(setup.ok()).toBe(true);
  const instructions = await setup.text();
  expect(instructions).toContain(
    "To search on your own from the dashboard or terminal:\n\n```sh\nmash init --yes --no-agents\n```",
  );
  expect(instructions).toContain("https://getmash.io/install-methods/#include-the-web-dashboard");
  expect(instructions).toContain("With only the terminal and agent tools, show them");
  expect(instructions).toContain("unless the person asked you to run their");
  expect(instructions).toContain("`configuration.index.destination` set to `both`");
  expect(instructions).toMatch(
    /Proceed with\s+indexing only if they choose to use that destination/,
  );
  expect(instructions).toContain("If it is `rejected`, use `local_qdrant.message`");
});

test("visitors can inspect the installer and read about privacy before setup", async ({ page }) => {
  await page.goto("/quick-start/");
  await page.getByRole("link", { name: "how to verify the download", exact: true }).click();
  await expect(page).toHaveURL("/downloads/#verify-the-checksum");
  await page.getByRole("link", { name: "inspect the script", exact: true }).click();
  await expect(page).toHaveURL(/\/downloads\/#inspect-the-installer$/);
  await expect(page.getByRole("heading", { name: "Inspect the installer" })).toBeInViewport();
  await expect(page.getByRole("link", { name: "public release workflow" })).toBeVisible();

  await page.goto("/quick-start/");
  await page.getByRole("link", { name: "local trial guide", exact: true }).click();
  await expect(page).toHaveURL("/privacy/#try-a-small-local-setup");
  await expect(page.getByRole("heading", { name: "Try a small local setup" })).toBeVisible();
  const range = page.getByRole("listitem").filter({ hasText: "another number of days" });
  await expect(range.getByText("7", { exact: true })).toBeVisible();
  await expect(range).toContainText("can contain older messages");
  await expect(page.getByText("no agents", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "quick start installer" })).toHaveAttribute(
    "href",
    "/quick-start/#install-it-yourself",
  );
  await page.getByRole("link", { name: "See what uninstall removes", exact: true }).last().click();
  await expect(page).toHaveURL(/\/uninstall\/$/);
  await expect(page.getByRole("heading", { name: "Uninstall Mash", exact: true })).toBeInViewport();
  await expect(page.getByRole("link", { name: "Keep Mash’s copy in place" })).toBeVisible();
});

test("each welcome band comes in as it scrolls into view, whatever the motion preference", async ({
  browser,
}) => {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    const context = await browser.newContext({ reducedMotion });
    const page = await context.newPage();
    await page.goto("/");
    const welcome = page.locator(".mash-welcome");
    await expect(welcome).toHaveClass(/\breveal\b/);
    const band = page.locator("#welcome-rust [data-reveal]");
    const opacity = () => band.evaluate((node) => getComputedStyle(node).opacity);
    expect(await opacity()).toBe("0");
    await band.scrollIntoViewIfNeeded();
    await expect(band).toHaveClass(/\bshown\b/);
    await expect.poll(opacity).toBe("1");
    // Once in, the band is the stylesheet's again.
    await expect.poll(() => band.getAttribute("style")).toBeFalsy();
    await context.close();
  }
});

test("the stroke under the headline is the brand's own butter, even on a light system", async ({
  browser,
}) => {
  const context = await browser.newContext({ colorScheme: "light" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".mash-hero h1 svg.rule")).toHaveCSS("fill", "rgb(245, 200, 75)");
  await context.close();
});

for (const [name, viewport] of [
  ["a wide screen", { width: 1440, height: 900 }],
  ["a phone", { width: 390, height: 844 }],
] as const) {
  test(`on ${name} a stroke of butter is drawn under the headline's last line alone, as wide as its words`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const hero = page.locator(".mash-hero");
    const lines = hero.locator("h1 > span");
    await expect(hero.locator("h1")).toHaveText("Your agents forget. Mash doesn’t.");
    await expect(lines).toHaveCount(2);
    await expect(lines.nth(0).locator("svg")).toHaveCount(0);
    await expect(hero.locator("h1 svg")).toHaveCount(1);
    const rule = lines.nth(1).locator(".accent svg.rule");
    // Once the entrance has played the stroke is whole, and the stylesheet's again.
    await expect(page.locator(".mash-welcome")).toHaveClass(/\breveal\b/);
    await expect(hero).not.toHaveAttribute("data-motion");
    const draw = rule.locator(".draw");
    await expect.poll(() => draw.getAttribute("style")).toBeFalsy();
    await expect(draw).toHaveCSS("stroke-dashoffset", "0px");
    await expect(rule).toBeVisible();
    // The stroke is the brand's butter, which stands out on the dark page
    // (at least 3:1); the words keep the heading's colour.
    await expect(rule).toHaveCSS("fill", "rgb(245, 200, 75)");
    const contrast = await rule.evaluate((stroke) => {
      const light = (colour: string) => {
        const [r = 0, g = 0, b = 0] = (colour.match(/[\d.]+/g) ?? []).map((part) => {
          const channel = Number(part) / 255;
          return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const [page, line] = [
        light(getComputedStyle(document.body).backgroundColor),
        light(getComputedStyle(stroke).fill),
      ];
      return (Math.max(page, line) + 0.05) / (Math.min(page, line) + 0.05);
    });
    expect(contrast).toBeGreaterThanOrEqual(3);
    // The claim's words run from the mash's cream to the butter's yellow.
    await expect(lines.nth(1).locator(".accent")).toHaveCSS(
      "background-image",
      "linear-gradient(90deg, rgb(255, 241, 208), rgb(245, 200, 75))",
    );
    await expect(lines.nth(1).locator(".accent")).toHaveCSS("background-clip", "text");
    await expect(lines.nth(1).locator(".accent")).toHaveCSS("color", "rgba(0, 0, 0, 0)");
    const at = await lines
      .nth(1)
      .locator(".accent")
      .evaluate((accent) => {
        const words = document.createRange();
        words.selectNodeContents(accent);
        const box = (rect: DOMRect) => ({
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        });
        const stroke = accent.querySelector("svg > path");
        const tagline = document.querySelector(".hero .tagline");
        if (!stroke || !tagline) throw new Error("the stroke or the tagline is missing");
        return {
          words: box(words.getBoundingClientRect()),
          stroke: box(stroke.getBoundingClientRect()),
          size: Number.parseFloat(getComputedStyle(accent).fontSize),
          tagline: tagline.getBoundingClientRect().top,
        };
      });
    // The words are on one line, and the stroke runs from their first edge to their last.
    expect(at.words.bottom - at.words.top).toBeLessThan(1.5 * at.size);
    expect(Math.abs(at.stroke.left - at.words.left)).toBeLessThan(4);
    expect(Math.abs(at.stroke.right - at.words.right)).toBeLessThan(4);
    // It lies under the letters, clear of the paragraph below.
    expect(at.stroke.top).toBeGreaterThan(at.words.top + 0.7 * at.size);
    expect(at.stroke.bottom).toBeLessThan(at.tagline);
  });
}

/** Scrolls to the bottom in small steps, as a reader would, so every scene plays. */
async function scrollThrough(page: Page): Promise<void> {
  for (;;) {
    const left = await page.evaluate(
      () => document.documentElement.scrollHeight - innerHeight - scrollY,
    );
    if (left <= 1) break;
    await page.mouse.wheel(0, 240);
    await page.waitForTimeout(60);
  }
}

for (const [name, viewport] of [
  ["a wide screen", { width: 1440, height: 900 }],
  ["a phone", { width: 390, height: 844 }],
] as const) {
  test(`on ${name} every scene ends as the page is served, and nothing changes place`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const hero = page.locator(".mash-hero");
    await expect(page.locator(".mash-welcome")).toHaveClass(/\breveal\b/);
    await expect(hero).not.toHaveAttribute("data-motion");
    for (const line of await hero.locator("h1 span").all())
      await expect(line).toHaveCSS("opacity", "1");
    await expect(hero.locator(".actions")).toHaveCSS("opacity", "1");
    // Count layout shifts from here on: the scenes themselves must add none.
    await page.evaluate(() => {
      const seen = { shift: 0 };
      Object.assign(window, { mashShift: seen });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        })[])
          if (!entry.hadRecentInput) seen.shift += entry.value;
      }).observe({ type: "layout-shift" });
    });
    const height = () => page.evaluate(() => document.documentElement.scrollHeight);
    const before = await height();
    await scrollThrough(page);

    const welcome = page.locator(".mash-welcome");
    // Quick search: the whole query, every result, and the selection two rows down.
    await expect(welcome.locator("#welcome-shortcuts .quick-q b")).toHaveText("refresh token");
    await expect(welcome.locator("#welcome-shortcuts .quick li")).toHaveCount(5);
    for (const row of await welcome.locator("#welcome-shortcuts .quick li").all())
      await expect(row).toHaveCSS("opacity", "1");
    const rows = await welcome
      .locator("#welcome-shortcuts .quick li")
      .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().top));
    await expect
      .poll(() =>
        welcome
          .locator("#welcome-shortcuts .quick-sel")
          .evaluate((node) => node.getBoundingClientRect().top),
      )
      .toBeCloseTo(rows[2] ?? 0, 0);
    // Ferris: every stroke drawn, and the stylesheet's again.
    const crab = welcome.locator("#welcome-rust svg.ferris");
    await expect(crab).toBeVisible();
    for (const stroke of await crab.locator("path").all()) {
      await expect.poll(() => stroke.getAttribute("style")).toBeFalsy();
      await expect(stroke).toHaveCSS("opacity", "1");
      await expect(stroke).toHaveCSS("stroke-dasharray", "none");
    }
    // The agents, the figures, Mashy's first answer and the closing card.
    for (const agent of await welcome.locator(".mash-agents li").all())
      await expect(agent).toHaveCSS("opacity", "1");
    await expect(welcome.locator(".stats dt b")).toHaveText(["66", "103", "5", "9"]);
    await expect(welcome.locator('.example[data-example="1"] .answer p').first()).toHaveText(
      "A database migration locked the orders table for about four minutes. Claude Code described the lock on the build box:",
    );
    for (const part of await welcome.locator(".closing > *").all())
      await expect(part).toHaveCSS("opacity", "1");
    // Nothing is left part of the way in.
    await expect
      .poll(() =>
        page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>(".mash-hero *, .mash-welcome [data-reveal]")]
            .filter((node) => node.style.opacity !== "" && node.style.opacity !== "1")
            .map((node) => node.className),
        ),
      )
      .toEqual([]);
    expect(
      await page.evaluate(
        () => (window as unknown as { mashShift: { shift: number } }).mashShift.shift,
      ),
    ).toBeLessThan(0.001);
    // Only the pinned panel adds to the page, and only on a wide screen.
    expect(await height()).toBe(before);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });
}

test("the pinned search panel holds for a screen and a half, then lets the page go on", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator(".mash-welcome")).toHaveClass(/\breveal\b/);
  const desk = page.locator("#welcome-shortcuts .desk");
  const field = page.locator("#welcome-shortcuts .quick-q b");
  const top = () => desk.evaluate((node) => Math.round(node.getBoundingClientRect().top));
  // Before the pin the field waits empty; in it the page stays put while the search types.
  await expect(field).toHaveText("Search every chat");
  const start = await desk.evaluate(
    (node) => node.getBoundingClientRect().top + scrollY - innerHeight * 0.12,
  );
  await page.evaluate((y) => scrollTo(0, y + 300), start);
  await expect.poll(top).toBe(108);
  await expect(field).toHaveText(/^refresh t?o?$/);
  await page.evaluate((y) => scrollTo(0, y + 1000), start);
  await expect.poll(top).toBe(108);
  await expect(field).toHaveText("refresh token");
  // Past a screen and a half the panel scrolls away and the next band arrives.
  await page.evaluate((y) => scrollTo(0, y + 1350 + 400), start);
  await expect.poll(top).toBe(108 - 400);
  await page.locator("#welcome-mashy").scrollIntoViewIfNeeded();
  await expect(page.locator("#welcome-mashy .mashy-window")).toBeInViewport();
  // Scrolling back up runs it backwards.
  await page.evaluate((y) => scrollTo(0, y - 200), start);
  await expect(field).toHaveText("Search every chat");
});

test("links into the page land on their target with the pinned panel above it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const id of ["welcome-plugin", "welcome-mashy"]) {
    await page.goto(`/#${id}`);
    await expect(page.locator(".mash-welcome")).toHaveClass(/\breveal\b/);
    await expect(page.locator(`#${id}`)).toBeInViewport();
    const top = await page.locator(`#${id}`).evaluate((node) => node.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(0);
    expect(top).toBeLessThan(200);
  }
  // A link followed on the page itself gets there too.
  await page.goto("/");
  await expect(page.locator(".mash-welcome")).toHaveClass(/\breveal\b/);
  await page.locator(".hero .ways").getByRole("link", { name: "Install with curl" }).click();
  await expect(page).toHaveURL("/quick-start/#install-it-yourself");
  await expect(page.locator("#install-it-yourself")).toBeInViewport();
});

test("the welcome page shows everything without scripting", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  const welcome = page.locator(".mash-welcome");
  // The showcase's surfaces aside (surfaces.spec.ts): one of those shows at a time.
  const windows = welcome.locator("[role=img]:not(.picture)");
  await expect(windows).toHaveCount(2);
  await expect(windows.nth(1)).toHaveAccessibleName(/Three example questions/);
  await expect(welcome.locator(".ico svg").first()).toBeVisible();
  for (const picture of await windows.all()) await expect(picture).toBeVisible();
  const mashy = welcome.locator("img.mashy-face");
  await expect
    .poll(() => mashy.evaluate((img: HTMLImageElement) => img.naturalHeight))
    .toBeGreaterThan(0);
  // Nothing waits for the motion: the hero is unmarked and every scene is in its final state.
  await expect(page.locator(".mash-hero")).not.toHaveAttribute("data-motion");
  for (const part of await page
    .locator(".hero :is(h1 span, .tagline, .actions, .download-note)")
    .all()) {
    await expect(part).toBeVisible();
    await expect(part).toHaveCSS("opacity", "1");
  }
  // The stroke under the headline's last line is served whole.
  const stroke = page.locator(".hero h1 > span").nth(1).locator("svg.rule");
  await expect(stroke).toBeVisible();
  await expect(stroke.locator(".draw")).toHaveCSS("stroke-dashoffset", "0px");
  await expect(welcome.locator("#welcome-shortcuts .quick-q b")).toHaveText("refresh token");
  await expect(welcome.locator("#welcome-shortcuts .quick li.on")).toHaveCount(1);
  for (const part of await welcome
    .locator("#welcome-shortcuts .quick li, .mash-agents li, .stats > div, .closing > *")
    .all()) {
    await expect(part).toBeVisible();
    await expect(part).toHaveCSS("opacity", "1");
  }
  await expect(welcome.locator(".stats dt b")).toHaveText(["66", "103", "5", "9"]);
  // Ferris is served drawn: no stroke waits on a script.
  const crab = welcome.locator("#welcome-rust svg.ferris");
  await expect(crab).toBeVisible();
  await expect(crab.locator("path")).toHaveCount(9);
  for (const stroke of await crab.locator("path").all()) {
    await expect(stroke).toHaveCSS("opacity", "1");
    await expect(stroke).toHaveCSS("stroke-dasharray", "none");
  }
  // The app icon is drawn inline, over the headline and the closing call to action.
  await expect(page.locator(".hero .app-icon svg")).toBeVisible();
  await expect(welcome.locator(".closing .app-icon svg")).toBeVisible();
  await welcome.locator(".measured summary").click();
  await expect(
    welcome.locator(".measured").getByText("66 ms and 103k", { exact: true }),
  ).toBeVisible();
  // Without scripting the download button cannot tell the system, so it opens the downloads.
  await page.locator(".hero .actions").getByRole("link", { name: "Download for Mac" }).click();
  await expect(page).toHaveURL(/\/downloads\/#desktop-app$/);
  await expect(page.getByRole("heading", { name: "Desktop app" })).toBeVisible();
  await context.close();
});

test("the welcome page fits a phone in every section", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto("/");
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 2100) {
    await page.evaluate((to) => scrollTo(0, to), y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});

test("Ferris stands over the stack chips, which have logos, and the close offers two buttons", async ({
  page,
}) => {
  await page.goto("/");
  const welcome = page.locator(".mash-welcome");
  const built = welcome.locator(".built li");
  await expect(built).toHaveText(["Tauri", "Qdrant", "Tokio"]);
  for (const chip of await built.all()) await expect(chip.locator(".tile svg")).toBeAttached();
  // Ferris is decoration: hidden from assistive technology, in his own orange, above the chips.
  const crab = welcome.locator("#welcome-rust svg.ferris");
  await expect(crab).toHaveAttribute("aria-hidden", "true");
  const orange = "rgb(247, 76, 0)";
  expect(ferrisOrange).toBe("#f74c00");
  await expect(crab.locator("path[pathLength]").first()).toHaveCSS("stroke", orange);
  await expect(crab.locator(".dot").first()).toHaveCSS("fill", orange);
  const [crabBox, chipsBox] = [
    await crab.boundingBox(),
    await welcome.locator(".built").boundingBox(),
  ];
  expect(crabBox?.width).toBeGreaterThan(200);
  expect((crabBox?.y ?? 0) + (crabBox?.height ?? 0)).toBeLessThan(chipsBox?.y ?? 0);
  // The two closing actions are buttons of one size, each led by its icon.
  const actions = welcome.locator(".closing .actions a");
  await expect(actions).toHaveText(["Get started", "Read the docs"]);
  await expect(actions.locator("svg")).toHaveCount(2);
  const heights = await actions.evaluateAll((links) =>
    links.map((link) => link.getBoundingClientRect().height),
  );
  expect(heights[1]).toBe(heights[0]);
});

test("Mashy shows one example at a time, and the pager picks another", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const chat = page.locator("[data-mashy-chat]");
  const shown = chat.locator(".example.on .bubble");
  // With less motion the examples do not change by themselves.
  await expect(shown).toHaveText(["What caused the checkout outage last week?"]);
  await chat.getByRole("button", { name: "Show example 3 of 3" }).click();
  await expect(shown).toHaveText(["Did the payment retry change touch checkout?"]);
  await chat.getByRole("button", { name: "Next example" }).click();
  await expect(shown).toHaveText(["What caused the checkout outage last week?"]);
  await expect(chat.getByRole("button", { name: "Show example 1 of 3" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  // Every example shares the window, so changing one never moves the page.
  const heights = new Set<number>();
  for (const example of [1, 2, 3]) {
    await chat.getByRole("button", { name: `Show example ${example} of 3` }).click();
    heights.add(
      await chat.locator(".mashy-window").evaluate((w) => w.getBoundingClientRect().height),
    );
  }
  expect(heights.size).toBe(1);

  // The arrow keys go back and on while the pager has focus.
  await chat.getByRole("button", { name: "Show example 3 of 3" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(shown).toHaveText(["What was I working on yesterday?"]);
  await page.keyboard.press("ArrowRight");
  await expect(shown).toHaveText(["Did the payment retry change touch checkout?"]);
});

/** Mashy's examples as drawn now: which are in view, how far across and how solid, and the window's height. */
function examplesNow(carousel: Element) {
  const drawn = [...carousel.querySelectorAll<HTMLElement>(".example")].map((example) => {
    const style = getComputedStyle(example);
    return {
      example: example.dataset.example ?? "",
      inView: style.visibility === "visible" && Number(style.opacity) > 0,
      x: new DOMMatrix(style.transform).m41,
      opacity: Number(style.opacity),
      inline: example.style.cssText,
    };
  });
  const height = carousel.querySelector(".mashy-window")?.getBoundingClientRect().height ?? 0;
  return {
    inView: drawn.filter((one) => one.inView).map((one) => one.example),
    drawn: Object.fromEntries(drawn.map((one) => [one.example, one])),
    // To a tenth of a pixel: a browser's own arithmetic differs further down.
    height: Math.round(height * 10) / 10,
  };
}

test("Mashy's examples slide the way the change goes, one left in view at the end", async ({
  page,
}) => {
  // The landing page's motion plays for everyone, less motion preferred or not.
  await page.emulateMedia({ reducedMotion: "reduce" });
  // The test owns the clock, to stop a change part-way.
  await page.clock.install({ time: new Date("2026-11-20T12:00:00Z") });
  await page.goto("/");
  await expect(page.locator(".mash-welcome")).toHaveClass(/reveal/);
  const chat = page.locator("[data-mashy-chat]");
  await chat.scrollIntoViewIfNeeded();
  const shown = chat.locator(".example.on .bubble");
  await expect(shown).toHaveText(["What caused the checkout outage last week?"]);
  await page.clock.pauseAt(new Date("2026-11-20T12:10:00Z"));
  await page.clock.runFor(1000);
  const before = await chat.evaluate(examplesNow);
  expect(before.inView).toEqual(["1"]);

  // On to the next: part-way, the first is leaving to the left as the second
  // comes in from the right, both in view, and the window keeps its height.
  await chat.getByRole("button", { name: "Next example" }).click();
  await page.clock.runFor(150);
  const next = await chat.evaluate(examplesNow);
  expect(next.inView).toEqual(["1", "2"]);
  expect(next.drawn["1"]?.x).toBeLessThan(0);
  expect(next.drawn["2"]?.x).toBeGreaterThan(0);
  expect(next.drawn["1"]?.opacity).toBeLessThan(1);
  expect(next.drawn["2"]?.opacity).toBeLessThan(1);
  expect(next.height).toBe(before.height);
  // The pager's mark is already on the next.
  await expect(chat.getByRole("button", { name: "Show example 2 of 3" })).toHaveAttribute(
    "aria-current",
    "true",
  );
  // It is over within half a second, with nothing of the motion left behind.
  await page.clock.runFor(350);
  const settled = await chat.evaluate(examplesNow);
  expect(settled.inView).toEqual(["2"]);
  expect(Object.values(settled.drawn).map((one) => one.inline)).toEqual(["", "", ""]);
  expect(settled.height).toBe(before.height);
  await expect(shown).toHaveText(["What was I working on yesterday?"]);

  // Back again: the other way round.
  await chat.getByRole("button", { name: "Previous example" }).click();
  await page.clock.runFor(150);
  const back = await chat.evaluate(examplesNow);
  expect(back.inView).toEqual(["1", "2"]);
  expect(back.drawn["2"]?.x).toBeGreaterThan(0);
  expect(back.drawn["1"]?.x).toBeLessThan(0);
  await page.clock.runFor(350);
  expect((await chat.evaluate(examplesNow)).inView).toEqual(["1"]);

  // Quick presses do not pile up: never more than two in view, and one at the end.
  for (const expected of [
    ["1", "2"],
    ["2", "3"],
    ["1", "3"],
    ["1", "2"],
  ]) {
    await chat.getByRole("button", { name: "Next example" }).click();
    await page.clock.runFor(150);
    const quick = await chat.evaluate(examplesNow);
    expect(quick.inView).toEqual(expected);
    expect(quick.height).toBe(before.height);
  }
  await page.clock.runFor(350);
  const last = await chat.evaluate(examplesNow);
  expect(last.inView).toEqual(["2"]);
  expect(Object.values(last.drawn).map((one) => one.inline)).toEqual(["", "", ""]);
  // The page never scrolls sideways for it.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("a swipe across Mashy's window goes on to the next example, and back", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const chat = page.locator("[data-mashy-chat]");
  await chat.scrollIntoViewIfNeeded();
  const shown = chat.locator(".example.on .bubble");
  await expect(shown).toHaveText(["What caused the checkout outage last week?"]);
  // Not every browser lets a page make a real touch, so the events carry plain points.
  const swipe = (across: number, down: number) =>
    chat.locator(".mashy-window").evaluate(
      (target, [dx, dy]) => {
        const box = target.getBoundingClientRect();
        const from = { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 };
        const to = { clientX: from.clientX + (dx ?? 0), clientY: from.clientY + (dy ?? 0) };
        const touch = (type: string, touches: object[], changed: object) => {
          const event = new Event(type, { bubbles: true });
          Object.defineProperty(event, "touches", { value: touches });
          Object.defineProperty(event, "changedTouches", { value: [changed] });
          target.dispatchEvent(event);
        };
        touch("touchstart", [from], from);
        touch("touchend", [], to);
      },
      [across, down],
    );
  await swipe(-80, 6);
  await expect(shown).toHaveText(["What was I working on yesterday?"]);
  await swipe(80, -4);
  await expect(shown).toHaveText(["What caused the checkout outage last week?"]);
  // Scrolling the page down past it is not a swipe.
  await swipe(-50, 120);
  await expect(shown).toHaveText(["What caused the checkout outage last week?"]);
});
