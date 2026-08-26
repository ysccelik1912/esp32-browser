const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

let page;

async function initBrowser() {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 800, height: 480 });
    await page.goto('https://gemini.google.com');
}

app.get('/stream', async (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'multipart/x-mixed-replace; boundary=mjpegstream'
    });

    setInterval(async () => {
        if (page) {
            try {
                const screenshot = await page.screenshot({ type: 'jpeg', quality: 50 });
                res.write(`--mjpegstream\r\nContent-Type: image/jpeg\r\nContent-Length: ${screenshot.length}\r\n\r\n`);
                res.write(screenshot);
                res.write('\r\n');
            } catch (e) {}
        }
    }, 250);
});

app.get('/click', async (req, res) => {
    const { x, y } = req.query;
    if (page && x && y) {
        await page.mouse.click(parseInt(x), parseInt(y));
    }
    res.send('ok');
});

initBrowser();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));