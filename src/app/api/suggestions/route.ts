import {NextResponse} from 'next/server';
import {Pinecone} from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import {pipeline, env} from '@xenova/transformers';
import Groq from "groq-sdk";

env.allowLocalModels = true;
env.localModelPath = 'node_modules/@xenova/transformers/models';

const pinecone = new Pinecone({apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!});
// const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPEN_AI_KEY! });
const groq = new Groq({apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!});
const indexName = 'pdf-chunks';
const namespace = 'user-docs';

let embedder: any;

// async function getEmbedder() {
//     if (!embedder) {
//         embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
//     }
//     return embedder;
// }

async function getEmbedder() {
    if (!embedder) {
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embedder;
}


export async function POST(request: Request) {
    try {
        const {sessionId} = await request.json();

        if (!sessionId) {
            return NextResponse.json({error: 'sessionId is required'}, {status: 400});
        }

        const embedder = await getEmbedder();
        const neutralVector = Array(384).fill(0);
        const index = pinecone.index(indexName).namespace(namespace);
        const topChunks = await index.query({
            vector: neutralVector,
            topK: 10,
            includeMetadata: true,
            filter: {session: {$eq: sessionId}},
        });

        // const topChunks = await index.query({
        //     vector: Array(768).fill(0), // Updated for 768 dimensions
        //     topK: 10,
        //     includeMetadata: true,
        //     filter: {session: {$eq: sessionId}},
        // });

        const suggestionText = topChunks.matches
            .map((match) => match.metadata?.text || '')
            .join('\n');

        if (!suggestionText) {
            return NextResponse.json({suggestions: 'No content available to generate suggestions.'}, {status: 200});
        }

        const suggestionCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content:
                        'Generate 3 relevant questions based on the provided PDF content to help the user explore the document. Format as a numbered list.',
                },
                {
                    role: 'user',
                    content: `PDF Content:\n${suggestionText}\n\nSuggest 3 questions.`,
                },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.5,
            max_tokens: 150,
        });

        const suggestions = suggestionCompletion.choices[0]?.message?.content || 'No suggestions available.';
        return NextResponse.json({suggestions});
    } catch (error: any) {
        console.error('Error in /api/suggestions:', error);
        return NextResponse.json(
            {error: error.message || 'Failed to generate suggestions.'},
            {status: 500}
        );
    }
}