import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { api } from '../services/api';
import { Send, Loader } from 'lucide-react';
import './Chat.css';

function Chat({ transactionId, currentUserId }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        // Load existing messages
        loadMessages();

        // Setup WebSocket connection
        const token = localStorage.getItem('token');
        const newSocket = io('http://localhost:3000', {
            auth: { token },
        });

        newSocket.on('connect', () => {
            console.log('Connected to chat');
            newSocket.emit('join-transaction', transactionId);
        });

        newSocket.on('new-message', (message) => {
            setMessages((prev) => [...prev, message]);
            scrollToBottom();
        });

        newSocket.on('user-typing', () => {
            setIsTyping(true);
        });

        newSocket.on('user-stop-typing', () => {
            setIsTyping(false);
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.emit('leave-transaction', transactionId);
                newSocket.disconnect();
            }
        };
    }, [transactionId]);

    const loadMessages = async () => {
        try {
            const data = await api.getMessages(transactionId);
            setMessages(data.messages || []);
            scrollToBottom();
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleTyping = () => {
        if (socket) {
            socket.emit('typing', { transactionId });

            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stop-typing', { transactionId });
            }, 1000);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        const content = newMessage.trim();
        setNewMessage('');

        try {
            if (socket && socket.connected) {
                socket.emit('send-message', {
                    transactionId,
                    content,
                    messageType: 'text',
                });
            } else {
                // Fallback to REST API
                await api.sendMessage(transactionId, content);
                loadMessages();
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setNewMessage(content); // Restore message on error
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        }
        return date.toLocaleDateString();
    };

    // Group messages by date
    const groupedMessages = messages.reduce((groups, message) => {
        const date = formatDate(message.created_at);
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
        return groups;
    }, {});

    if (loading) {
        return (
            <div className="chat-loading">
                <div className="spinner"></div>
                <p>Loading messages...</p>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <div className="chat-messages">
                {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                    <div key={date} className="message-group">
                        <div className="message-date">{date}</div>
                        {dateMessages.map((message) => (
                            <div
                                key={message.id}
                                className={`message ${message.sender_id === currentUserId ? 'message-sent' : 'message-received'
                                    } ${message.message_type === 'status_update' ? 'message-status' : ''}`}
                            >
                                {message.message_type === 'status_update' ? (
                                    <div className="message-status-content">
                                        {message.content}
                                    </div>
                                ) : (
                                    <>
                                        {message.sender_id !== currentUserId && (
                                            <span className="message-sender">{message.sender_name}</span>
                                        )}
                                        <div className="message-bubble">
                                            <p>{message.content}</p>
                                            <span className="message-time">{formatTime(message.created_at)}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                ))}

                {isTyping && (
                    <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="chat-input">
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                    }}
                    disabled={sending}
                />
                <button type="submit" disabled={!newMessage.trim() || sending}>
                    {sending ? <Loader size={18} className="spinning" /> : <Send size={18} />}
                </button>
            </form>
        </div>
    );
}

export default Chat;
