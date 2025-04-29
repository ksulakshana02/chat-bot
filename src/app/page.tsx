// "use client";
//
// import {useState, FormEvent} from 'react';
//
// interface FormData {
//     carType: string;
//     budget: string;
//     brands: string;
// }
//
// interface Car {
//     title: string;
//     price: string;
//     url: string;
//     description: string;
// }
//
// export default function Home() {
//     const [formData, setFormData] = useState<FormData>({carType: '', budget: '', brands: ''});
//     const [results, setResults] = useState<Car[]>([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//
//     const handleSubmit = async (e: FormEvent) => {
//         e.preventDefault();
//         setLoading(true);
//         setError(null);
//         try {
//             const res = await fetch('/api/search', {
//                 method: 'POST',
//                 body: JSON.stringify(formData),
//                 headers: {'Content-Type': 'application/json'},
//             });
//             if (!res.ok) throw new Error('Search failed');
//             const data = await res.json();
//             setResults(data.cars || []);
//         } catch (err) {
//             setError('Failed to fetch results. Please try again.');
//         }
//         setLoading(false);
//     };
//
//     return (
//         <div className="min-h-screen bg-gray-100 py-10 px-4">
//             <div className="max-w-3xl mx-auto">
//                 <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Car Recommender</h1>
//                 <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-8">
//                     <div className="mb-4">
//                         <label htmlFor="carType" className="block text-gray-700 font-medium mb-2">
//                             Car Type (e.g., SUV)
//                         </label>
//                         <input
//                             id="carType"
//                             type="text"
//                             value={formData.carType}
//                             onChange={(e) => setFormData({...formData, carType: e.target.value})}
//                             className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                             required
//                         />
//                     </div>
//                     <div className="mb-4">
//                         <label htmlFor="budget" className="block text-gray-700 font-medium mb-2">
//                             Budget (e.g., 15000-30000)
//                         </label>
//                         <input
//                             id="budget"
//                             type="text"
//                             value={formData.budget}
//                             onChange={(e) => setFormData({...formData, budget: e.target.value})}
//                             className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                             required
//                         />
//                     </div>
//                     <div className="mb-4">
//                         <label htmlFor="brands" className="block text-gray-700 font-medium mb-2">
//                             Brands (e.g., Toyota, Honda)
//                         </label>
//                         <input
//                             id="brands"
//                             type="text"
//                             value={formData.brands}
//                             onChange={(e) => setFormData({...formData, brands: e.target.value})}
//                             className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         />
//                     </div>
//                     <button
//                         type="submit"
//                         disabled={loading}
//                         className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
//                     >
//                         {loading ? 'Searching...' : 'Search'}
//                     </button>
//                 </form>
//                 {error && <p className="text-red-500 text-center mb-4">{error}</p>}
//                 <div>
//                     <h2 className="text-2xl font-semibold text-gray-800 mb-4">Results</h2>
//                     {results.length === 0 ? (
//                         <p className="text-gray-600">No results yet. Submit a search!</p>
//                     ) : (
//                         <div className="grid gap-4">
//                             {results.map((car, i) => (
//                                 <div key={i} className="bg-white p-4 rounded-lg shadow-md">
//                                     <h3 className="text-xl font-medium text-gray-800">{car.title}</h3>
//                                     <p className="text-gray-600">Price: {car.price}</p>
//                                     {car.url && (
//                                         <a
//                                             href={car.url}
//                                             target="_blank"
//                                             rel="noopener noreferrer"
//                                             className="text-blue-500 hover:underline"
//                                         >
//                                             View Listing
//                                         </a>
//                                     )}
//                                     <p className="text-gray-600 mt-2">{car.description}</p>
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }


