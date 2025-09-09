const chromium = require('chrome-aws-lambda');
}


module.exports = async (req, res) => {
const query = (req.query.q || req.body?.q || '').trim();
if (!query) {
return res.status(400).json({ error: 'Missing query param `q` — item to search' });
}


let browser = null;
try {
const executablePath = await chromium.executablePath;
browser = await puppeteer.launch({
args: chromium.args,
executablePath,
headless: chromium.headless,
defaultViewport: { width: 1200, height: 800 },
});


const page = await browser.newPage();
const url = buildIcaSearchUrl(query);
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });


// Wait for product list — this selector might need tuning over time
await page.waitForSelector('[data-test=product-list] , .product-list, .product-item', { timeout: 10000 }).catch(() => {});


// Try to extract first product title, price and link
const product = await page.evaluate(() => {
// try several common selectors
const item = document.querySelector('.product-list__item, .product-item, [data-test=product-item]');
if (!item) return null;


// title
const titleEl = item.querySelector('.product-title, .title, h3, .product-name');
const title = titleEl ? titleEl.innerText.trim() : null;


// price
let priceText = null;
const priceEl = item.querySelector('.price, .product-price, .price__value');
if (priceEl) priceText = priceEl.innerText.trim();
else {
// try searching for numeric-ish strings
const maybe = item.innerText.match(/\d+[\s.,]?\d*\s*kr|\d+[\s.,]?\d*\s*SEK|\d+[\s.,]?\d*\s*kr\//i);
priceText = maybe ? maybe[0] : null;
}


// url
const linkEl = item.querySelector('a');
const url = linkEl ? linkEl.href : null;


return { title, priceText, url };
});


if (!product) {
await browser.close();
return res.status(404).json({ error: 'No product found — selectors may need updating' });
}


// Normalize price number (attempt)
let price = null;
if (product.priceText) {
const num = product.priceText.replace(/[^0-9,\.]/g, '').replace(',', '.');
const parsed = parseFloat(num);
if (!isNaN(parsed)) price = parsed;
}


await browser.close();


return res.json({
store: 'ICA',
query,
title: product.title,
priceRaw: product.priceText,
price,
url: product.url,
scrapedAt: new Date().toISOString(),
});
} catch (err) {
if (browser) try { await browser.close(); } catch (e) {}
console.error('Scrape error', err);
return res.status(500).json({ error: 'Scrape failed', details: err.message });
}
};
