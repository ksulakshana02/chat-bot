// import {NextResponse} from 'next/server';
// import Groq from 'groq-sdk';
// import {Pinecone} from '@pinecone-database/pinecone';
// import {pipeline, env} from '@xenova/transformers';
// import OpenAI from "openai";
//
// env.allowLocalModels = true;
// env.localModelPath = 'node_modules/@xenova/transformers/models';
//
// const groq = new Groq({apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!});
//
// const openai = new OpenAI({apiKey: process.env.NEXT_PUBLIC_OPEN_AI_KEY});
//
// const pinecone = new Pinecone({apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!});
// const indexName = 'pdf-chunks';
// const namespace = 'user-docs';
//
// let embedder: any;
//
// async function getEmbedder() {
//     if (!embedder) {
//         embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
//     }
//     return embedder;
// }
//
// export async function POST(request: Request) {
//     try {
//         const {query, sessionId} = await request.json();
//
//         if (!query) {
//             return NextResponse.json({error: 'Query is required'}, {status: 400});
//         }
//
//         const embedder = await getEmbedder();
//         const queryEmbedding = await embedder(query, {pooling: 'mean', normalize: true});
//
//         const queryOptions: any = {
//             vector: Array.from(queryEmbedding.data) as number[],
//             topK: 5,
//             includeMetadata: true
//         };
//
//         if (sessionId) {
//             queryOptions.filter = {session: {$eq: sessionId}};
//         }
//
//         const index = pinecone.index(indexName).namespace(namespace);
//         const queryResponse = await index.query(queryOptions);
//
//         const context = queryResponse.matches
//             .map((match) => match.metadata?.text || '')
//             .join('\n\n');
//
//         if (!context) {
//             return NextResponse.json(
//                 {response: 'I couldn\'t find relevant information in the PDF to answer your question.'},
//                 {status: 200}
//             );
//         }
//
//         const chatCompletion = await openai.chat.completions.create({
//             messages: [
//                 {
//                     role: 'system',
//                     content:
//                         'You are a helpful PDF assistant that answers questions based solely on the provided context. If the context doesn\'t contain enough information to answer the question properly, say so. Do not invent information or draw from knowledge outside the provided context. Be specific, clear, and concise.',
//                 },
//                 {
//                     role: 'user',
//                     content: `Context from PDF:\n\n${context}\n\nQuestion: ${query}\n\nPlease answer based only on the information in the context.`,
//                 },
//             ],
//             // model: 'llama-3.3-70b-versatile',
//             model: 'gpt-4o-mini',
//             temperature: 0.2,
//             max_tokens: 300,
//         });
//
//         const response = chatCompletion.choices[0]?.message?.content || 'No response received';
//
//         return NextResponse.json({
//             response,
//             matchCount: queryResponse.matches.length,
//             contextLength: context.length
//         });
//     } catch (error: any) {
//         console.error('Error:', error);
//         if (error.response?.status === 401) {
//             return NextResponse.json(
//                 {error: 'Invalid API key. Please check your configuration.'},
//                 {status: 401}
//             );
//         }
//         if (error.response?.status === 429) {
//             return NextResponse.json(
//                 {error: 'Rate limit exceeded. Please try again later.'},
//                 {status: 429}
//             );
//         }
//         return NextResponse.json(
//             {error: error.message || 'Failed to process query. Please try again.'},
//             {status: 500}
//         );
//     }
// }


