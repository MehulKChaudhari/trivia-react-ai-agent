import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, RefreshCcw, Sun, Moon } from 'lucide-react';

const TriviaGame = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [gameState, setGameState] = useState({
        score: 0,
        emojis: [],
        categories: [],
        gameStarted: false,
        currentQuestion: null,
        difficulty: 1,
        isGameOver: false,
        waitingForAnswer: false
    });

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        startNewGame();
    }, []);

    const startNewGame = async () => {
        setIsLoading(true);
        setMessages([]);
        setGameState({
            score: 0,
            emojis: [],
            categories: [],
            gameStarted: false,
            currentQuestion: null,
            difficulty: 1,
            isGameOver: false,
            waitingForAnswer: false
        });

        try {
            const response = await fetch('http://localhost:3001/api/start-game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();
            setMessages([{ role: 'assistant', content: data.response }]);
            setGameState(prev => ({
                ...prev,
                ...(data.gameState || {}),
                waitingForAnswer: true
            }));
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || !gameState.waitingForAnswer) return;

        setIsLoading(true);
        const userMessage = { role: 'user', content: inputMessage };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');

        try {
            const response = await fetch('http://localhost:3001/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: inputMessage,
                    gameState
                })
            });

            const data = await response.json();
            setGameState(prev => ({
                ...prev,
                ...(data.gameState || {}),
                waitingForAnswer: true
            }));
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        <div className={`flex justify-center items-center min-h-screen p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className={`w-full max-w-2xl rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {/* Header */}
                <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Snarky Trivia Master
                            </h1>
                            <div className="flex gap-2 mt-2">
                                {(gameState.emojis || []).map((emoji, i) => (
                                    <span key={i} className="text-2xl">{emoji}</span>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={toggleTheme}
                                className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}
                            >
                                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <button
                                onClick={startNewGame}
                                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                            >
                                <RefreshCcw size={16} />
                                New Game
                            </button>
                        </div>
                    </div>
                </div>

                {/* Messages Container */}
                <div className={`h-[500px] overflow-y-auto p-4 space-y-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-4 ${message.role === 'user'
                                        ? 'bg-purple-600 text-white'
                                        : isDarkMode
                                            ? 'bg-gray-700 text-white'
                                            : 'bg-gray-100 text-gray-900'
                                    }`}
                            >
                                <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <Loader2 className={`animate-spin ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className={`border-t p-4 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            className={`flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-200 text-gray-900'
                                }`}
                            placeholder={gameState.isGameOver ? "Game Over! Click 'New Game' to play again" : "Type your answer..."}
                            disabled={gameState.isGameOver || isLoading || !gameState.waitingForAnswer}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={gameState.isGameOver || isLoading || !inputMessage.trim() || !gameState.waitingForAnswer}
                            className="bg-purple-600 text-white rounded-lg px-4 py-2 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TriviaGame;