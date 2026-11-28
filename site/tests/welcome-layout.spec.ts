import { expect, test } from "@playwright/test";

/** Where a band's window sits beside or under its heading. */
type Side = "left" | "right" | "below";
const placements: readonly (readonly [string, Side])[] = [
  ["mashy", "right"],
  ["mashy", "below"],
  ["privacy", "right"],
  ["privacy", "below"],
];
for (const [name, side] of placements) {
  const stacked = side === "below";
  const placement = stacked ? "below" : `${side} of`;
  test(`the ${name} window sits ${placement} its heading and points`, async ({ page }) => {
    await page.setViewportSize(
      stacked ? { width: 320, height: 568 } : { width: 1280, height: 850 },
    );
    await page.goto(`/#welcome-${name}`);
    await page.evaluate(() => document.fonts.ready);
    const band = page.locator(`#welcome-${name}`);
    const words = band.locator(".words");
    const picture = band.locator("[role=img]");
    await band.locator("[data-reveal]").scrollIntoViewIfNeeded();
    await expect(band.locator("[data-reveal]")).toHaveClass(/\bshown\b/);
    const wordsBox = await words.boundingBox();
    const pictureBox = await picture.boundingBox();
    if (!wordsBox || !pictureBox) throw new Error("Missing welcome band bounds");
    if (stacked) {
      expect(wordsBox.y + wordsBox.height).toBeLessThan(pictureBox.y);
      expect(pictureBox.x + pictureBox.width).toBeLessThanOrEqual(320);
    } else {
      const [first, second] = side === "left" ? [pictureBox, wordsBox] : [wordsBox, pictureBox];
      expect(first.x + first.width).toBeLessThan(second.x);
      expect(first.y).toBeLessThan(second.y + second.height);
      expect(second.y).toBeLessThan(first.y + first.height);
    }
  });
}
