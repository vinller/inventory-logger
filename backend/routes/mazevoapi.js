const express = require("express");
const puppeteer = require("puppeteer");
const axios = require("axios");
const router = express.Router();

const REPORT_URL =
  "https://west.mymazevo.com/dailyoperationsreportview?code=ZW9NSlBEM1pXNklLRXNuTDgyS3lwR3dqL21yLzJCanVLeFk5VVNjVDV4UG1Hb1ZiTHlLcVVCKzBrcHVyWkxsTkpNTmd1L3RvYWZ5blBwQk5kWWNMOCtjTEdOUWhWWnd6N0wyazdvcjV2cXlLMkhYeG9BRGR3d29xUHNhM3FSQW9Yckg4YkdYMTBZOWpUNkdzSGdiZXgvV1U5TmdSR0IvaVFEQm1VZTVZWmFVPQ";

router.get("/auto-fetch-events", async (req, res) => {
  let browser;
  try {
    console.log("🧠 Launching browser...");
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    console.log("🌐 Visiting page...");
    await page.goto(REPORT_URL, { waitUntil: "networkidle2" });

    const url = new URL(page.url());
    const tokenValue = url.searchParams.get("code");

    if (!tokenValue) {
      throw new Error("Token code not found in URL.");
    }

    console.log("🍪 Extracting cookies...");
    const cookies = await page.cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join("; ");

    console.log("📬 Submitting token to fetch events...");
    const response = await axios.post(
        "https://west.mymazevo.com/api/reports/GetPublishedDailyOperationsReportView",
        { value: tokenValue },
        {
          headers: {
            "Content-Type": "application/json",
            "Cookie": cookieHeader,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Referer": REPORT_URL,
            "Origin": "https://west.mymazevo.com"
          }
        }
      );
      

    await browser.close();
    console.log("✅ Event data retrieved.");
    res.status(200).json(response.data);
  } catch (err) {
    if (browser) await browser.close();
    console.error("❌ Failed to fetch dynamically:", err.message);
    if (err.response) {
      console.error("🔍 Status:", err.response.status);
      console.error("🔍 Response:", err.response.data);
    }
    res.status(500).json({ error: "Failed to auto-fetch events dynamically." });
  }
});

module.exports = router;
