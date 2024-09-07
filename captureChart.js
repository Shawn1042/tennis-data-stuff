import puppeteer from 'puppeteer';

export async function captureChart(playerName) {
  try {
    // Replace 'localhost:3000' with your Railway domain
    const baseUrl = process.env.RAILWAY_WEB_URL || 'http://localhost:3000';
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    const url = `${baseUrl}/chart?player=${encodeURIComponent(playerName)}`;
    console.log(`Navigating to URL: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle2' });

    const chartExists = await page.evaluate(() => !!document.querySelector('canvas#playerChart'));
    if (!chartExists) {
      console.error('Chart not found on page. Verify the server response and page content.');
      await browser.close();
      return null;
    }

    // Adjust the viewport size to make the chart bigger
    const chartDimensions = await page.evaluate(() => {
      const canvas = document.querySelector('canvas#playerChart');
      if (canvas) {
        const { width, height } = canvas.getBoundingClientRect();
        return { width: Math.round(width * 1.1), height: Math.round(height * 1.1) }; // Increase size by 10%
      }
      return { width: 1600, height: 1000 }; // Default dimensions if canvas is not found
    });

    // Set a larger device scale factor to make the chart appear bigger
    await page.setViewport({ width: chartDimensions.width, height: chartDimensions.height, deviceScaleFactor: 2.5 });

    const screenshotPath = `./${playerName.replace(/ /g, '_')}_chart.png`;
    await page.screenshot({ path: screenshotPath, clip: { x: 0, y: 0, width: chartDimensions.width, height: chartDimensions.height } });
    await browser.close();
    return screenshotPath;
  } catch (error) {
    console.error('Error capturing chart:', error);
    return null;
  }
}
