import {NextResponse} from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPEN_AI_KEY,
});

// Simplified country-to-currency mapping (extend for production)
const countryToCurrency: { [key: string]: string } = {
    'united states': 'USD',
    usa: 'USD',
    india: 'INR',
    'sri lanka': 'LKR',
    japan: 'JPY',
    china: 'CNY',
    germany: 'EUR',
    france: 'EUR',
    brazil: 'BRL',
    canada: 'CAD',
    australia: 'AUD',
    // Add more as needed
};

// Fetch exchange rate from Alpha Vantage
async function fetchExchangeRate(currency: string): Promise<number | null> {
    const apiKey = process.env.NEXT_PUBLIC_VANTAGE;
    if (!apiKey) {
        throw new Error('Alpha Vantage API key is missing');
    }

    try {
        const response = await fetch(
            `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=USD&to_symbol=${currency}&apikey=${apiKey}`
        );
        const data = await response.json();

        if (data['Error Message'] || !data['Time Series FX (Daily)']) {
            throw new Error(`Failed to fetch data for ${currency}`);
        }

        const latestDate = Object.keys(data['Time Series FX (Daily)'])[0];
        const rate = parseFloat(data['Time Series FX (Daily)'][latestDate]['4. close']);
        return rate;
    } catch (error) {
        console.error(`Error fetching data for ${currency}:`, error);
        return null;
    }
}

// Function to get exchange rates for two countries
async function getExchangeRates({country1, country2}: { country1: string; country2: string }) {
    const normalizedCountry1 = country1.toLowerCase();
    const normalizedCountry2 = country2.toLowerCase();

    const currency1 = countryToCurrency[normalizedCountry1];
    const currency2 = countryToCurrency[normalizedCountry2];

    if (!currency1 || !currency2) {
        return {
            error: `Unsupported country: ${!currency1 ? country1 : country2}`,
        };
    }

    const rate1 = await fetchExchangeRate(currency1);
    const rate2 = await fetchExchangeRate(currency2);

    if (rate1 === null || rate2 === null) {
        return {
            error: `Failed to fetch exchange rate for ${rate1 === null ? currency1 : currency2}`,
        };
    }

    return {
        country1: {name: country1, currency: currency1, rate: rate1},
        country2: {name: country2, currency: currency2, rate: rate2},
    };
}

// Function definition for OpenAI
const functions = [
    {
        name: 'getExchangeRates',
        description: 'Fetches exchange rates for two countries to compare their economies',
        parameters: {
            type: 'object',
            properties: {
                country1: {type: 'string', description: 'First country name'},
                country2: {type: 'string', description: 'Second country name'},
            },
            required: ['country1', 'country2'],
        },
    },
];

export async function POST(request: Request) {
    try {
        const {query} = await request.json();
        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                {response: 'Invalid query provided.'},
                {status: 400}
            );
        }

        // Initial OpenAI call with function calling
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{role: 'user', content: query}],
            functions,
            function_call: 'auto',
        });

        const message = completion.choices[0].message;

        // Check if OpenAI wants to call the function
        if (message.function_call && message.function_call.name === 'getExchangeRates') {
            const args = JSON.parse(message.function_call.arguments);
            const {country1, country2} = args;

            // Execute the function
            const result = await getExchangeRates({country1, country2});

            if ('error' in result) {
                return NextResponse.json({response: result.error}, {status: 400});
            }

            // Send the function result back to OpenAI
            const secondCompletion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {role: 'user', content: query},
                    message,
                    {
                        role: 'function',
                        name: 'getExchangeRates',
                        content: JSON.stringify(result),
                    },
                ],
            });

            const response = secondCompletion.choices[0].message.content || 'No response from OpenAI.';
            return NextResponse.json({response});
        }

        // If no function call, return OpenAI's direct response
        const response = message.content || 'Please specify two countries to compare economies.';
        return NextResponse.json({response});
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            {response: 'Error processing request. Please try again.'},
            {status: 500}
        );
    }
}