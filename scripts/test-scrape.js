const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Opening JD search...');
  await page.goto('https://search.jd.com/Search?keyword=iPhone&enc=utf-8', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(3000);
  
  const itemCount = await page.locator('.gl-item').count();
  console.log('Found items:', itemCount);
  
  if (itemCount > 0) {
    const first = page.locator('.gl-item').first();
    const title = await first.locator('.p-name a em').textContent().catch(() => 'N/A');
    const price = await first.locator('.p-price strong i').textContent().catch(() => 'N/A');
    const shop = await first.locator('.p-shop a').textContent().catch(() => 'N/A');
    console.log('Title:', title);
    console.log('Price:', price);
    console.log('Shop:', shop);
  } else {
    // 尝试其他选择器
    const html = await page.content();
    console.log('Page title:', await page.title());
    console.log('HTML length:', html.length);
    console.log('Has gl-item:', html.includes('gl-item'));
    console.log('Has J-goods-list:', html.includes('J-goods-list'));
  }
  
  await browser.close();
}

test().catch(console.error);
