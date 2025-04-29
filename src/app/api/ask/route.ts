import type { NextApiRequest, NextApiResponse } from 'next';
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({
    apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY as string,
});
const index = pinecone.Index('documents');

async function getEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await fetch('https://api.deepseek.com/embeddings', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: texts }),
    });
    const data = await response.json();
    return data.embeddings || texts.map(() => Array(1536).fill(0));
}

async function getAnswer(question: string, context: string[]): Promise<string> {
    const prompt = `Context: ${context.join('\n')}\n\nQuestion: ${question}\nAnswer:`;
    const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'deepseek-model',
            messages: [{ role: 'user', content: prompt }],
        }),
    });
    const data = await response.json();
    return data.choices[0].message.content || 'No answer generated';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { question, documentId } = req.body;

    if (!question || !documentId) {
        return res.status(400).json({ message: 'Missing question or documentId' });
    }

    try {
        const questionEmbedding = await getEmbeddings([question])[0];
        const queryResponse = await index.query({
            vector: questionEmbedding,
            topK: 5,
            includeMetadata: true,
            filter: { documentId },
        });

        const relevantChunks = queryResponse.matches.map((match: any) => match.metadata.text);
        const answer = await getAnswer(question, relevantChunks);

        res.status(200).json({ answer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error processing question' });
    }
}