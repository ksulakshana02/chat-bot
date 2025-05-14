// import {NextResponse} from 'next/server';
// import {Pinecone} from '@pinecone-database/pinecone';
// import pdfParse from 'pdf-parse';
// import {pipeline, env} from '@xenova/transformers';
//
// env.allowLocalModels = true;
// env.localModelPath = 'node_modules/@xenova/transformers/models';
//
// const pinecone = new Pinecone({apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!});
// const indexName = 'pdf-chunks';
// const namespace = 'user-docs';
//
// let embedder: any;
//
// async function getEmbedder() {
//     if (!embedder) {
//         try {
//             embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
//         } catch (error: any) {
//             throw new Error(`Failed to initialize embedder: ${error.message}`);
//         }
//     }
//     return embedder;
// }
//
// async function extractTextFromPDF(buffer: Buffer): Promise<{ pages: string[]; numPages: number }> {
//     try {
//         const pdfData = await pdfParse(buffer, {max: 0});
//         const text = pdfData.text.trim();
//         if (!text) {
//             throw new Error('No text extracted from PDF');
//         }
//
//         let pages = pdfData.text.split('\n\n').filter((page) => page.trim());
//         if (pages.length === 0) {
//             pages = [text];
//         }
//
//         pages = pages.map((page) => page.replace(/\s+/g, ' ').trim());
//
//         return {pages, numPages: pdfData.numpages};
//     } catch (error: any) {
//         throw new Error(`Failed to extract text from PDF: ${error.message}`);
//     }
// }
//
// export async function POST(request: Request) {
//     try {
//         if (!process.env.NEXT_PUBLIC_PINECONE_API_KEY) {
//             console.error('PINECONE_API_KEY is not defined');
//             return NextResponse.json(
//                 {error: 'Server configuration error: Missing Pinecone API key'},
//                 {status: 500}
//             );
//         }
//
//         const formData = await request.formData();
//         const file = formData.get('file') as File;
//
//         if (!file || file.type !== 'application/pdf') {
//             return NextResponse.json(
//                 {error: 'Please upload a valid PDF file'},
//                 {status: 400}
//             );
//         }
//
//         if (file.size > 10 * 1024 * 1024) {
//             return NextResponse.json(
//                 {error: 'File size exceeds 10MB limit'},
//                 {status: 400}
//             );
//         }
//
//         const buffer = Buffer.from(await file.arrayBuffer());
//
//         const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
//         const sessionId = `${fileName}-${Date.now()}`;
//
//         const {pages, numPages} = await extractTextFromPDF(buffer);
//
//         if (pages.length === 0) {
//             return NextResponse.json(
//                 {error: 'No text found in PDF'},
//                 {status: 400}
//             );
//         }
//
//         const embedder = await getEmbedder();
//         const embeddings = await Promise.all(
//             pages.map(async (page, index) => {
//                 try {
//                     const embedding = await embedder(page, {pooling: 'mean', normalize: true});
//                     return {
//                         id: `${sessionId}-page-${index + 1}`,
//                         values: Array.from(embedding.data) as number[],
//                         metadata: {
//                             text: page,
//                             session: sessionId,
//                             fileName: file.name,
//                             pageNumber: index + 1,
//                         },
//                     };
//                 } catch (error: any) {
//                     throw new Error(`Failed to generate embedding for page ${index + 1}: ${error.message}`);
//                 }
//             })
//         );
//
//         let indexesResponse;
//         try {
//             indexesResponse = await pinecone.listIndexes();
//             console.log('Indexes Response:', indexesResponse); // Debug
//         } catch (error: any) {
//             console.error('Failed to list Pinecone indexes:', error);
//             return NextResponse.json(
//                 {error: `Failed to access Pinecone: ${error.message}`},
//                 {status: 500}
//             );
//         }
//
//         const indexList = indexesResponse.indexes || [];
//         const indexExists = indexList.some((idx) => idx.name === indexName);
//
//         if (!indexExists) {
//             try {
//                 await pinecone.createIndex({
//                     name: indexName,
//                     dimension: 384,
//                     metric: 'cosine',
//                     spec: {
//                         serverless: {
//                             cloud: 'aws',
//                             region: 'us-east-1',
//                         },
//                     },
//                 });
//                 await new Promise((resolve) => setTimeout(resolve, 20000));
//             } catch (error: any) {
//                 console.error('Failed to create Pinecone index:', error);
//                 return NextResponse.json(
//                     {error: `Failed to create Pinecone index: ${error.message}`},
//                     {status: 500}
//                 );
//             }
//         }
//
//         const batchSize = 100;
//         for (let i = 0; i < embeddings.length; i += batchSize) {
//             const batch = embeddings.slice(i, i + batchSize);
//             try {
//                 await pinecone.index(indexName).namespace(namespace).upsert(batch);
//             } catch (error: any) {
//                 console.error('Failed to upsert embeddings:', error);
//                 return NextResponse.json(
//                     {error: `Failed to store embeddings: ${error.message}`},
//                     {status: 500}
//                 );
//             }
//         }
//
//         return NextResponse.json({
//             message: 'PDF processed and indexed successfully',
//             sessionId,
//             stats: {
//                 pages: numPages,
//                 chunks: pages.length,
//                 totalCharacters: pages.join('').length,
//             },
//         });
//     } catch (error: any) {
//         console.error('Error in /api/upload:', error);
//         return NextResponse.json(
//             {
//                 error: error.message || 'Failed to process PDF. Please try again.',
//             },
//             {status: 500}
//         );
//     }
// }


