import {NextResponse} from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
});

export async function POST(request: Request) {
    try {
        const {message} = await request.json();

        if (!message) {
            return NextResponse.json({error: 'Message is required'}, {status: 400});
        }

        const completion = await openai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                {role: 'system', content: 'You are a helpful assistant.'},
                {role: 'user', content: message},
            ],
            stream: false,
        });

        const response = completion.choices[0].message.content;

        return NextResponse.json({response});
    } catch (error: any) {
        console.error('Error:', error);
        if (error.status === 402) {
            return NextResponse.json(
                {error: 'Insufficient balance in DeepSeek account. Please add funds.'},
                {status: 402}
            );
        }
        return NextResponse.json(
            {error: 'Failed to process request. Please try again later.'},
            {status: 500}
        );
    }
}