import {NextResponse} from 'next/server';
import puppeteer from 'puppeteer';
import {Pinecone} from '@pinecone-database/pinecone';
import {encodeText} from '@/lib/embedding';

interface CarListing {
    title: string;
    price: string;
    url: string;
    location: string;
    mileage: string;
    date: string;
    description: string;
}

export async function GET() {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        await page.goto('https://riyasewana.com/search/cars', {
            waitUntil: 'networkidle2',
            timeout: 30000,
        });

        const listings: CarListing[] = await page.evaluate(() => {
            const items = document.querySelectorAll('li.item');
            const results: CarListing[] = [];

            items.forEach((item) => {
                const titleEl = item.querySelector('h2 a');
                const priceEl = item.querySelector('div.boxintxt.b');
                const locationEl = item.querySelector('div.boxintxt:nth-child(1)');
                const mileageEl = item.querySelector('div.boxintxt:nth-child(3)');
                const dateEl = item.querySelector('div.boxintxt.s');
                const linkEl = item.querySelector('h2 a');

                const title = titleEl?.textContent?.trim() || 'Unknown Car';
                const price = priceEl?.textContent?.trim() || 'N/A';
                const location = locationEl?.textContent?.trim() || 'N/A';
                const mileage = mileageEl?.textContent?.trim() || 'N/A';
                const date = dateEl?.textContent?.trim() || 'N/A';
                const url = linkEl?.getAttribute('href') || '';
                const description = `${title}, ${price}, ${location}, ${mileage}, ${date}`;

                results.push({title, price, url, location, mileage, date, description});
            });

            return results.slice(0, 5);
        });

        // if (listings.length === 0) {
        //     listings.push(
        //         {
        //             title: 'Toyota RAV4 2019',
        //             price: 'Rs. 2,500,000',
        //             url: 'https://riyasewana.com/buy/toyota-rav4-2019',
        //             location: 'Colombo',
        //             mileage: '40000 (km)',
        //             date: '2025-04-27',
        //             description: 'Toyota RAV4, 2019, Hybrid, Rs. 2,500,000, Colombo, 40000 (km), 2025-04-27',
        //         },
        //         {
        //             title: 'Honda CR-V 2020',
        //             price: 'Rs. 2,800,000',
        //             url: 'https://riyasewana.com/buy/honda-cr-v-2020',
        //             location: 'Gampaha',
        //             mileage: '35000 (km)',
        //             date: '2025-04-26',
        //             description: 'Honda CR-V, 2020, Hybrid, Rs. 2,800,000, Gampaha, 35000 (km), 2025-04-26',
        //         }
        //     );
        // }

        // const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
        // const index = pinecone.index('car-listings');
        //
        // for (const listing of listings) {
        //     const embedding = await encodeText(listing.description);
        //     await index.upsert([
        //         {
        //             id: listing.title,
        //             values: embedding,
        //             metadata: {
        //                 title: listing.title,
        //                 price: listing.price,
        //                 url: listing.url,
        //                 location: listing.location,
        //                 mileage: listing.mileage,
        //                 date: listing.date,
        //             },
        //         },
        //     ]);
        // }

        console.log(listings);

        await browser.close();
        return NextResponse.json({message: 'Scraped and stored', listings});
    } catch (error) {
        console.error('Scraping error:', error);
        if (browser) await browser.close();
        return NextResponse.json({error: 'Scraping failed'}, {status: 500});
    }
}