// import {NextResponse} from 'next/server';
// import {Pinecone} from '@pinecone-database/pinecone';
// import Tesseract from 'tesseract.js';
// // import {PDFDocument, PDFImage} from 'pdf-lib';
// // import { createCanvas, loadImage } from '@napi-rs/canvas';
// import {pipeline, env} from '@xenova/transformers';
// import {fromBuffer} from "pdf2pic";
// import pdfParse from 'pdf-parse';
//
// env.allowLocalModels = true;
// env.localModelPath = 'node_modules/@xenova/transformers/models';
//
// const pinecone = new Pinecone({apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!});
// const indexName = 'pdf-chunks';
// const namespace = 'user-docs';
//
// let embedder: any;
//
// async function getEmbedder() {
//     if (!embedder) {
//         try {
//             embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
//         } catch (error: any) {
//             throw new Error(`Failed to initialize embedder: ${error.message}`);
//         }
//     }
//     return embedder;
// }
//
// // async function extractTextWithOCR(pdfBuffer: Buffer): Promise<{ pages: string[]; numPages: number }> {
// //     try {
// //         const pdfDoc = await PDFDocument.load(pdfBuffer);
// //         const numPages = pdfDoc.getPageCount();
// //         const pages: string[] = [];
// //
// //         const worker = await createWorker('eng');
// //
// //         for (let i = 0; i < numPages; i++) {
// //             const page = pdfDoc.getPage(i);
// //             const {width, height} = page.getSize();
// //
// //             const canvas = createCanvas(width, height);
// //             const context = canvas.getContext('2d');
// //
// //             // you'd need to handle all PDF elements)
// //             const pageAsPng = await page.toPng();
// //             const image = await loadImage(pageAsPng);
// //             context.drawImage(image, 0, 0, width, height);
// //
// //             // Run OCR on the rendered page
// //             const {data: {text}} = await worker.recognize(canvas.toBuffer());
// //             pages.push(text);
// //         }
// //
// //         // Terminate the worker
// //         await worker.terminate();
// //
// //         return {pages, numPages};
// //     } catch (error: any) {
// //         throw new Error(`OCR processing failed: ${error.message}`);
// //     }
// // }
// //
// // async function extractTextFromPDF(buffer: Buffer): Promise<{ pages: string[]; numPages: number }> {
// //     try {
// //         const pdfParse = await import('pdf-parse');
// //         const pdfData = await pdfParse.default(buffer, {max: 0});
// //         const text = pdfData.text.trim();
// //
// //         // If regular extraction yields text, use it
// //         if (text) {
// //             let pages = pdfData.text.split('\n\n').filter((page) => page.trim());
// //             if (pages.length === 0) {
// //                 pages = [text];
// //             }
// //
// //             pages = pages.map((page) => page.replace(/\s+/g, ' ').trim());
// //             return {pages, numPages: pdfData.numpages};
// //         }
// //
// //         console.log('No selectable text found in PDF. Attempting OCR...');
// //         return await extractTextWithOCR(buffer);
// //     } catch (error: any) {
// //         console.log('Text extraction failed. Falling back to OCR...');
// //         return await extractTextWithOCR(buffer);
// //     }
// // }
//
//
// async function extractTextFromPDF(buffer: Buffer): Promise<{ pages: string[]; numPages: number }> {
//     try {
//         // First attempt with pdf-parse
//         const pdfData = await pdfParse(buffer, {max: 0});
//         let pages = pdfData.text.split('\n\n').filter((page) => page.trim());
//         // if (pages.length === 0 || !pdfData.text.trim()) {
//         // If no text is extracted, fall back to OCR
//         console.log('No text extracted, attempting OCR...');
//         const output = await fromBuffer(buffer, {
//             density: 300,
//             format: 'png',
//             width: 2550,
//             height: 3300,
//         }).bulk(-1); // Convert all pages to images
//
//         pages = await Promise.all(
//             output.map(async (page: any, index: number) => {
//                 const imageBuffer = page.buffer;
//                 const {data: {text}} = await Tesseract.recognize(imageBuffer, 'eng');
//                 return text.replace(/\s+/g, ' ').trim();
//             })
//         );
//         // } else {
//         //     pages = pages.map((page) => page.replace(/\s+/g, ' ').trim());
//         // }
//
//         return {pages, numPages: pdfData.numpages};
//     } catch (error: any) {
//         throw new Error(`Failed to extract text from PDF: ${error.message}`);
//     }
// }
//
// export async function POST(request: Request) {
//     try {
//         if (!process.env.NEXT_PUBLIC_PINECONE_API_KEY) {
//             console.error('PINECONE_API_KEY is not defined');
//             return NextResponse.json(
//                 {error: 'Server configuration error: Missing Pinecone API key'},
//                 {status: 500}
//             );
//         }
//
//         const formData = await request.formData();
//         const file = formData.get('file') as File;
//
//         if (!file || file.type !== 'application/pdf') {
//             return NextResponse.json(
//                 {error: 'Please upload a valid PDF file'},
//                 {status: 400}
//             );
//         }
//
//         if (file.size > 10 * 1024 * 1024) {
//             return NextResponse.json(
//                 {error: 'File size exceeds 10MB limit'},
//                 {status: 400}
//             );
//         }
//
//         const buffer = Buffer.from(await file.arrayBuffer());
//
//         const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
//         const sessionId = `${fileName}-${Date.now()}`;
//
//         // This now uses our enhanced function that can fall back to OCR
//         const {pages, numPages} = await extractTextFromPDF(buffer);
//
//         if (pages.length === 0) {
//             return NextResponse.json(
//                 {error: 'No text found in PDF, even after OCR processing'},
//                 {status: 400}
//             );
//         }
//
//         // Rest of your code remains the same
//         const embedder = await getEmbedder();
//         const embeddings = await Promise.all(
//             pages.map(async (page, index) => {
//                 try {
//                     const embedding = await embedder(page, {pooling: 'mean', normalize: true});
//                     return {
//                         id: `${sessionId}-page-${index + 1}`,
//                         values: Array.from(embedding.data) as number[],
//                         metadata: {
//                             text: page,
//                             session: sessionId,
//                             fileName: file.name,
//                             pageNumber: index + 1,
//                         },
//                     };
//                 } catch (error: any) {
//                     throw new Error(`Failed to generate embedding for page ${index + 1}: ${error.message}`);
//                 }
//             })
//         );
//
//         // Continue with Pinecone operations...
//         // [Rest of your existing code for handling Pinecone operations]
//
//         let indexesResponse;
//         try {
//             indexesResponse = await pinecone.listIndexes();
//             console.log('Indexes Response:', indexesResponse); // Debug
//         } catch (error: any) {
//             console.error('Failed to list Pinecone indexes:', error);
//             return NextResponse.json(
//                 {error: `Failed to access Pinecone: ${error.message}`},
//                 {status: 500}
//             );
//         }
//
//         const indexList = indexesResponse.indexes || [];
//         const indexExists = indexList.some((idx) => idx.name === indexName);
//
//         if (!indexExists) {
//             try {
//                 await pinecone.createIndex({
//                     name: indexName,
//                     dimension: 384,
//                     metric: 'cosine',
//                     spec: {
//                         serverless: {
//                             cloud: 'aws',
//                             region: 'us-east-1',
//                         },
//                     },
//                 });
//                 await new Promise((resolve) => setTimeout(resolve, 20000));
//             } catch (error: any) {
//                 console.error('Failed to create Pinecone index:', error);
//                 return NextResponse.json(
//                     {error: `Failed to create Pinecone index: ${error.message}`},
//                     {status: 500}
//                 );
//             }
//         }
//
//         const batchSize = 100;
//         for (let i = 0; i < embeddings.length; i += batchSize) {
//             const batch = embeddings.slice(i, i + batchSize);
//             try {
//                 await pinecone.index(indexName).namespace(namespace).upsert(batch);
//             } catch (error: any) {
//                 console.error('Failed to upsert embeddings:', error);
//                 return NextResponse.json(
//                     {error: `Failed to store embeddings: ${error.message}`},
//                     {status: 500}
//                 );
//             }
//         }
//
//         return NextResponse.json({
//             message: 'PDF processed and indexed successfully',
//             sessionId,
//             ocrUsed: pages.length > 0, // Indicate if OCR was used
//             stats: {
//                 pages: numPages,
//                 chunks: pages.length,
//                 totalCharacters: pages.join('').length,
//             },
//         });
//     } catch (error: any) {
//         console.error('Error in /api/upload:', error);
//         return NextResponse.json(
//             {
//                 error: error.message || 'Failed to process PDF. Please try again.',
//             },
//             {status: 500}
//         );
//     }
// }