// "use client";
//
// import { useState, FormEvent, ChangeEvent } from 'react';
//
// interface UploadResponse {
//     message: string;
//     documentId: string;
// }
//
// interface QueryResponse {
//     answer: string;
//     chunks: { text: string; fileName: string }[];
// }
//
// export default function Home() {
//     const [file, setFile] = useState<File | null>(null);
//     const [uploadStatus, setUploadStatus] = useState<string | null>(null);
//     const [question, setQuestion] = useState('');
//     const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//
//     const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
//         if (e.target.files) {
//             setFile(e.target.files[0]);
//             setUploadStatus(null);
//         }
//     };
//
//     const handleUpload = async (e: FormEvent) => {
//         e.preventDefault();
//         if (!file) {
//             setError('Please select a file');
//             return;
//         }
//
//         setLoading(true);
//         setError(null);
//         try {
//             const formData = new FormData();
//             formData.append('file', file);
//             const res = await fetch('/api/upload', {
//                 method: 'POST',
//                 body: formData,
//             });
//             if (!res.ok) throw new Error('Upload failed');
//             const data: UploadResponse = await res.json();
//             setUploadStatus(`Uploaded successfully: ${data.documentId}`);
//             setFile(null);
//         } catch (err) {
//             setError('Upload failed. Please try again.');
//         }
//         setLoading(false);
//     };
//
//     const handleQuery = async (e: FormEvent) => {
//         e.preventDefault();
//         if (!question) {
//             setError('Please enter a question');
//             return;
//         }
//
//         setLoading(true);
//         setError(null);
//         try {
//             const res = await fetch('/api/query', {
//                 method: 'POST',
//                 body: JSON.stringify({ question }),
//                 headers: { 'Content-Type': 'application/json' },
//             });
//             if (!res.ok) throw new Error('Query failed');
//             const data: QueryResponse = await res.json();
//             setQueryResult(data);
//         } catch (err) {
//             setError('Query failed. Please try again.');
//         }
//         setLoading(false);
//     };
//
//     return (
//         <div className="min-h-screen bg-gray-100 py-10 px-4">
//             <div className="max-w-3xl mx-auto">
//                 <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Document Q&A</h1>
//
//                 {/* Upload Form */}
//                 <form onSubmit={handleUpload} className="bg-white p-6 rounded-lg shadow-md mb-8">
//                     <div className="mb-4">
//                         <label htmlFor="file" className="block text-gray-700 font-medium mb-2">
//                             Upload PDF or Text File
//                         </label>
//                         <input
//                             id="file"
//                             type="file"
//                             accept=".pdf,.txt"
//                             onChange={handleFileChange}
//                             className="w-full p-3 border rounded-md"
//                         />
//                     </div>
//                     <button
//                         type="submit"
//                         disabled={loading || !file}
//                         className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
//                     >
//                         {loading ? 'Uploading...' : 'Upload'}
//                     </button>
//                 </form>
//                 {uploadStatus && <p className="text-green-500 text-center mb-4">{uploadStatus}</p>}
//                 {error && <p className="text-red-500 text-center mb-4">{error}</p>}
//
//                 {/* Query Form */}
//                 <form onSubmit={handleQuery} className="bg-white p-6 rounded-lg shadow-md mb-8">
//                     <div className="mb-4">
//                         <label htmlFor="question" className="block text-gray-700 font-medium mb-2">
//                             Ask a Question
//                         </label>
//                         <input
//                             id="question"
//                             type="text"
//                             value={question}
//                             onChange={(e) => setQuestion(e.target.value)}
//                             className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                             placeholder="e.g., What is the main topic of the document?"
//                         />
//                     </div>
//                     <button
//                         type="submit"
//                         disabled={loading}
//                         className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
//                     >
//                         {loading ? 'Querying...' : 'Ask'}
//                     </button>
//                 </form>
//
//                 {/* Results */}
//                 {queryResult && (
//                     <div className="bg-white p-6 rounded-lg shadow-md">
//                         <h2 className="text-2xl font-semibold text-gray-800 mb-4">Answer</h2>
//                         <p className="text-gray-600 mb-4">{queryResult.answer}</p>
//                         <h3 className="text-xl font-medium text-gray-800 mb-2">Relevant Chunks</h3>
//                         {queryResult.chunks.map((chunk, i) => (
//                             <div key={i} className="mb-4">
//                                 <p className="text-gray-600"><strong>File:</strong> {chunk.fileName}</p>
//                                 <p className="text-gray-600">{chunk.text}</p>
//                             </div>
//                         ))}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }

// "use client"
// import {useState} from 'react';
//
// export default function Home() {
//     const [file, setFile] = useState<File | null>(null);
//     const [documentId, setDocumentId] = useState<string | null>(null);
//     const [question, setQuestion] = useState('');
//     const [answer, setAnswer] = useState('');
//     const [loading, setLoading] = useState(false);
//     const [uploadMessage, setUploadMessage] = useState('');
//
//     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const selectedFile = e.target.files?.[0];
//         if (selectedFile) {
//             setFile(selectedFile);
//         }
//     };