// import { NextResponse } from 'next/server';
// import { Pinecone } from '@pinecone-database/pinecone';
// import OpenAI from 'openai';
// import { pipeline, env } from '@xenova/transformers';
//
// env.allowLocalModels = true;
// env.localModelPath = 'node_modules/@xenova/transformers/models';
//
// const pinecone = new Pinecone({ apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY! });
// const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPEN_AI_KEY! });
// const indexName = 'pdf-chunks';
// const pdfNamespace = 'user-docs';
// const chatNamespace = 'chat-history';
//
// let embedder: any;
//
// async function getEmbedder() {
//     if (!embedder) {
//         embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
//     }
//     return embedder;
// }
//
// export async function POST(request: Request) {
//     try {
//         const { query, sessionId } = await request.json();
//
//         if (!query || !sessionId) {
//             return NextResponse.json({ error: 'Query and sessionId are required' }, { status: 400 });
//         }
//
//         const embedder = await getEmbedder();
//         const queryEmbedding = await embedder(query, { pooling: 'mean', normalize: true });
//
//         // Fetch PDF context
//         const pdfIndex = pinecone.index(indexName).namespace(pdfNamespace);
//         const queryResponse = await pdfIndex.query({
//             vector: Array.from(queryEmbedding.data) as number[],
//             topK: 5,
//             includeMetadata: true,
//             filter: { session: { $eq: sessionId } },
//         });
//         const context = queryResponse.matches
//             .map((match) => match.metadata?.text || '')
//             .join('\n\n');
//
//         // Fetch chat history (last 5 messages)
//         const chatIndex = pinecone.index(indexName).namespace(chatNamespace);
//         const chatHistoryResponse = await chatIndex.query({
//             filter: { session: { $eq: sessionId } },
//             topK: 5,
//             includeMetadata: true,
//         });
//         const historyContext = chatHistoryResponse.matches
//             .map((match) => `${match.metadata?.isUser ? 'User' : 'Assistant'}: ${match.metadata?.content || ''}`)
//             .join('\n');
//
//         let response;
//         if (!context || queryResponse.matches.length < 2) {
//             // Fallback: Suggest questions
//             const suggestionContextResponse = await pdfIndex.query({
//                 vector: Array.from(queryEmbedding.data),
//                 topK: 10,
//                 includeMetadata: true,
//                 filter: { session: { $eq: sessionId } },
//             });
//             const suggestionText = suggestionContextResponse.matches
//                 .map((match) => match.metadata?.text || '')
//                 .join('\n');
//
//             const suggestionCompletion = await openai.chat.completions.create({
//                 messages: [
//                     {
//                         role: 'system',
//                         content:
//                             'The user’s query couldn’t be answered with the available PDF context. Based on the provided PDF content, suggest 3 relevant questions the user could ask to explore the document further. Format as a numbered list.',
//                     },
//                     {
//                         role: 'user',
//                         content: `PDF Content:\n${suggestionText}\n\nSuggest 3 questions.`,
//                     },
//                 ],
//                 model: 'gpt-4o-mini',
//                 temperature: 0.5,
//                 max_tokens: 150,
//             });
//
//             response = `I couldn’t find enough information to answer your question. Here are some questions you could ask:\n${suggestionCompletion.choices[0]?.message?.content || 'No suggestions available.'}`;
//         } else {
//             // Normal response with PDF and chat context
//             const chatCompletion = await openai.chat.completions.create({
//                 messages: [
//                     {
//                         role: 'system',
//                         content:
//                             'You are a helpful PDF assistant that answers questions based solely on the provided PDF context and chat history. If the context or history is insufficient, admit it. Be specific, clear, and concise.',
//                     },
//                     {
//                         role: 'user',
//                         content: `Chat History:\n${historyContext}\n\nPDF Context:\n${context}\n\nQuestion: ${query}`,
//                     },
//                 ],
//                 model: 'gpt-4o-mini',
//                 temperature: 0.2,
//                 max_tokens: 300,
//             });
//
//             response = chatCompletion.choices[0]?.message?.content || 'No response received.';
//         }
//
//         // Store query and response in chat history
//         const responseEmbedding = await embedder(response, { pooling: 'mean', normalize: true });
//         await chatIndex.upsert([
//             {
//                 id: `query-${Date.now()}`,
//                 values: Array.from(queryEmbedding.data),
//                 metadata: {
//                     content: query,
//                     session: sessionId,
//                     isUser: true,
//                     timestamp: Date.now(),
//                 },
//             },
//             {
//                 id: `response-${Date.now()}`,
//                 values: Array.from(responseEmbedding.data),
//                 metadata: {
//                     content: response,
//                     session: sessionId,
//                     isUser: false,
//                     timestamp: Date.now(),
//                 },
//             },
//         ]);
//
//         return NextResponse.json({
//             response,
//             matchCount: queryResponse.matches.length,
//             contextLength: context.length,
//         });
//     } catch (error: any) {
//         console.error('Error in /api/query:', error);
//         if (error.response?.status === 401) {
//             return NextResponse.json({ error: 'Invalid API key. Please check your configuration.' }, { status: 401 });
//         }
//         if (error.response?.status === 429) {
//             return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
//         }
//         return NextResponse.json(
//             { error: error.message || 'Failed to process query. Please try again.' },
//             { status: 500 }
//         );
//     }
// }

