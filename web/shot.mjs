import { chromium } from "playwright";

const url = "http://localhost:4173/traderdaddy-bridge/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(600);

// Full page
await page.screenshot({ path: "../shot-full.png", fullPage: true });
// Hero + transform viewport
await page.screenshot({ path: "../shot-top.png" });

// Click through brokers to confirm transform updates
const pills = await page.$$("#pills .pill");
console.log("pills:", pills.length);
await pills[5].click(); // IBKR
await page.waitForTimeout(300);
await page.$eval("#transform", (el) => el.scrollIntoView());
await page.waitForTimeout(300);
await page.screenshot({ path: "../shot-ibkr.png" });

const canon = await page.$eval("#canon", (el) => el.textContent);
console.log("IBKR canon has AAPL:", canon.includes("AAPL"), "has 180:", canon.includes("180"));
console.log("console errors:", errors.length ? errors : "none");
await browser.close();
