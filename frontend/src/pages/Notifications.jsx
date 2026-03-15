import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/notifications?t=${Date.now()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
            } else {
                setError('Failed to fetch notifications');
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setError('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${import.meta.env.VITE_API_URL}/users/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setNotifications(prev => 
                prev.map(n => 
                    n._id === notificationId ? { ...n, isRead: true } : n
                )
            );

            // Update navbar badge count
            window.dispatchEvent(new Event('notification-update'));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${import.meta.env.VITE_API_URL}/users/notifications/mark-all-read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setNotifications(prev => 
                prev.map(n => ({ ...n, isRead: true }))
            );

            // Update navbar badge count
            window.dispatchEvent(new Event('notification-update'));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        // Mark as read if not already read
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }

        // Navigate based on notification type
        switch (notification.type) {
            case 'ORDER':
                navigate('/shop'); // Shop orders page
                break;
            case 'EVENT':
                navigate('/order?tab=events'); // Order page with events tab
                break;
            case 'SHOP_REQUEST':
                navigate('/shop'); // Shop management page
                break;
            default:
                // Stay on notifications page
                break;
        }
    };

    const getTypeLabel = (type) => {
        const labels = {
            'ORDER': { text: 'Order', color: 'bg-blue-100 text-blue-800' },
            'EVENT': { text: 'Event', color: 'bg-purple-100 text-purple-800' },
            'SHOP_REQUEST': { text: 'Shop', color: 'bg-green-100 text-green-800' },
            'SYSTEM': { text: 'System', color: 'bg-gray-100 text-gray-800' },
        };
        return labels[type] || { text: type, color: 'bg-gray-100 text-gray-800' };
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'HIGH': return 'bg-red-100 text-red-800';
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
            case 'LOW': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-white rounded-lg shadow-sm p-8">
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="border-b border-gray-100 pb-4 mb-4">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <div className="text-red-500 mb-4">
                            <Bell size={48} className="mx-auto" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Notifications</h2>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={fetchNotifications}
                            className="bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-gray-600 hover:text-gray-800 transition"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
                    </div>
                    {notifications.some(n => !n.isRead) && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            <CheckCheck size={18} />
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <div
                                key={notification._id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-6 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${
                                    !notification.isRead ? 'bg-blue-50' : ''
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeLabel(notification.type).color}`}>
                                                {getTypeLabel(notification.type).text}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(notification.priority)}`}>
                                                {notification.priority}
                                            </span>
                                            {!notification.isRead && (
                                                <span className="flex items-center gap-1 text-blue-600 text-xs font-medium">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    New
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-800 font-medium mb-2">
                                            {notification.message}
                                        </p>
                                        {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                                            <div className="text-sm text-gray-600 mb-2">
                                                {Object.entries(notification.metadata).slice(0, 3).map(([key, value]) => (
                                                    <span key={key} className="mr-4">
                                                        <span className="font-medium">{key}:</span> {value}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <span className="text-xs text-gray-400">
                                            {formatDate(notification.createdAt)}
                                        </span>
                                    </div>
                                    {!notification.isRead && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                markAsRead(notification._id);
                                            }}
                                            className="text-blue-600 hover:text-blue-700 p-2"
                                            title="Mark as read"
                                        >
                                            <Check size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center">
                            <Bell size={64} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-800 mb-2">No notifications</h3>
                            <p className="text-gray-600">You're all caught up! Check back later for updates.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;