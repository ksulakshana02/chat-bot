import {NextResponse} from 'next/server';
import Groq from 'groq-sdk';
import {Pinecone} from '@pinecone-database/pinecone';
import {pipeline, env} from '@xenova/transformers';

env.allowLocalModels = true;
env.localModelPath = 'node_modules/@xenova/transformers/models';

const groq = new Groq({apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!});

const pinecone = new Pinecone({apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!});
const indexName = 'pdf-chunks';
const namespace = 'user-docs';

let embedder: any;

async function getEmbedder() {
    if (!embedder) {
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embedder;
}

export async function POST(request: Request) {
    try {
        const {query, sessionId} = await request.json();

        if (!query) {
            return NextResponse.json({error: 'Query is required'}, {status: 400});
        }

        const embedder = await getEmbedder();
        const queryEmbedding = await embedder(query, {pooling: 'mean', normalize: true});

        const queryOptions: any = {
            vector: Array.from(queryEmbedding.data) as number[],
            topK: 5,
            includeMetadata: true
        };

        if (sessionId) {
            queryOptions.filter = {session: {$eq: sessionId}};
        }

        const index = pinecone.index(indexName).namespace(namespace);
        const queryResponse = await index.query(queryOptions);

        const context = queryResponse.matches
            .map((match) => match.metadata?.text || '')
            .join('\n\n');

        if (!context) {
            return NextResponse.json(
                {response: 'I couldn\'t find relevant information in the PDF to answer your question.'},
                {status: 200}
            );
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content:
                        'You are a helpful PDF assistant that answers questions based solely on the provided context. If the context doesn\'t contain enough information to answer the question properly, say so. Do not invent information or draw from knowledge outside the provided context. Be specific, clear, and concise.',
                },
                {
                    role: 'user',
                    content: `Context from PDF:\n\n${context}\n\nQuestion: ${query}\n\nPlease answer based only on the information in the context.`,
                },
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
            max_tokens: 1000,
        });

        const response = chatCompletion.choices[0]?.message?.content || 'No response received';

        return NextResponse.json({
            response,
            matchCount: queryResponse.matches.length,
            contextLength: context.length
        });
    } catch (error: any) {
        console.error('Error:', error);
        if (error.response?.status === 401) {
            return NextResponse.json(
                {error: 'Invalid API key. Please check your configuration.'},
                {status: 401}
            );
        }
        if (error.response?.status === 429) {
            return NextResponse.json(
                {error: 'Rate limit exceeded. Please try again later.'},
                {status: 429}
            );
        }
        return NextResponse.json(
            {error: error.message || 'Failed to process query. Please try again.'},
            {status: 500}
        );
    }
}