// import {NextResponse} from 'next/server';
// import {Pinecone} from '@pinecone-database/pinecone';
// import OpenAI from 'openai';
// import {pipeline, env} from '@xenova/transformers';
// import Groq from "groq-sdk";
//
// env.allowLocalModels = true;
// env.localModelPath = 'node_modules/@xenova/transformers/models';
//
// const pinecone = new Pinecone({apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!});
// // const openai = new OpenAI({apiKey: process.env.NEXT_PUBLIC_OPEN_AI_KEY!});
// const groq = new Groq({apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!});
// const indexName = 'pdf-chunks';
// const pdfNamespace = 'user-docs';
// const chatNamespace = 'chat-history';
//
// let embedder: any;
//
// async function getEmbedder() {
//     if (!embedder) {
//         embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
//     }
//     return embedder;
// }
//
// export async function POST(request: Request) {
//     try {
//         const {query, sessionId} = await request.json();
//
//         if (!query || !sessionId) {
//             return NextResponse.json({error: 'Query and sessionId are required'}, {status: 400});
//         }
//
//         const embedder = await getEmbedder();
//         const queryEmbedding = await embedder(query, {pooling: 'mean', normalize: true});
//
//         // Fetch PDF context
//         const pdfIndex = pinecone.index(indexName).namespace(pdfNamespace);
//         const queryResponse = await pdfIndex.query({
//             vector: Array.from(queryEmbedding.data) as number[],
//             topK: 5,
//             includeMetadata: true,
//             filter: {session: {$eq: sessionId}},
//         });
//         const context = queryResponse.matches
//             .map((match) => match.metadata?.text || '')
//             .join('\n\n');
//
//         // Fetch chat history (last 5 messages)
//         const chatIndex = pinecone.index(indexName).namespace(chatNamespace);
//         const chatHistoryResponse = await chatIndex.query({
//             vector: Array(384).fill(0), // Neutral vector to satisfy Pinecone's requirement
//             filter: {session: {$eq: sessionId}},
//             topK: 5,
//             includeMetadata: true,
//         });
//         const historyContext = chatHistoryResponse.matches
//             .map((match) => `${match.metadata?.isUser ? 'User' : 'Assistant'}: ${match.metadata?.content || ''}`)
//             .join('\n');
//
//         let response;
//         if (!context || queryResponse.matches.length < 2) {
//             // Fallback: Suggest questions
//             const suggestionContextResponse = await pdfIndex.query({
//                 vector: Array.from(queryEmbedding.data),
//                 topK: 10,
//                 includeMetadata: true,
//                 filter: {session: {$eq: sessionId}},
//             });
//             const suggestionText = suggestionContextResponse.matches
//                 .map((match) => match.metadata?.text || '')
//                 .join('\n');
//
//             const suggestionCompletion = await groq.chat.completions.create({
//                 messages: [
//                     {
//                         role: 'system',
//                         content:
//                             'The user’s query couldn’t be answered with the available PDF context. Based on the provided PDF content, suggest 3 relevant questions the user could ask to explore the document further. Format as a numbered list.',
//                     },
//                     {
//                         role: 'user',
//                         content: `PDF Content:\n${suggestionText}\n\nSuggest 3 questions.`,
//                     },
//                 ],
//                 model: 'llama-3.3-70b-versatile',
//                 temperature: 0.5,
//                 max_tokens: 150,
//             });
//
//             response = `I couldn’t find enough information to answer your question. Here are some questions you could ask:\n${suggestionCompletion.choices[0]?.message?.content || 'No suggestions available.'}`;
//         } else {
//             // Normal response with PDF and chat context
//             const chatCompletion = await groq.chat.completions.create({
//                 messages: [
//                     {
//                         role: 'system',
//                         content:
//                             'You are a helpful PDF assistant that answers questions based solely on the provided PDF context and chat history. If the context or history is insufficient, admit it. Be specific, clear, and concise.',
//                     },
//                     {
//                         role: 'user',
//                         content: `Chat History:\n${historyContext}\n\nPDF Context:\n${context}\n\nQuestion: ${query}`,
//                     },
//                 ],
//                 model: 'llama-3.3-70b-versatile',
//                 temperature: 0.2,
//                 max_tokens: 300,
//             });
//
//             response = chatCompletion.choices[0]?.message?.content || 'No response received.';
//         }
//
//         // Store query and response in chat history
//         const responseEmbedding = await embedder(response, {pooling: 'mean', normalize: true});
//         await chatIndex.upsert([
//             {
//                 id: `query-${Date.now()}`,
//                 values: Array.from(queryEmbedding.data),
//                 metadata: {
//                     content: query,
//                     session: sessionId,
//                     isUser: true,
//                     timestamp: Date.now(),
//                 },
//             },
//             {
//                 id: `response-${Date.now()}`,
//                 values: Array.from(responseEmbedding.data),
//                 metadata: {
//                     content: response,
//                     session: sessionId,
//                     isUser: false,
//                     timestamp: Date.now(),
//                 },
//             },
//         ]);
//
//         return NextResponse.json({
//             response,
//             matchCount: queryResponse.matches.length,
//             contextLength: context.length,
//         });
//     } catch (error: any) {
//         console.error('Error in /api/query:', error);
//         if (error.response?.status === 401) {
//             return NextResponse.json({error: 'Invalid API key. Please check your configuration.'}, {status: 401});
//         }
//         if (error.response?.status === 429) {
//             return NextResponse.json({error: 'Rate limit exceeded. Please try again later.'}, {status: 429});
//         }
//         return NextResponse.json(
//             {error: error.message || 'Failed to process query. Please try again.'},
//             {status: 500}
//         );
//     }
// }


