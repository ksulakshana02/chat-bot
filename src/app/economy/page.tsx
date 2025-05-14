"use client"
import {useState, FormEvent} from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const EconomyPage = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = {role: 'user', content: input};
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/economy', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({query: input}),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.response || 'API error');
            const assistantMessage: Message = {role: 'assistant', content: data.response};
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Sorry, something went wrong. Please try again.',
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6">
                <h1 className="text-2xl font-bold text-center mb-4">Economy Comparison Chat</h1>
                <div className="h-96 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`mb-2 p-2 rounded-lg ${
                                msg.role === 'user' ? 'bg-blue-100 ml-8' : 'bg-green-100 mr-8'
                            }`}
                        >
                            <p className="text-sm font-semibold">{msg.role === 'user' ? 'You' : 'Assistant'}</p>
                            <p>{msg.content}</p>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="text-center text-gray-500">Loading...</div>
                    )}
                </div>
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="e.g., Compare economy of USA and Japan"
                        className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
}

export default EconomyPage;