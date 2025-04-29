import {NextResponse} from 'next/server';
import {Pinecone} from '@pinecone-database/pinecone';
import pdfParse from 'pdf-parse';
import {pipeline, env} from '@xenova/transformers';

env.allowLocalModels = true;
env.localModelPath = 'node_modules/@xenova/transformers/models';

const pinecone = new Pinecone({apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!});
const indexName = 'pdf-chunks';
const namespace = 'user-docs';

let embedder: any;

async function getEmbedder() {
    if (!embedder) {
        try {
            embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        } catch (error: any) {
            throw new Error(`Failed to initialize embedder: ${error.message}`);
        }
    }
    return embedder;
}

async function extractTextFromPDF(buffer: Buffer): Promise<{ pages: string[]; numPages: number }> {
    try {
        const pdfData = await pdfParse(buffer, {max: 0});
        const text = pdfData.text.trim();
        if (!text) {
            throw new Error('No text extracted from PDF');
        }

        let pages = pdfData.text.split('\n\n').filter((page) => page.trim());
        if (pages.length === 0) {
            pages = [text];
        }

        pages = pages.map((page) => page.replace(/\s+/g, ' ').trim());

        return {pages, numPages: pdfData.numpages};
    } catch (error: any) {
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}

export async function POST(request: Request) {
    try {
        if (!process.env.NEXT_PUBLIC_PINECONE_API_KEY) {
            console.error('PINECONE_API_KEY is not defined');
            return NextResponse.json(
                {error: 'Server configuration error: Missing Pinecone API key'},
                {status: 500}
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file || file.type !== 'application/pdf') {
            return NextResponse.json(
                {error: 'Please upload a valid PDF file'},
                {status: 400}
            );
        }

        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                {error: 'File size exceeds 10MB limit'},
                {status: 400}
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        const sessionId = `${fileName}-${Date.now()}`;

        const {pages, numPages} = await extractTextFromPDF(buffer);

        if (pages.length === 0) {
            return NextResponse.json(
                {error: 'No text found in PDF'},
                {status: 400}
            );
        }

        const embedder = await getEmbedder();
        const embeddings = await Promise.all(
            pages.map(async (page, index) => {
                try {
                    const embedding = await embedder(page, {pooling: 'mean', normalize: true});
                    return {
                        id: `${sessionId}-page-${index + 1}`,
                        values: Array.from(embedding.data) as number[],
                        metadata: {
                            text: page,
                            session: sessionId,
                            fileName: file.name,
                            pageNumber: index + 1,
                        },
                    };
                } catch (error: any) {
                    throw new Error(`Failed to generate embedding for page ${index + 1}: ${error.message}`);
                }
            })
        );

        let indexesResponse;
        try {
            indexesResponse = await pinecone.listIndexes();
            console.log('Indexes Response:', indexesResponse); // Debug
        } catch (error: any) {
            console.error('Failed to list Pinecone indexes:', error);
            return NextResponse.json(
                {error: `Failed to access Pinecone: ${error.message}`},
                {status: 500}
            );
        }

        const indexList = indexesResponse.indexes || [];
        const indexExists = indexList.some((idx) => idx.name === indexName);

        if (!indexExists) {
            try {
                await pinecone.createIndex({
                    name: indexName,
                    dimension: 384,
                    metric: 'cosine',
                    spec: {
                        serverless: {
                            cloud: 'aws',
                            region: 'us-east-1',
                        },
                    },
                });
                await new Promise((resolve) => setTimeout(resolve, 20000));
            } catch (error: any) {
                console.error('Failed to create Pinecone index:', error);
                return NextResponse.json(
                    {error: `Failed to create Pinecone index: ${error.message}`},
                    {status: 500}
                );
            }
        }

        const batchSize = 100;
        for (let i = 0; i < embeddings.length; i += batchSize) {
            const batch = embeddings.slice(i, i + batchSize);
            try {
                await pinecone.index(indexName).namespace(namespace).upsert(batch);
            } catch (error: any) {
                console.error('Failed to upsert embeddings:', error);
                return NextResponse.json(
                    {error: `Failed to store embeddings: ${error.message}`},
                    {status: 500}
                );
            }
        }

        return NextResponse.json({
            message: 'PDF processed and indexed successfully',
            sessionId,
            stats: {
                pages: numPages,
                chunks: pages.length,
                totalCharacters: pages.join('').length,
            },
        });
    } catch (error: any) {
        console.error('Error in /api/upload:', error);
        return NextResponse.json(
            {
                error: error.message || 'Failed to process PDF. Please try again.',
            },
            {status: 500}
        );
    }
}