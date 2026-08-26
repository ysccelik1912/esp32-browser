const path = require('path');
process.env.PUPPETEER_CACHE_DIR = path.join(__dirname, '.cache');

const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 10000;

let browser;
let page;

async function initBrowser() {
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    page = await browser.newPage();
    await page.setViewport({ width: 800, height: 480 });
    await page.goto('https://www.google.com');
    console.log('Browser initialized successfully!');
  } catch (err) {
    console.error('Failed to launch browser:', err);
  }
}

// 1. ESP32'ye canlı görüntü gönderir
app.get('/stream', async (req, res) => {
  if (!page) return res.status(500).send('Browser not ready');
  try {
    const screenshot = await page.screenshot({ type: 'jpeg', quality: 50 });
    res.contentType('image/jpeg');
    res.send(screenshot);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 2. ESP32'den gelen tıklamaları işler
app.get('/click', async (req, res) => {
  const { x, y } = req.query;
  if (page && x && y) {
    await page.mouse.click(parseInt(x), parseInt(y));
  }
  res.send('ok');
});

// 3. YENİ: ESP32'den gelen yeni linke gider (Örn: /navigate?url=https://youtube.com)
app.get('/navigate', async (req, res) => {
  const { url } = req.query;
  if (page && url) {
    try {
      // Eğer kullanıcı http/https yazmadıysa otomatik ekle
      let targetUrl = url.startsWith('http') ? url : 'https://' + url;
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      console.log(`Navigated to: ${targetUrl}`);
      res.send('navigated');
    } catch (err) {
      res.status(500).send('Error loading URL: ' + err.message);
    }
  } else {
    res.status(400).send('URL missing');
  }
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initBrowser();
});