// import {NextResponse} from 'next/server';
// import {Pinecone} from '@pinecone-database/pinecone';
// import Groq from 'groq-sdk';
// import {pipeline, env} from '@xenova/transformers';
//
// env.allowLocalModels = true;
// env.localModelPath = 'node_modules/@xenova/transformers/models';
//
// const pinecone = new Pinecone({apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!});
// const groq = new Groq({apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!});
// const indexName = 'pdf-chunks';
// const pdfNamespace = 'user-docs';
// const chatNamespace = 'chat-history';
//
// let embedder: any;
//
// async function getEmbedder() {
//     if (!embedder) {
//         embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
//     }
//     return embedder;
// }
//
// export async function POST(request: Request) {
//     try {
//         const {query, sessionId} = await request.json();
//
//         if (!query || !sessionId) {
//             return NextResponse.json({error: 'Query and sessionId are required'}, {status: 400});
//         }
//
//         const embedder = await getEmbedder();
//         const queryEmbedding = await embedder(query, {pooling: 'mean', normalize: true});
//
//         // Fetch PDF context
//         const pdfIndex = pinecone.index(indexName).namespace(pdfNamespace);
//         const queryResponse = await pdfIndex.query({
//             vector: Array.from(queryEmbedding.data) as number[],
//             topK: 5,
//             includeMetadata: true,
//             includeValues: true,
//             filter: {session: {$eq: sessionId}},
//         });
//         const context = queryResponse.matches
//             .map((match) => match.metadata?.text || '')
//             .join('\n\n');
//
//         // Check if matches are relevant (score > 0.5 for cosine similarity)
//         const isRelevant = queryResponse.matches.some((match) => match.score && match.score > 0.5);
//
//         // Fetch chat history (last 5 messages)
//         const chatIndex = pinecone.index(indexName).namespace(chatNamespace);
//         const chatHistoryResponse = await chatIndex.query({
//             vector: Array(384).fill(0), // Neutral vector for metadata filter
//             filter: {session: {$eq: sessionId}},
//             topK: 5,
//             includeMetadata: true,
//         });
//         const historyContext = chatHistoryResponse.matches
//             .map((match) => `${match.metadata?.isUser ? 'User' : 'Assistant'}: ${match.metadata?.content || ''}`)
//             .join('\n');
//
//         let response;
//         if (!context || !isRelevant) {
//             // Fallback: Suggest questions
//             const suggestionContextResponse = await pdfIndex.query({
//                 vector: Array(384).fill(0), // Neutral vector for diverse chunks
//                 topK: 10,
//                 includeMetadata: true,
//                 filter: {session: {$eq: sessionId}},
//             });
//             const suggestionText = suggestionContextResponse.matches
//                 .map((match) => match.metadata?.text || '')
//                 .join('\n');
//
//             const suggestionCompletion = await groq.chat.completions.create({
//                 messages: [
//                     {
//                         role: 'system',
//                         content:
//                             'The user’s query couldn’t be answered with the available PDF context. Based on the provided PDF content, suggest 3 relevant questions the user could ask to explore the document further. Format as a numbered list.',
//                     },
//                     {
//                         role: 'user',
//                         content: `PDF Content:\n${suggestionText}\n\nSuggest 3 questions.`,
//                     },
//                 ],
//                 model: 'llama-3.3-70b-versatile',
//                 temperature: 0.5,
//                 max_tokens: 150,
//             });
//
//             response = `I couldn’t find enough information to answer your question. Here are some questions you could ask:\n${suggestionCompletion.choices[0]?.message?.content || 'No suggestions available.'}`;
//         } else {
//             // Normal response with PDF and chat context
//             const chatCompletion = await groq.chat.completions.create({
//                 messages: [
//                     {
//                         role: 'system',
//                         content:
//                             'You are a helpful PDF assistant that answers questions based solely on the provided PDF context and chat history. If the context or history is insufficient, admit it. Be specific, clear, and concise.',
//                     },
//                     {
//                         role: 'user',
//                         content: `Chat History:\n${historyContext}\n\nPDF Context:\n${context}\n\nQuestion: ${query}`,
//                     },
//                 ],
//                 model: 'llama-3.3-70b-versatile',
//                 temperature: 0.2,
//                 max_tokens: 300,
//             });
//
//             response = chatCompletion.choices[0]?.message?.content || 'No response received.';
//         }
//
//         // Store query and response in chat history
//         const responseEmbedding = await embedder(response, {pooling: 'mean', normalize: true});
//         await chatIndex.upsert([
//             {
//                 id: `query-${Date.now()}`,
//                 values: Array.from(queryEmbedding.data),
//                 metadata: {
//                     content: query,
//                     session: sessionId,
//                     isUser: true,
//                     timestamp: Date.now(),
//                 },
//             },
//             {
//                 id: `response-${Date.now()}`,
//                 values: Array.from(responseEmbedding.data),
//                 metadata: {
//                     content: response,
//                     session: sessionId,
//                     isUser: false,
//                     timestamp: Date.now(),
//                 },
//             },
//         ]);
//
//         return NextResponse.json({
//             response,
//             matchCount: queryResponse.matches.length,
//             contextLength: context.length,
//         });
//     } catch (error: any) {
//         console.error('Error in /api/query:', error);
//         if (error.response?.status === 401) {
//             return NextResponse.json({error: 'Invalid API key. Please check your configuration.'}, {status: 401});
//         }
//         if (error.response?.status === 429) {
//             return NextResponse.json({error: 'Rate limit exceeded. Please try again later.'}, {status: 429});
//         }
//         return NextResponse.json(
//             {error: error.message || 'Failed to process query. Please try again.'},
//             {status: 500}
//         );
//     }
// }


