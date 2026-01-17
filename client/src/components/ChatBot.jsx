import { useState, useRef, useEffect } from 'react';
import { sendMessage } from '../api/chatbot.api';

const ChatBot = ({ user }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `Hello ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your KnowledgeShare assistant. How can I help you today?`
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSendMessage = async (e) => {
        e?.preventDefault();

        const trimmedInput = inputValue.trim();
        if (!trimmedInput || isLoading) return;

        // Add user message
        const userMessage = { role: 'user', content: trimmedInput };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Prepare history (exclude first welcome message)
            const history = messages.slice(1).map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const response = await sendMessage(trimmedInput, history);

            if (response.success) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: response.data.response
                }]);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            // Show actual error message for debugging
            const errorMsg = error.response?.data?.message || error.message || "I encountered an unknown error.";
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `⚠️ Error: ${errorMsg}`
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const clearChat = () => {
        setMessages([{
            role: 'assistant',
            content: `Chat cleared! How can I help you, ${user?.name?.split(' ')[0] || 'there'}?`
        }]);
    };

    return (
        <div className="chatbot-container">
            {/* Chat Toggle Button */}
            <button
                className={`chatbot-toggle ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close chat' : 'Open chat'}
            >
                {isOpen ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="chatbot-window">
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="chatbot-header-info">
                            <div className="chatbot-avatar">🤖</div>
                            <div>
                                <h3>DKN Assistant</h3>
                                <span className="chatbot-status">
                                    <span className="status-dot"></span>
                                    Online
                                </span>
                            </div>
                        </div>
                        <div className="chatbot-header-actions">
                            <button onClick={clearChat} title="Clear chat" className="chatbot-action-btn">
                                🗑️
                            </button>
                            <button onClick={() => setIsOpen(false)} title="Close" className="chatbot-action-btn">
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`chatbot-message ${msg.role === 'user' ? 'user' : 'assistant'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="message-avatar">🤖</div>
                                )}
                                <div className="message-content">
                                    {msg.content}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="message-avatar user-avatar">
                                        {user?.name?.charAt(0)?.toUpperCase() || '👤'}
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="chatbot-message assistant">
                                <div className="message-avatar">🤖</div>
                                <div className="message-content typing">
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                    <span className="typing-dot"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form className="chatbot-input-form" onSubmit={handleSendMessage}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            disabled={isLoading}
                            className="chatbot-input"
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isLoading}
                            className="chatbot-send-btn"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChatBot;
