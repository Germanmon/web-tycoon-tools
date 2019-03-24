module.exports = async (browser, logger, { token, userId, userAgent }) => {
  // удаляем рекламу с низкой конверсией
  logger.info(`удаляем рекламу с низкой конверсией`);
  const page = await browser.newPage();

  const width = 1196;
  const height = 820;
  await page.emulate({
    userAgent,
    viewport: {
      width,
      height
    }
  });
  await page.goto(`https://game.web-tycoon.com/players/${userId}/sites`, {
    waitUntil: "networkidle2"
  });
  await page.waitForSelector(".siteCard");

  let sites = await page.$$(".siteCard");
  for (let siteNumber = sites.length; siteNumber > 0; --siteNumber) {
    await page.waitForSelector(".linkSites");
    const $linkSites = await page.$(".linkSites");
    await page.evaluate(el => el.click(), $linkSites);
    await page.waitForSelector(".siteCard");
    // :(
    await new Promise(res => setTimeout(res, 1 * 1000));
    let sites = await page.$$(".siteCard");
    logger.info(`Смотрим рекламу на сайте ${siteNumber - 1}`);
    // :(
    await new Promise(res => setTimeout(res, 1 * 1000));
    await sites[siteNumber - 1].click();
    await page.waitForSelector(".aboutWr");
    await new Promise(res => setTimeout(res, 1 * 1000));

    /////
    const $cards = await page.$$(
      ".adWr .grid .itemWr:not(.offersAd):not(.inactiveAd)"
    );
    for (let $card of $cards) {
      const $stats = await $card.$$(".statsWr");
      const $stat = $stats[2];
      const text = await (await $stat.getProperty("textContent")).jsonValue();
      const adConv = parseFloat(text.replace(",", "."));
      logger.info("Конверсия", adConv);
      if (adConv < 1.5) {
        const $remove = await $card.$(".removeItemIcon");
        await $remove.click();
        // await page.evaluate(el => el.click(), $remove);
        await page.waitForSelector(".popupContent .defaultBtn");
        await new Promise(res => setTimeout(res, 3 * 1000));
        const $removeConfirm = await page.$(".popupContent .defaultBtn");
        // await page.evaluate(el => el.click(), $removeConfirm);
        await $removeConfirm.click();
        await new Promise(res => setTimeout(res, 3 * 1000));
        logger.info(
          `Удалена реклама с низкой конверсией ${adConv} с сайта ${siteNumber}`
        );
        await new Promise(res => setTimeout(res, 3 * 1000));
      }
    }
  }
  await page.close();
};