// const handleUpload = async () => {
//     if (!file) {
//         setUploadMessage('Please select a file');
//         return;
//     }
//
//     setLoading(true);
//     const formData = new FormData();
//     formData.append('file', file);
//
//     try {
//         const response = await fetch('/api/upload', {
//             method: 'POST',
//             body: formData,
//         });
//
//         const data = await response.json();
//         if (response.ok) {
//             setUploadMessage(data.message);
//             setDocumentId(data.documentId);
//         } else {
//             setUploadMessage(data.message || 'Upload failed');
//         }
//     } catch (error) {
//         setUploadMessage('Error uploading file');
//         console.log(error);
//     } finally {
//         setLoading(false);
//     }
// };

//     const handleUpload = async () => {
//         if (!file) {
//             setUploadMessage('Please select a file');
//             return;
//         }
//
//         setLoading(true);
//         const formData = new FormData();
//         formData.append('file', file);
//
//         try {
//             const response = await fetch('/api/upload', {
//                 method: 'POST',
//                 body: formData,
//             });
//
//             if (!response.ok) {
//                 const text = await response.text(); // Get raw response for debugging
//                 throw new Error(`Upload failed: ${response.status} - ${text}`);
//             }
//
//             const data = await response.json();
//             setUploadMessage(data.message);
//             setDocumentId(data.documentId);
//         } catch (error) {
//             setUploadMessage(error instanceof Error ? error.message : 'Error uploading file');
//             console.error('Upload error:', error);
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     const handleAskQuestion = async () => {
//         if (!question || !documentId) return;
//
//         setLoading(true);
//         try {
//             const response = await fetch('/api/ask', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({question, documentId}),
//             });
//
//             const data = await response.json();
//             if (response.ok) {
//                 setAnswer(data.answer);
//             } else {
//                 setAnswer('Error getting answer');
//             }
//         } catch (error) {
//             setAnswer('Error getting answer');
//         } finally {
//             setLoading(false);
//             setQuestion('');
//         }
//     };
//
//     return (
//         <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
//             <h1 className="text-3xl font-bold mb-6">Document Q&A System</h1>
//
//             <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md mb-6">
//                 <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
//                 <input
//                     type="file"
//                     accept=".pdf"
//                     onChange={handleFileChange}
//                     className="mb-4 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//                 />
//                 <button
//                     onClick={handleUpload}
//                     disabled={loading || !file}
//                     className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
//                 >
//                     {loading ? 'Uploading...' : 'Upload'}
//                 </button>
//                 {uploadMessage && <p className="mt-2 text-green-600">{uploadMessage}</p>}
//             </div>
//
//             {documentId && (
//                 <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
//                     <h2 className="text-xl font-semibold mb-4">Ask a Question</h2>
//                     <textarea
//                         value={question}
//                         onChange={(e) => setQuestion(e.target.value)}
//                         placeholder="Type your question here..."
//                         className="w-full p-2 border rounded-lg mb-4 resize-none"
//                         rows={3}
//                     />
//                     <button
//                         onClick={handleAskQuestion}
//                         disabled={loading || !question}
//                         className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
//                     >
//                         {loading ? 'Processing...' : 'Ask'}
//                     </button>
//                     {answer && (
//                         <div className="mt-4 p-4 bg-gray-50 rounded-lg">
//                             <h3 className="font-semibold">Answer:</h3>
//                             <p>{answer}</p>
//                         </div>
//                     )}
//                 </div>
//             )}
//         </div>
//     );
// }

//
// 'use client';
//
// import {useState, useEffect, useRef} from 'react';
//
// interface Message {
//     id: number;
//     content: string;
//     isUser: boolean;
// }
//
// export default function Home() {
//     const [file, setFile] = useState<File | null>(null);
//     const [messages, setMessages] = useState<Message[]>([]);
//     const [query, setQuery] = useState('');
//     const [isUploading, setIsUploading] = useState(false);
//     const [isQuerying, setIsQuerying] = useState(false);
//     const fileInputRef = useRef<HTMLInputElement>(null);
//     const chatContainerRef = useRef<HTMLDivElement>(null);
//
//     useEffect(() => {
//         if (chatContainerRef.current) {
//             chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
//         }
//     }, [messages]);
//
//     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         if (e.target.files && e.target.files[0]) {
//             setFile(e.target.files[0]);
//         }
//     };
//
//     const handleUpload = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!file) {
//             setMessages((prev) => [
//                 ...prev,
//                 {id: Date.now(), content: 'Please select a PDF file to upload.', isUser: false},
//             ]);
//             return;
//         }
//
//         setIsUploading(true);
//         const formData = new FormData();
//         formData.append('file', file);
//
//         try {
//             const res = await fetch('/api/upload', {
//                 method: 'POST',
//                 body: formData,
//             });
//
//             const data = await res.json();
//
//             if (!res.ok) {
//                 throw new Error(data.error || 'Failed to upload PDF');
//             }
//
//             setMessages((prev) => [
//                 ...prev,
//                 {id: Date.now(), content: 'PDF uploaded and indexed successfully!', isUser: false},
//             ]);
//             setFile(null);
//             if (fileInputRef.current) {
//                 fileInputRef.current.value = ''; // Reset file input
//             }
//         } catch (error: any) {
//             setMessages((prev) => [
//                 ...prev,
//                 {
//                     id: Date.now(),
//                     content: error.message || 'Failed to upload PDF. Please try again.',
//                     isUser: false,
//                 },
//             ]);
//         } finally {
//             setIsUploading(false);
//         }
//     };
//
//     const handleQuery = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!query.trim()) {
//             setMessages((prev) => [
//                 ...prev,
//                 {id: Date.now(), content: 'Please enter a question.', isUser: false},
//             ]);
//             return;
//         }
//
//         const userMessage: Message = {id: Date.now(), content: query, isUser: true};
//         setMessages((prev) => [...prev, userMessage]);
//         setQuery('');
//         setIsQuerying(true);
//
//         try {
//             const res = await fetch('/api/query', {
//                 method: 'POST',
//                 headers: {'Content-Type': 'application/json'},
//                 body: JSON.stringify({query}),
//             });
//
//             const data = await res.json();
//
//             if (!res.ok) {
//                 throw new Error(data.error || 'Failed to fetch response');
//             }
//
//             const botMessage: Message = {
//                 id: Date.now() + 1,
//                 content: data.response || 'No response received.',
//                 isUser: false,
//             };
//             setMessages((prev) => [...prev, botMessage]);
//         } catch (error: any) {
//             setMessages((prev) => [
//                 ...prev,
//                 {
//                     id: Date.now() + 1,
//                     content: error.message || 'Failed to process query. Please try again.',
//                     isUser: false,
//                 },
//             ]);
//         } finally {
//             setIsQuerying(false);
//         }
//     };
//
//     return (
//         <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
//             <div className="bg-white rounded-lg shadow-lg w-full max-w-lg flex flex-col h-[600px]">
//                 {/* Header */}
//                 <div className="bg-blue-600 text-white p-4 rounded-t-lg">
//                     <h1 className="text-lg font-semibold">PDF Q&A Assistant</h1>
//                     <p className="text-sm">Upload a PDF and ask questions about its content!</p>
//                 </div>
//
//                 {/* Chat Messages */}
//                 <div
//                     ref={chatContainerRef}
//                     className="flex-1 p-4 overflow-y-auto flex flex-col gap-4"
//                 >
//                     {messages.length === 0 ? (
//                         <p className="text-gray-500 text-center mt-10">
//                             Upload a PDF to start asking questions.
//                         </p>
//                     ) : (
//                         messages.map((msg) => (
//                             <div
//                                 key={msg.id}
//                                 className={`p-3 rounded-lg max-w-[80%] ${
//                                     msg.isUser
//                                         ? 'bg-blue-100 ml-auto text-right'
//                                         : 'bg-gray-200 mr-auto text-left'
//                                 }`}
//                             >
//                                 {msg.content}
//                             </div>
//                         ))
//                     )}
//                 </div>
//
//                 {/* Upload Form */}
//                 <form onSubmit={handleUpload} className="p-4 border-t bg-gray-50">
//                     <div className="flex flex-col gap-2">
//                         <input
//                             type="file"
//                             accept=".pdf"
//                             ref={fileInputRef}
//                             onChange={handleFileChange}
//                             className="p-2 border rounded-lg text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
//                             disabled={isUploading}
//                         />
//                         <button
//                             type="submit"
//                             className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
//                             disabled={isUploading || !file}
//                         >
//                             {isUploading ? 'Uploading...' : 'Upload PDF'}
//                         </button>
//                     </div>
//                 </form>
//
//                 {/* Query Form */}
//                 <form onSubmit={handleQuery} className="p-4 border-t bg-gray-50">
//                     <div className="flex gap-2">
//                         <input
//                             type="text"
//                             value={query}
//                             onChange={(e) => setQuery(e.target.value)}
//                             placeholder="Ask a question about the PDF..."
//                             className="flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
//                             disabled={isQuerying}
//                         />
//                         <button
//                             type="submit"
//                             className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
//                             disabled={isQuerying}
//                         >
//                             {isQuerying ? 'Querying...' : 'Ask'}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }


// src/app/page.tsx
// 'use client';
//
// import { useState, useEffect, useRef } from 'react';
//
// interface Message {
//     id: number;
//     content: string;
//     isUser: boolean;
// }
//
// export default function Home() {
//     const [file, setFile] = useState<File | null>(null);
//     const [messages, setMessages] = useState<Message[]>([]);
//     const [query, setQuery] = useState('');
//     const [isUploading, setIsUploading] = useState(false);
//     const [isQuerying, setIsQuerying] = useState(false);
//     const fileInputRef = useRef<HTMLInputElement>(null);
//     const chatContainerRef = useRef<HTMLDivElement>(null);
//
//     // Auto-scroll to the bottom when new messages are added
//     useEffect(() => {
//         if (chatContainerRef.current) {
//             chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
//         }
//     }, [messages]);
//
//     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         if (e.target.files && e.target.files[0]) {
//             setFile(e.target.files[0]);
//         }
//     };
//
//     const handleUpload = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!file) {
//             setMessages((prev) => [
//                 ...prev,
//                 { id: Date.now(), content: 'Please select a PDF file to upload.', isUser: false },
//             ]);
//             return;
//         }
//
//         setIsUploading(true);
//         const formData = new FormData();
//         formData.append('file', file);
//
//         try {
//             const res = await fetch('/api/upload', {
//                 method: 'POST',
//                 body: formData,
//             });
//
//             const data = await res.json();
//
//             if (!res.ok) {
//                 throw new Error(data.error || 'Failed to upload PDF');
//             }
//
//             setMessages((prev) => [
//                 ...prev,
//                 { id: Date.now(), content: data.message, isUser: false },
//             ]);
//             setFile(null);
//             if (fileInputRef.current) {
//                 fileInputRef.current.value = '';
//             }
//         } catch (error: any) {
//             setMessages((prev) => [
//                 ...prev,
//                 {
//                     id: Date.now(),
//                     content: error.message || 'Failed to upload PDF. Please try again.',
//                     isUser: false,
//                 },
//             ]);
//         } finally {
//             setIsUploading(false);
//         }
//     };
//
//     const handleQuery = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!query.trim()) {
//             setMessages((prev) => [
//                 ...prev,
//                 { id: Date.now(), content: 'Please enter a question.', isUser: false },
//             ]);
//             return;
//         }
//
//         const userMessage: Message = { id: Date.now(), content: query, isUser: true };
//         setMessages((prev) => [...prev, userMessage]);
//         setQuery('');
//         setIsQuerying(true);
//
//         try {
//             const res = await fetch('/api/query', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ query }),
//             });
//
//             const data = await res.json();
//
//             if (!res.ok) {
//                 throw new Error(data.error || 'Failed to fetch response');
//             }
//
//             const botMessage: Message = {
//                 id: Date.now() + 1,
//                 content: data.response || 'No response received.',
//                 isUser: false,
//             };
//             setMessages((prev) => [...prev, botMessage]);
//         } catch (error: any) {
//             setMessages((prev) => [
//                 ...prev,
//                 {
//                     id: Date.now() + 1,
//                     content: error.message || 'Failed to process query. Please try again.',
//                     isUser: false,
//                 },
//             ]);
//         } finally {
//             setIsQuerying(false);
//         }
//     };
//
//     return (
//         <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
//             <div className="bg-white rounded-lg shadow-lg w-full max-w-lg flex flex-col h-[600px]">
//                 {/* Header */}
//                 <div className="bg-blue-600 text-white p-4 rounded-t-lg">
//                     <h1 className="text-lg font-semibold">PDF Q&A Assistant</h1>
//                     <p className="text-sm">Upload a PDF and ask questions about its content!</p>
//                 </div>
//
//                 {/* Chat Messages */}
//                 <div
//                     ref={chatContainerRef}
//                     className="flex-1 p-4 overflow-y-auto flex flex-col gap-4"
//                 >
//                     {messages.length === 0 ? (
//                         <p className="text-gray-500 text-center mt-10">
//                             Upload a PDF to start asking questions.
//                         </p>
//                     ) : (
//                         <>
//                             {isUploading && (
//                                 <p className="text-gray-500 text-center">Processing PDF, please wait...</p>
//                             )}
//                             {messages.map((msg) => (
//                                 <div
//                                     key={msg.id}
//                                     className={`p-3 rounded-lg max-w-[80%] ${
//                                         msg.isUser
//                                             ? 'bg-blue-100 ml-auto text-right'
//                                             : 'bg-gray-200 mr-auto text-left'
//                                     } ${!msg.isUser && msg.content.includes('Failed') ? 'bg-red-100' : ''}`}
//                                 >
//                                     {msg.content}
//                                 </div>
//                             ))}
//                         </>
//                     )}
//                 </div>
//
//                 {/* Upload Form */}
//                 <form onSubmit={handleUpload} className="p-4 border-t bg-gray-50">
//                     <div className="flex flex-col gap-2">
//                         <input
//                             type="file"
//                             accept=".pdf"
//                             ref={fileInputRef}
//                             onChange={handleFileChange}
//                             className="p-2 border rounded-lg text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
//                             disabled={isUploading}
//                         />
//                         <button
//                             type="submit"
//                             className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
//                             disabled={isUploading || !file}
//                         >
//                             {isUploading ? 'Uploading...' : 'Upload PDF'}
//                         </button>
//                     </div>
//                 </form>
//
//                 {/* Query Form */}
//                 <form onSubmit={handleQuery} className="p-4 border-t bg-gray-50">
//                     <div className="flex gap-2">
//                         <input
//                             type="text"
//                             value={query}
//                             onChange={(e) => setQuery(e.target.value)}
//                             placeholder="Ask a question about the PDF..."
//                             className="flex-1 p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
//                             disabled={isQuerying}
//                         />
//                         <button
//                             type="submit"
//                             className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
//                             disabled={isQuerying}
//                         >
//                             {isQuerying ? 'Querying...' : 'Ask'}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// }


'use client';

import {useState, useEffect, useRef} from 'react';
import {AnimatePresence, motion} from 'framer-motion';

interface Message {
    id: number;
    content: string;
    isUser: boolean;
}

interface Stats {
    pages: number;
    chunks: number;
    totalCharacters: number;
}

export default function Home() {
    const [file, setFile] = useState<File | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [query, setQuery] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isQuerying, setIsQuerying] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const queryInputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to the bottom when new messages are added
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setMessages((prev) => [
                ...prev,
                {id: Date.now(), content: 'Please select a PDF file to upload.', isUser: false},
            ]);
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to upload PDF');
            }

            setCurrentSessionId(data.sessionId);
            setStats(data.stats);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    content: `Successfully processed "${file.name}" (${data.stats.pages} pages). You can now ask questions about the content!`,
                    isUser: false
                },
            ]);
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            // Focus on query input after successful upload
            if (queryInputRef.current) {
                queryInputRef.current.focus();
            }
        } catch (error: any) {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    content: error.message || 'Failed to upload PDF. Please try again.',
                    isUser: false,
                },
            ]);
        } finally {
            setIsUploading(false);
        }
    };

    const handleQuery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) {
            return;
        }

        if (!currentSessionId) {
            setMessages((prev) => [
                ...prev,
                {id: Date.now(), content: 'Please upload a PDF first before asking questions.', isUser: false},
            ]);
            return;
        }

        const userMessage: Message = {id: Date.now(), content: query, isUser: true};
        setMessages((prev) => [...prev, userMessage]);
        setQuery('');
        setIsQuerying(true);

        try {
            const res = await fetch('/api/query', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({query, sessionId: currentSessionId}),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch response');
            }

            const botMessage: Message = {
                id: Date.now() + 1,
                content: data.response || 'No response received.',
                isUser: false,
            };
            setMessages((prev) => [...prev, botMessage]);
        } catch (error: any) {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    content: error.message || 'Failed to process query. Please try again.',
                    isUser: false,
                },
            ]);
        } finally {
            setIsQuerying(false);
        }
    };

    const handleNewSession = () => {
        setCurrentSessionId(null);
        setMessages([]);
        setStats(null);
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl flex flex-col h-[700px]">
                {/* Header */}
                <div
                    className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-t-lg flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold">PDF Q&A Assistant</h1>
                        <p className="text-sm opacity-80">Upload a PDF and ask questions about its content!</p>
                    </div>
                    {currentSessionId && (
                        <button
                            onClick={handleNewSession}
                            className="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
                        >
                            New Session
                        </button>
                    )}
                </div>

                {/* Stats Bar (Only visible when PDF is processed) */}
                {stats && (
                    <div className="bg-blue-50 p-2 text-xs text-blue-800 flex justify-between border-b border-blue-100">
                        <span>Pages: {stats.pages}</span>
                        <span>Chunks: {stats.chunks}</span>
                        <span>Characters: {stats.totalCharacters.toLocaleString()}</span>
                    </div>
                )}

                {/* Chat Messages */}
                <div
                    ref={chatContainerRef}
                    className="flex-1 p-4 overflow-y-auto flex flex-col gap-4"
                >
                    {messages.length === 0 ? (
                        <div className="text-gray-500 text-center mt-10 flex flex-col items-center gap-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-300" fill="none"
                                 viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            <p>Upload a PDF to start asking questions.</p>
                        </div>
                    ) : (
                        <>
                            <AnimatePresence>
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{opacity: 0, y: 10}}
                                        animate={{opacity: 1, y: 0}}
                                        transition={{duration: 0.3}}
                                        className={`p-3 rounded-lg max-w-[85%] ${
                                            msg.isUser
                                                ? 'bg-blue-100 ml-auto text-right'
                                                : 'bg-gray-100 mr-auto text-left'
                                        } ${!msg.isUser && msg.content.includes('Failed') ? 'bg-red-100 text-red-700' : ''}`}
                                    >
                                        {msg.content}
                                    </motion.div>
                                ))}
                                {isUploading && (
                                    <motion.div
                                        initial={{opacity: 0}}
                                        animate={{opacity: 1}}
                                        className="flex items-center gap-2 p-3 rounded-lg bg-gray-100 mr-auto"
                                    >
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                                                 style={{animationDelay: '0.2s'}}></div>
                                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                                                 style={{animationDelay: '0.4s'}}></div>
                                        </div>
                                        <span className="text-sm text-gray-600">Processing PDF...</span>
                                    </motion.div>
                                )}
                                {isQuerying && (
                                    <motion.div
                                        initial={{opacity: 0}}
                                        animate={{opacity: 1}}
                                        className="flex items-center gap-2 p-3 rounded-lg bg-gray-100 mr-auto"
                                    >
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                                                 style={{animationDelay: '0.2s'}}></div>
                                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                                                 style={{animationDelay: '0.4s'}}></div>
                                        </div>
                                        <span className="text-sm text-gray-600">Thinking...</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    )}
                </div>

                {/* Upload Form */}
                {!currentSessionId && (
                    <form onSubmit={handleUpload} className="p-4 border-t bg-gray-50">
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-col">
                                <label htmlFor="pdf-upload" className="text-sm font-medium text-gray-700 mb-1">Upload
                                    PDF Document</label>
                                <input
                                    id="pdf-upload"
                                    type="file"
                                    accept=".pdf"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="p-2 border rounded-lg text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                                    disabled={isUploading}
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                disabled={isUploading || !file}
                            >
                                {isUploading ? 'Processing PDF...' : 'Upload and Process PDF'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Query Form */}
                <form onSubmit={handleQuery} className="p-4 border-t bg-gray-50">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={currentSessionId ? "Ask a question about the PDF..." : "Upload a PDF first to ask questions"}
                            className="flex-1 p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            disabled={isQuerying || !currentSessionId}
                            ref={queryInputRef}
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            disabled={isQuerying || !currentSessionId || !query.trim()}
                        >
                            {isQuerying ? 'Processing...' : 'Ask'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}