import {NextResponse} from 'next/server';
import {Pinecone} from '@pinecone-database/pinecone';
import Tesseract from 'tesseract.js';
import {pipeline, env} from '@xenova/transformers';
import {fromBuffer} from 'pdf2pic';
import pdfParse from 'pdf-parse';

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

// async function extractTextFromPDF(buffer: Buffer): Promise<{ pages: string[]; numPages: number; ocrUsed: boolean }> {
//     let ocrUsed = false;
//     try {
//         // Attempt text extraction with pdf-parse
//         const pdfData = await pdfParse(buffer, {max: 0}).catch((error: any) => {
//             console.warn(`pdf-parse failed: ${error.message}`);
//             return {text: '', numpages: 0};
//         });
//
//         let pages = pdfData.text ? pdfData.text.split('\n\n').filter((page) => page.trim()) : [];
//         pages = pages.map((page) => page.replace(/\s+/g, ' ').trim());
//         const numPages = pdfData.numpages || 0;
//
//         if (numPages === 0) {
//             throw new Error('Invalid PDF: No pages detected');
//         }
//
//         // Initialize final pages array
//         const finalPages: string[] = new Array(numPages).fill('');
//
//         // Convert PDF to images for OCR
//         let images: any[] = [];
//         try {
//             images = await fromBuffer(buffer, {
//                 density: 300,
//                 format: 'png',
//                 width: 2550,
//                 height: 3300,
//             }).bulk(-1);
//         } catch (error: any) {
//             console.warn(`pdf2pic failed: ${error.message}`);
//             // Continue with pdf-parse results if available
//         }
//
//         // Process each page
//         for (let i = 0; i < numPages; i++) {
//             const pdfText = pages[i] || '';
//             const isPdfTextSufficient = pdfText.length > 50; // Threshold for meaningful text
//
//             if (isPdfTextSufficient) {
//                 // Use pdf-parse text if sufficient
//                 finalPages[i] = pdfText;
//             } else {
//                 // Fall back to OCR for this page
//                 if (images[i]) {
//                     try {
//                         const {data: {text}} = await Tesseract.recognize(images[i].buffer, 'eng');
//                         const ocrText = text.replace(/\s+/g, ' ').trim();
//                         ocrUsed = true;
//                         finalPages[i] = ocrText.length > pdfText.length ? ocrText : pdfText; // Use OCR if it provides more content
//                     } catch (error: any) {
//                         console.warn(`OCR failed for page ${i + 1}: ${error.message}`);
//                         finalPages[i] = pdfText; // Fallback to pdf-parse text
//                     }
//                 } else {
//                     finalPages[i] = pdfText; // Fallback to pdf-parse text if no image
//                 }
//             }
//         }
//
//         // Filter out empty pages
//         const nonEmptyPages = finalPages.filter((page) => page.trim());
//         if (nonEmptyPages.length === 0) {
//             throw new Error('No text extracted from PDF, even after OCR');
//         }
//
//         return {pages: nonEmptyPages, numPages, ocrUsed};
//     } catch (error: any) {
//         throw new Error(`Failed to extract text from PDF: ${error.message}`);
//     }
// }


