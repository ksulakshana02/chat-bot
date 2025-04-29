import {pipeline, RawImage} from '@xenova/transformers';

export async function encodeText(text: string): Promise<number[]> {
    try {
        const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        const result = await embedder(text, {pooling: 'mean', normalize: true});
        return Array.from(result.data) as number[];
    } catch (error) {
        console.error('Embedding error:', error);
        throw new Error('Failed to generate embedding');
    }
}