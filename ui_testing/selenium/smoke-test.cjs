const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Builder, Browser, By, until } = require('selenium-webdriver');
const edge = require('selenium-webdriver/edge');

const baseUrl = (process.env.FINORA_BASE_URL || 'http://localhost:5173').replace(/\/$/, '');
const unique = Date.now();
const testEmail = 'finora-selenium-' + unique + '-' + randomUUID() + '@example.com';
const testDescription = `Finora Selenium smoke ${unique}`;
const testPassword = randomUUID() + 'A1!';

async function visibleText(driver, locator, timeout = 15000) {
  const element = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(element), timeout);
  return element.getText();
}

(async () => {
  const options = new edge.Options();
  options.addArguments('--window-size=1440,1000');
  if (process.env.HEADLESS === '1') {
    options.addArguments('--headless=new');
  }

  const driver = await new Builder()
    .forBrowser(Browser.EDGE)
    .setChromeOptions(options)
    .build();

  try {
    await driver.manage().setTimeouts({ implicit: 0, pageLoad: 20000, script: 10000 });

    // Register creates a disposable test user and signs it in automatically.
    await driver.get(`${baseUrl}/register`);
    await driver.wait(until.elementLocated(By.css('input:not([type])')), 10000);
    await driver.findElement(By.css('input:not([type])')).sendKeys('Finora Selenium QA');
    await driver.findElement(By.css('input[type="email"]')).sendKeys(testEmail);
    await driver.findElement(By.css('input[type="password"]')).sendKeys(testPassword);
    await driver.findElement(By.css('select')).sendKeys('LKR');
    await driver.findElement(By.css('button[type="submit"]')).click();

    await visibleText(driver, By.xpath("//h1[contains(normalize-space(.), 'Welcome back')]"));
    console.log('PASS: registration and authenticated dashboard');

    await driver.findElement(By.linkText('Transactions')).click();
    await visibleText(driver, By.xpath("//h2[normalize-space()='Add Transaction']"));

    await driver.findElement(By.xpath("//form//button[normalize-space()='income']")).click();
    await driver.findElement(By.xpath("//label[normalize-space()='Amount']/following-sibling::input")).sendKeys('100');
    await driver.findElement(By.xpath("//label[normalize-space()='Category']/following-sibling::select")).sendKeys('Salary');
    await driver.findElement(By.xpath("//label[normalize-space()='Account']/following-sibling::select")).sendKeys('Cash');
    await driver.findElement(By.xpath("//label[normalize-space()='Description']/following-sibling::input")).sendKeys(testDescription);
    await driver.findElement(By.css('form button[type="submit"]')).click();

    const row = By.xpath(`//tr[td[contains(normalize-space(.), "${testDescription}")]]`);
    await visibleText(driver, row);
    console.log('PASS: income transaction saved and listed');

    await driver.findElement(By.linkText('Dashboard')).click();
    await visibleText(driver, By.xpath("//h1[contains(normalize-space(.), 'Welcome back')]"));
    const balance = await driver.wait(async () => {
      const values = await driver.findElements(By.xpath("//div[div[normalize-space()='Total Balance']]/div[2]"));
      if (!values.length) return false;
      const value = await values[0].getText();
      return value.includes('100') ? value : false;
    }, 15000, 'Dashboard total balance did not reach 100');

    assert.match(balance, /100/);
    console.log('PASS: dashboard total balance reflects the LKR 100 income');
    console.log(JSON.stringify({ result: 'PASS', email: testEmail, balance }));
  } catch (error) {
    console.error('FAIL: Finora Selenium smoke flow');
    console.error(error.stack || error);
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
})().catch((error) => {
  console.error('FAIL: Finora Selenium smoke flow');
  console.error(error.stack || error);
  process.exitCode = 1;
});