async function extractTextFromPDF(buffer: Buffer): Promise<{ pages: string[]; numPages: number; ocrUsed: boolean }> {
    let ocrUsed = false;

    // Validate buffer
    if (!buffer || buffer.length === 0) {
        throw new Error('Invalid or empty PDF buffer');
    }

    try {
        // Attempt text extraction with pdf-parse
        const pdfData = await pdfParse(buffer, {max: 0}).catch((error: any) => {
            console.warn(`pdf-parse failed: ${error.message}`);
            return {text: '', numpages: 0};
        });

        let pages = pdfData.text ? pdfData.text.split('\n\n').filter((page) => page.trim()) : [];
        pages = pages.map((page) => page.replace(/\s+/g, ' ').trim());
        const numPages = pdfData.numpages || 0;

        if (numPages === 0) {
            throw new Error('Invalid PDF: No pages detected');
        }

        // Skip OCR if text is sufficient
        const totalTextLength = pages.join('').length;
        if (totalTextLength > 500 && pages.every((page) => page.length > 50)) {
            return {pages, numPages, ocrUsed: false};
        }

        // Initialize final pages array
        const finalPages: string[] = new Array(numPages).fill('');

        // Convert PDF to images for OCR
        let images: any[] = [];
        try {
            images = await fromBuffer(buffer, {
                density: 150,
                format: 'png',
                width: 1280,
                height: 1650,
            }).bulk(-1, {responseType: 'buffer'});
        } catch (error: any) {
            console.warn(`pdf2pic failed: ${error.message}, buffer size: ${buffer.length}`);
            // Continue with pdf-parse results
        }

        // Process each page
        for (let i = 0; i < numPages; i++) {
            const pdfText = pages[i] || '';
            const isPdfTextSufficient = pdfText.length > 50;

            if (isPdfTextSufficient) {
                finalPages[i] = pdfText;
            } else if (images[i]) {
                try {
                    const {data: {text}} = await Tesseract.recognize(images[i].buffer, 'eng');
                    const ocrText = text.replace(/\s+/g, ' ').trim();
                    ocrUsed = true;
                    finalPages[i] = ocrText.length > pdfText.length ? ocrText : pdfText;
                } catch (error: any) {
                    console.warn(`OCR failed for page ${i + 1}: ${error.message}`);
                    finalPages[i] = pdfText;
                }
            } else {
                finalPages[i] = pdfText;
            }
        }

        // Filter out empty pages
        const nonEmptyPages = finalPages.filter((page) => page.trim());
        if (nonEmptyPages.length === 0) {
            throw new Error('No text extracted from PDF, even after OCR');
        }

        return {pages: nonEmptyPages, numPages, ocrUsed};
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

        // Extract text with enhanced function
        const {pages, numPages, ocrUsed} = await extractTextFromPDF(buffer);

        if (pages.length === 0) {
            return NextResponse.json(
                {error: 'No text found in PDF, even after OCR processing'},
                {status: 400}
            );
        }

        // Generate embeddings
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

        // Pinecone operations
        let indexesResponse;
        try {
            indexesResponse = await pinecone.listIndexes();
            console.log('Indexes Response:', indexesResponse);
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
            ocrUsed, // Indicate if OCR was used
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