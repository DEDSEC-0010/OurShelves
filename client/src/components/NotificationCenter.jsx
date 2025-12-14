import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Bell, Check, X } from 'lucide-react';
import './NotificationCenter.css';

function NotificationCenter() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchNotifications();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Close dropdown when clicking outside
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await api.getNotifications();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.markNotificationRead(id);
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, read: 1 } : n
            ));
            setUnreadCount(Math.max(0, unreadCount - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.markAllNotificationsRead();
            setNotifications(notifications.map(n => ({ ...n, read: 1 })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getIcon = (type) => {
        const icons = {
            request: '📬',
            approval: '✅',
            rejection: '❌',
            pickup: '🤝',
            return: '📚',
            overdue: '⚠️',
            rating: '⭐',
            dispute: '🚨',
        };
        return icons[type] || '📌';
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="notification-center" ref={dropdownRef}>
            <button
                className="notification-bell"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button className="mark-all-read" onClick={markAllAsRead}>
                                <Check size={14} />
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="notification-empty">
                                <Bell size={32} />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${notification.read ? '' : 'unread'}`}
                                >
                                    <span className="notification-icon">{getIcon(notification.type)}</span>
                                    <div className="notification-content">
                                        {notification.link ? (
                                            <Link
                                                to={notification.link}
                                                onClick={() => {
                                                    if (!notification.read) markAsRead(notification.id);
                                                    setIsOpen(false);
                                                }}
                                            >
                                                <strong>{notification.title}</strong>
                                                {notification.message && <p>{notification.message}</p>}
                                            </Link>
                                        ) : (
                                            <>
                                                <strong>{notification.title}</strong>
                                                {notification.message && <p>{notification.message}</p>}
                                            </>
                                        )}
                                        <span className="notification-time">{formatTime(notification.created_at)}</span>
                                    </div>
                                    {!notification.read && (
                                        <button
                                            className="notification-mark-read"
                                            onClick={() => markAsRead(notification.id)}
                                            aria-label="Mark as read"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <Link to="/notifications" className="notification-view-all" onClick={() => setIsOpen(false)}>
                            View all notifications
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationCenter;
