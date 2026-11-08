import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const output = 'site-checks';
await mkdir(output,{recursive:true});
const browser = await chromium.launch({channel:'chrome',headless:true});
try {
  const page = await browser.newPage({viewport:{width:1440,height:1080}});
  await page.goto('https://orlovviktor-idb-24-02.github.io/mesto-pages/');
  await page.waitForFunction(() => document.querySelector('.profile__title')?.textContent.trim()
    && document.querySelectorAll('.card').length > 0,{},{timeout:45000});
  assert.equal(await page.locator('.page__connect,.popup_type_connection').count(),0);
  const cardCount = await page.locator('.card').count();
  assert.ok(await page.getByRole('button',{name:'Редактировать профиль',exact:true}).isEnabled());
  await page.screenshot({path:`${output}/desktop.png`,fullPage:false});
  await page.locator('.card__image-button').first().click();
  assert.ok(await page.locator('.popup_type_image').isVisible());
  await page.keyboard.press('Escape');
  await page.locator('.card__control-button_type_info').first().click();
  await page.waitForFunction(() => document.querySelector('.popup__info-list')?.textContent.includes('Дата создания:'),{},{timeout:30000});
  assert.ok(await page.locator('.popup_type_info').isVisible());
  await page.screenshot({path:`${output}/statistics.png`,fullPage:false});
  await page.keyboard.press('Escape');
  await page.setViewportSize({width:375,height:812});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`${output}/mobile.png`,fullPage:false});
  const result = {publishedPage:true,realApi:true,visitorTokenRequired:false,cardCount,imagePopup:true,statisticsPopup:true,mobileOverflow:false};
  await writeFile(`${output}/result.json`,JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));
} finally {
  await browser.close();
}
