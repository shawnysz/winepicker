import * as cheerio from "cheerio";

export interface WinePrice {
  avgPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  currency: string;
  source: string;
}

export async function scrapeWineSearcher(
  producer: string,
  wineName: string,
  vintage?: number
): Promise<WinePrice> {
  const query = encodeURIComponent(
    `${producer} ${wineName}${vintage ? ` ${vintage}` : ""}`
  );
  const url = `https://www.wine-searcher.com/find/${query}/1/usa`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      console.error(`Wine-Searcher returned ${response.status}`);
      return { avgPrice: null, minPrice: null, maxPrice: null, currency: "USD", source: "wine-searcher" };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Try to extract average price from Wine-Searcher page
    let avgPrice: number | null = null;
    let minPrice: number | null = null;
    let maxPrice: number | null = null;

    // Wine-Searcher shows average price in various formats
    // Look for price patterns in the page
    const pricePattern = /\$[\d,]+/g;
    const prices: number[] = [];

    $("*").each((_, el) => {
      const text = $(el).clone().children().remove().end().text();
      const matches = text.match(pricePattern);
      if (matches) {
        for (const match of matches) {
          const price = parseFloat(match.replace(/[$,]/g, ""));
          if (price > 5 && price < 100000) {
            prices.push(price);
          }
        }
      }
    });

    if (prices.length > 0) {
      prices.sort((a, b) => a - b);
      minPrice = prices[0];
      maxPrice = prices[prices.length - 1];
      avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    }

    return {
      avgPrice,
      minPrice,
      maxPrice,
      currency: "USD",
      source: "wine-searcher",
    };
  } catch (error) {
    console.error("Error scraping Wine-Searcher:", error);
    return { avgPrice: null, minPrice: null, maxPrice: null, currency: "USD", source: "wine-searcher" };
  }
}