// import {NextResponse} from 'next/server';
// import {Pinecone} from '@pinecone-database/pinecone';
// import Groq from 'groq-sdk';
// import {pipeline, env} from '@xenova/transformers';
//
// env.allowLocalModels = true;
// env.localModelPath = 'node_modules/@xenova/transformers/models';
//
// const pinecone = new Pinecone({apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!});
// const groq = new Groq({apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!});
// const indexName = 'pdf-chunks';
// const pdfNamespace = 'user-docs';
// const chatNamespace = 'chat-history';
//
// let embedder: any;
//
// async function getEmbedder() {
//     if (!embedder) {
//         embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
//     }
//     return embedder;
// }
//
// export async function POST(request: Request) {
//     try {
//         const {query, sessionId} = await request.json();
//
//         if (!query || !sessionId) {
//             return NextResponse.json({error: 'Query and sessionId are required'}, {status: 400});
//         }
//
//         const embedder = await getEmbedder();
//         const queryEmbedding = await embedder(query, {pooling: 'mean', normalize: true});
//
//         // Fetch PDF context
//         const pdfIndex = pinecone.index(indexName).namespace(pdfNamespace);
//         const pdfQueryResponse = await pdfIndex.query({
//             vector: Array.from(queryEmbedding.data) as number[],
//             topK: 5,
//             includeMetadata: true,
//             includeValues: true,
//             filter: {session: {$eq: sessionId}},
//         });
//         const pdfContext = pdfQueryResponse.matches
//             .map((match) => match.metadata?.text || '')
//             .join('\n\n');
//
//         // Check PDF relevance (score > 0.5 for cosine similarity)
//         const isPdfRelevant = pdfQueryResponse.matches.some((match) => match.score && match.score > 0.5);
//
//         // Fetch relevant chat history (similarity search)
//         const chatIndex = pinecone.index(indexName).namespace(chatNamespace);
//         const chatSimilarityResponse = await chatIndex.query({
//             vector: Array.from(queryEmbedding.data) as number[],
//             topK: 3,
//             includeMetadata: true,
//             filter: {session: {$eq: sessionId}},
//         });
//         const chatSimilarityContext = chatSimilarityResponse.matches
//             .map((match) => `${match.metadata?.isUser ? 'User' : 'Assistant'}: ${match.metadata?.content || ''}`)
//             .join('\n');
//
//         // Check chat history relevance (score > 0.6 for conversational similarity)
//         const isChatRelevant = chatSimilarityResponse.matches.some((match) => match.score && match.score > 0.6);
//
//         // Fetch recent chat history (last 5 messages, for context continuity)
//         const chatRecentResponse = await chatIndex.query({
//             vector: Array(384).fill(0), // Neutral vector for metadata filter
//             filter: {session: {$eq: sessionId}},
//             topK: 5,
//             includeMetadata: true,
//         });
//         const chatRecentContext = chatRecentResponse.matches
//             .map((match) => `${match.metadata?.isUser ? 'User' : 'Assistant'}: ${match.metadata?.content || ''}`)
//             .join('\n');
//
//         // Combine contexts (truncate to avoid token overflow)
//         const combinedContext = `Relevant Chat History:\n${chatSimilarityContext}\n\nRecent Chat History:\n${chatRecentContext}\n\nPDF Context:\n${pdfContext}`.slice(0, 2000);
//
//         let response;
//         if (!isPdfRelevant && !isChatRelevant) {
//             // Fallback: Suggest questions based on PDF content
//             const suggestionContextResponse = await pdfIndex.query({
//                 vector: Array(384).fill(0), // Neutral vector for diverse chunks
//                 topK: 10,
//                 includeMetadata: true,
//                 filter: {session: {$eq: sessionId}},
//             });
//             const suggestionText = suggestionContextResponse.matches
//                 .map((match) => match.metadata?.text || '')
//                 .join('\n');
//
//             const suggestionCompletion = await groq.chat.completions.create({
//                 messages: [
//                     {
//                         role: 'system',
//                         content:
//                             'The user’s query couldn’t be answered with the available PDF or chat history context. Based on the provided PDF content, suggest 3 relevant questions the user could ask to explore the document further. Format as a numbered list.',
//                     },
//                     {
//                         role: 'user',
//                         content: `PDF Content:\n${suggestionText}\n\nSuggest 3 questions.`,
//                     },
//                 ],
//                 model: 'llama-3.3-70b-versatile',
//                 temperature: 0.5,
//                 max_tokens: 150,
//             });
//
//             response = `I couldn’t find enough information to answer your question. Here are some questions you could ask:\n${suggestionCompletion.choices[0]?.message?.content || 'No suggestions available.'}`;
//         } else {
//             // Normal response with combined PDF and chat context
//             const chatCompletion = await groq.chat.completions.create({
//                 messages: [
//                     {
//                         role: 'system',
//                         content:
//                             'You are a helpful PDF assistant that answers questions based solely on the provided PDF context and chat history. Use relevant and recent chat history to inform your response, especially for follow-up or ambiguous queries. If the context is insufficient, admit it. Be specific, clear, and concise.',
//                     },
//                     {
//                         role: 'user',
//                         content: `${combinedContext}\n\nQuestion: ${query}`,
//                     },
//                 ],
//                 model: 'llama-3.3-70b-versatile',
//                 temperature: 0.2,
//                 max_tokens: 300,
//             });
//
//             response = chatCompletion.choices[0]?.message?.content || 'No response received.';
//         }
//
//         // Store query and response in chat history
//         const responseEmbedding = await embedder(response, {pooling: 'mean', normalize: true});
//         await chatIndex.upsert([
//             {
//                 id: `query-${Date.now()}`,
//                 values: Array.from(queryEmbedding.data),
//                 metadata: {
//                     content: query,
//                     session: sessionId,
//                     isUser: true,
//                     timestamp: Date.now(),
//                 },
//             },
//             {
//                 id: `response-${Date.now()}`,
//                 values: Array.from(responseEmbedding.data),
//                 metadata: {
//                     content: response,
//                     session: sessionId,
//                     isUser: false,
//                     timestamp: Date.now(),
//                 },
//             },
//         ]);
//
//         return NextResponse.json({
//             response,
//             pdfMatchCount: pdfQueryResponse.matches.length,
//             chatMatchCount: chatSimilarityResponse.matches.length,
//             contextLength: combinedContext.length,
//         });
//     } catch (error: any) {
//         console.error('Error in /api/query:', error);
//         if (error.response?.status === 401) {
//             return NextResponse.json({error: 'Invalid API key. Please check your configuration.'}, {status: 401});
//         }
//         if (error.response?.status === 429) {
//             return NextResponse.json({error: 'Rate limit exceeded. Please try again later.'}, {status: 429});
//         }
//         return NextResponse.json(
//             {error: error.message || 'Failed to process query. Please try again.'},
//             {status: 500}
//         );
//     }
// }


