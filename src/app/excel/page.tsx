// "use client"
// import {useState} from 'react';
//
// const ExcelPage = () => {
//     const [file, setFile] = useState<File | null>(null);
//     const [result, setResult] = useState<any | null>(null);
//     const [error, setError] = useState<string>('');
//     const [loading, setLoading] = useState<boolean>(false);
//
//     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const selectedFile = e.target.files?.[0];
//         if (
//             selectedFile &&
//             (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
//                 selectedFile.type === 'application/vnd.ms-excel')
//         ) {
//             setFile(selectedFile);
//             setError('');
//         } else {
//             setError('Please upload a valid Excel file (.xlsx or .xls)');
//             setFile(null);
//         }
//     };
//
//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!file) {
//             setError('No file selected');
//             return;
//         }
//
//         setLoading(true);
//         const formData = new FormData();
//         formData.append('file', file);
//
//         try {
//             const response = await fetch('/api/process-excel', {
//                 method: 'POST',
//                 body: formData,
//             });
//             if (!response.ok) throw new Error('Failed to process file');
//             const data = await response.json();
//             setResult(data);
//             setError('');
//         } catch (err) {
//             setError('Error processing file. Please try again.');
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     return (
//         <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
//             <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
//                 <h1 className="text-2xl font-bold mb-6 text-center">Excel Data Processor</h1>
//                 <form onSubmit={handleSubmit} className="space-y-4">
//                     <div>
//                         <label htmlFor="file" className="block text-sm font-medium text-gray-700">
//                             Upload Excel File
//                         </label>
//                         <input
//                             type="file"
//                             id="file"
//                             accept=".xlsx,.xls"
//                             onChange={handleFileChange}
//                             className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//                         />
//                     </div>
//                     {error && <p className="text-red-500 text-sm">{error}</p>}
//                     <button
//                         type="submit"
//                         disabled={loading || !file}
//                         className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
//                     >
//                         {loading ? 'Processing...' : 'Process File'}
//                     </button>
//                 </form>
//             </div>
//
//             {result && (
//                 <div className="mt-8 bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
//                     <h2 className="text-xl font-semibold mb-4">Results</h2>
//                     <div className="mb-4">
//                         <h3 className="text-lg font-medium">Extracted Data</h3>
//                         <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-64">
//               {JSON.stringify(result.data, null, 2)}
//             </pre>
//                     </div>
//                     <div>
//                         <h3 className="text-lg font-medium">Open AI Summary</h3>
//                         <p className="bg-gray-100 p-4 rounded-md">{result.openAIResponse}</p>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// }
//
// export default ExcelPage;

"use client"
import React, {useState} from 'react';

export default function Home() {
    const [file, setFile] = useState<File | null>(null);
    const [query, setQuery] = useState<string>('');
    const [result, setResult] = useState<{ data: any[]; openAIResponse: string } | null>(null);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (
            selectedFile &&
            (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                selectedFile.type === 'application/vnd.ms-excel' ||
                selectedFile.type === 'text/csv')
        ) {
            setFile(selectedFile);
            setError('');
        } else {
            setError('Please upload a valid CSV or Excel file (.csv, .xlsx, .xls)');
            setFile(null);
        }
    };

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('No file selected');
            return;
        }
        if (!query.trim()) {
            setError('Please enter a query');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('query', query);

        try {
            const response = await fetch('/api/process-excel', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) throw new Error('Failed to process file');
            const data = await response.json();
            setResult(data);
            setError('');
        } catch (err) {
            setError('Error processing file. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Excel/CSV Data Processor</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                            Upload CSV or Excel File
                        </label>
                        <input
                            type="file"
                            id="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileChange}
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                    <div>
                        <label htmlFor="query" className="block text-sm font-medium text-gray-700">
                            Data Query
                        </label>
                        <input
                            type="text"
                            id="query"
                            value={query}
                            onChange={handleQueryChange}
                            placeholder="Enter columns to extract"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading || !file || !query.trim()}
                        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {loading ? 'Processing...' : 'Process File'}
                    </button>
                </form>
            </div>

            {result && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
                    <h2 className="text-xl font-semibold mb-4">Results</h2>
                    <div className="mb-4">
                        <h3 className="text-lg font-medium">Extracted Data</h3>
                        <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-64">
              {JSON.stringify(result.data, null, 2)}
            </pre>
                    </div>
                    <div>
                        <h3 className="text-lg font-medium">Open AI Response</h3>
                        <p className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap">{result.openAIResponse}</p>
                    </div>
                </div>
            )}
        </div>
    );
}