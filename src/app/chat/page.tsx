'use client';

import {useState, useEffect, useRef} from 'react';

interface Message {
    id: number;
    content: string;
    isUser: boolean;
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // const handleSubmit = async (e: React.FormEvent) => {
    //     e.preventDefault();
    //     if (!input.trim()) return;
    //
    //     const userMessage: Message = {
    //         id: Date.now(),
    //         content: input,
    //         isUser: true,
    //     };
    //     setMessages((prev) => [...prev, userMessage]);
    //     setInput('');
    //     setIsLoading(true);
    //
    //     try {
    //         const res = await fetch('/api/chat', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ message: input }),
    //         });
    //
    //         if (!res.ok) throw new Error('Failed to fetch response');
    //
    //         const data = await res.json();
    //         const botMessage: Message = {
    //             id: Date.now() + 1,
    //             content: data.response,
    //             isUser: false,
    //         };
    //         setMessages((prev) => [...prev, botMessage]);
    //     } catch (error) {
    //         console.error('Error:', error);
    //         const errorMessage: Message = {
    //             id: Date.now() + 1,
    //             content: 'Sorry, something went wrong. Please try again.',
    //             isUser: false,
    //         };
    //         setMessages((prev) => [...prev, errorMessage]);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now(),
            content: input,
            isUser: true,
        };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({message: input}),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to fetch response');
            }

            const botMessage: Message = {
                id: Date.now() + 1,
                content: data.response,
                isUser: false,
            };
            setMessages((prev) => [...prev, botMessage]);
        } catch (error: any) {
            console.error('Error:', error);
            const errorMessage: Message = {
                id: Date.now() + 1,
                content: error.message || 'Sorry, something went wrong. Please try again.',
                isUser: false,
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-[600px]">
                <div className="bg-blue-600 text-white p-4 rounded-t-lg">
                    <h1 className="text-lg font-semibold">Chatbot</h1>
                </div>

                <div
                    ref={chatContainerRef}
                    className="flex-1 p-4 overflow-y-auto flex flex-col gap-4"
                >
                    {messages.length === 0 ? (
                        <p className="text-gray-500 text-center">Start chatting!</p>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`p-3 rounded-lg max-w-[80%] ${
                                    msg.isUser
                                        ? 'bg-blue-100 ml-auto text-right'
                                        : 'bg-gray-200 mr-auto'
                                }`}
                            >
                                {msg.content}
                            </div>
                        ))
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-4 border-t">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}