import {NextResponse} from 'next/server';
import {Pinecone} from '@pinecone-database/pinecone';
import Groq from 'groq-sdk';
import {pipeline, env} from '@xenova/transformers';

env.allowLocalModels = true;
env.localModelPath = 'node_modules/@xenova/transformers/models';

const pinecone = new Pinecone({apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY!});
const groq = new Groq({apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY!});
const indexName = 'pdf-chunks';
const pdfNamespace = 'user-docs';
const chatNamespace = 'chat-history';
const feedbackNamespace = 'feedback';

let embedder: any;

async function getEmbedder() {
    if (!embedder) {
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embedder;
}

export async function POST(request: Request) {
    try {
        // const {query, sessionId} = await request.json();
        const {query, sessionId, feedback, responseId} = await request.json();


        const embedder = await getEmbedder();
        const feedbackIndex = pinecone.index(indexName).namespace(feedbackNamespace);

        if (feedback && responseId) {
            if (!sessionId) {
                return NextResponse.json({error: 'sessionId is required for feedback'}, {status: 400});
            }
            const feedbackEmbedding = query
                ? await embedder(query, {pooling: 'mean', normalize: true})
                : Array(384).fill(0);
            await feedbackIndex.upsert([
                {
                    id: `feedback-${Date.now()}`,
                    values: Array.from(feedbackEmbedding),
                    metadata: {
                        responseId,
                        session: sessionId,
                        feedback: feedback.rating,
                        query: query || 'N/A', // Store query or placeholder
                        timestamp: Date.now(),
                    },
                },
            ]);
            return NextResponse.json({message: 'Feedback recorded'});
        }

        if (!query || !sessionId) {
            return NextResponse.json({error: 'Query and sessionId are required'}, {status: 400});
        }

        const queryEmbedding = await embedder(query, {pooling: 'mean', normalize: true});

        // if (feedback && responseId) {
        //     const feedbackEmbedding = await embedder(query, { pooling: 'mean', normalize: true });
        //     await feedbackIndex.upsert([
        //         {
        //             id: `feedback-${Date.now()}`,
        //             values: Array.from(feedbackEmbedding.data),
        //             metadata: {
        //                 responseId,
        //                 session: sessionId,
        //                 feedback: feedback.rating,
        //                 query,
        //                 timestamp: Date.now(),
        //             },
        //         },
        //     ]);
        //     return NextResponse.json({ message: 'Feedback recorded' });
        // }


        const pdfIndex = pinecone.index(indexName).namespace(pdfNamespace);
        const pdfQueryResponse = await pdfIndex.query({
            vector: Array.from(queryEmbedding.data) as number[],
            topK: 5,
            includeMetadata: true,
            includeValues: true,
            filter: {session: {$eq: sessionId}},
        });


        const pdfContext = pdfQueryResponse.matches
            .filter((match) => match.score && match.score > 0.7)
            .concat(
                pdfQueryResponse.matches
                    .filter((match) => match.score && match.score > 0.4 && match.score <= 0.7)
                    .slice(0, 2)
            )
            .map((match) => match.metadata?.text || '')
            .join('\n\n')
            .slice(0, 1000);

        const pdfMatchCount = pdfQueryResponse.matches.length;
        const pdfRelevanceThreshold = pdfMatchCount < 3 ? 0.6 : 0.5;
        const isPdfRelevant = pdfQueryResponse.matches.some((match) => match.score && match.score > pdfRelevanceThreshold);


        const chatIndex = pinecone.index(indexName).namespace(chatNamespace);
        const chatSimilarityResponse = await chatIndex.query({
            vector: Array.from(queryEmbedding.data) as number[],
            topK: 3,
            includeMetadata: true,
            filter: {session: {$eq: sessionId}},
        });
        const chatSimilarityContext = chatSimilarityResponse.matches
            .filter((match) => match.score && match.score > 0.6)
            .map((match) => `${match.metadata?.isUser ? 'User' : 'Assistant'}: ${match.metadata?.content || ''}`)
            .join('\n')
            .slice(0, 500);


        const chatMatchCount = chatSimilarityResponse.matches.length;
        const chatRelevanceThreshold = chatMatchCount < 2 ? 0.7 : 0.6;
        const isChatRelevant = chatSimilarityResponse.matches.some((match) => match.score && match.score > chatRelevanceThreshold);


        const chatRecentResponse = await chatIndex.query({
            vector: Array(384).fill(0),
            filter: {session: {$eq: sessionId}},
            topK: 5,
            includeMetadata: true,
        });
        const chatRecentContext = chatRecentResponse.matches
            .map((match) => `${match.metadata?.isUser ? 'User' : 'Assistant'}: ${match.metadata?.content || ''}`)
            .join('\n')
            .slice(0, 500);


        const combinedContext = `Relevant Chat History:\n${chatSimilarityContext}\n\nRecent Chat History:\n${chatRecentContext}\n\nPDF Context:\n${pdfContext}`.slice(0, 2000);

        let response;
        if (!isPdfRelevant && !isChatRelevant) {
            if (chatSimilarityContext) {
                const partialCompletion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: 'system',
                            content:
                                'The query doesn’t match the PDF content, but relevant chat history is available. Answer based on the chat history alone, admitting if it’s insufficient. Be clear and concise.',
                        },
                        {
                            role: 'user',
                            content: `Chat History:\n${chatSimilarityContext}\n\nQuestion: ${query}`,
                        },
                    ],
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.2,
                    max_tokens: 200,
                });
                const partialResponse = partialCompletion.choices[0]?.message?.content;
                if (partialResponse && !partialResponse.includes('insufficient')) {
                    response = partialResponse;
                }
            }


            if (!response) {
                const suggestionContextResponse = await pdfIndex.query({
                    vector: Array(384).fill(0),
                    topK: 10,
                    includeMetadata: true,
                    filter: {session: {$eq: sessionId}},
                });
                const suggestionText = suggestionContextResponse.matches
                    .map((match) => match.metadata?.text || '')
                    .join('\n');

                const suggestionCompletion = await groq.chat.completions.create({
                    messages: [
                        {
                            role: 'system',
                            content:
                                'The user’s query couldn’t be answered with the available PDF or chat history context. Based on the provided PDF content, suggest 3 relevant questions the user could ask to explore the document further. Format as a numbered list.',
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

                response = `I couldn’t find enough information to answer your question. Here are some questions you could ask:\n${suggestionCompletion.choices[0]?.message?.content || 'No suggestions available.'}`;
            }
        } else {
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a helpful PDF assistant. Answer questions based solely on the provided PDF context and chat history. Prioritize PDF context for factual queries and use chat history for follow-up or ambiguous queries. Follow these steps: 1) Analyze the query and context. 2) Identify relevant information. 3) Provide a clear, concise answer. If the context is insufficient, admit it. Avoid speculation.',
                    },
                    {
                        role: 'user',
                        content: `${combinedContext}\n\nQuestion: ${query}`,
                    },
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.2,
                max_tokens: 300,
            });

            response = chatCompletion.choices[0]?.message?.content || 'No response received.';
        }

        const responseEmbedding = await embedder(response, {pooling: 'mean', normalize: true});
        await chatIndex.upsert([
            {
                id: `query-${Date.now()}`,
                values: Array.from(responseEmbedding.data),
                metadata: {
                    content: query,
                    session: sessionId,
                    isUser: true,
                    timestamp: Date.now(),
                },
            },
            {
                id: `response-${Date.now()}`,
                values: Array.from(responseEmbedding.data),
                metadata: {
                    content: response,
                    session: sessionId,
                    isUser: false,
                    timestamp: Date.now(),
                },
            },
        ]);

        return NextResponse.json({
            response,
            responseId: `response-${Date.now()}`,
            pdfMatchCount,
            chatMatchCount,
            contextLength: combinedContext.length,
            embeddingModel: 'all-MiniLM-L6-v2',
        });
    } catch (error: any) {
        console.error('Error in /api/query:', error);
        if (error.response?.status === 401) {
            return NextResponse.json({error: 'Invalid API key. Please check your configuration.'}, {status: 401});
        }
        if (error.response?.status === 429) {
            return NextResponse.json({error: 'Rate limit exceeded. Please try again later.'}, {status: 429});
        }
        return NextResponse.json(
            {error: error.message || 'Failed to process query. Please try again.'},
            {status: 500}
        );
    }
}