import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getApiUrl } from '../../utils/api';
import { Bell, CheckCircle, AlertCircle, Info, Package, Store, Calendar } from 'lucide-react';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState('all'); // all, unread, read
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
        
        // Trigger notification update event when page loads
        // This will refresh the unread count in the navbar
        window.dispatchEvent(new Event('notification-update'));
    }, []);

    const fetchNotifications = async () => {
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${API_URL}/admin/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'ORDER':
                return <Package className="text-blue-500" size={20} />;
            case 'EVENT':
                return <Calendar className="text-purple-500" size={20} />;
            case 'SHOP_REQUEST':
                return <Store className="text-green-500" size={20} />;
            case 'STOCK':
                return <AlertCircle className="text-red-500" size={20} />;
            default:
                return <Info className="text-gray-500" size={20} />;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'HIGH':
                return 'border-red-500';
            case 'MEDIUM':
                return 'border-yellow-500';
            case 'LOW':
                return 'border-blue-500';
            default:
                return 'border-gray-300';
        }
    };

    const getTypeLabel = (type) => {
        const labels = {
            'ORDER': { text: 'Order', color: 'bg-blue-100 text-blue-800' },
            'EVENT': { text: 'Event', color: 'bg-purple-100 text-purple-800' },
            'SHOP_REQUEST': { text: 'Shop', color: 'bg-green-100 text-green-800' },
            'STOCK': { text: 'Stock', color: 'bg-red-100 text-red-800' },
            'SYSTEM': { text: 'System', color: 'bg-gray-100 text-gray-800' },
        };
        return labels[type] || { text: type, color: 'bg-gray-100 text-gray-800' };
    };

    const getNavigationPath = (notification) => {
        const type = notification.type;
        
        switch (type) {
            case 'ORDER':
                return '/admin/orders'; // Packing page
            case 'EVENT':
                return '/admin/events'; // Events page
            case 'SHOP_REQUEST':
                return '/admin/shops'; // Shops page
            case 'STOCK':
                return '/admin/inventory'; // Inventory page
            default:
                return null; // No navigation
        }
    };

    const handleNotificationClick = async (notification) => {
        try {
            // Mark as read if unread
            if (!notification.isRead) {
                const API_URL = getApiUrl();
                const token = localStorage.getItem('token');
                
                await fetch(`${API_URL}/admin/notifications/${notification._id}/read`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // Update local state
                setNotifications(prev => 
                    prev.map(n => 
                        n._id === notification._id ? { ...n, isRead: true } : n
                    )
                );

                // Trigger notification update event to refresh badge count
                window.dispatchEvent(new Event('notification-update'));
            }

            // Navigate to relevant page
            const path = getNavigationPath(notification);
            if (path) {
                window.location.href = path;
            }
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${API_URL}/admin/notifications/mark-all-read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                // Update all notifications to read
                setNotifications(prev => 
                    prev.map(n => ({ ...n, isRead: true }))
                );

                // Trigger notification update event
                window.dispatchEvent(new Event('notification-update'));
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const filteredNotifications = notifications.filter(notif => {
        if (filter === 'unread') return !notif.isRead;
        if (filter === 'read') return notif.isRead;
        return true;
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
            <Navbar />
            <div className="flex-grow container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <Bell size={32} className="text-brand-red" />
                        <h1 className="text-3xl font-serif font-bold text-gray-800">Notifications</h1>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleMarkAllAsRead}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                            Mark All as Read
                        </button>
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg transition ${
                                filter === 'all' 
                                    ? 'bg-brand-red text-white' 
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            All ({notifications.length})
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-2 rounded-lg transition ${
                                filter === 'unread' 
                                    ? 'bg-brand-red text-white' 
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            Unread ({notifications.filter(n => !n.isRead).length})
                        </button>
                        <button
                            onClick={() => setFilter('read')}
                            className={`px-4 py-2 rounded-lg transition ${
                                filter === 'read' 
                                    ? 'bg-brand-red text-white' 
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            Read ({notifications.filter(n => n.isRead).length})
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notif) => (
                            <div
                                key={notif._id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`bg-white rounded-lg shadow p-4 border-l-4 ${getPriorityColor(notif.priority)} ${
                                    !notif.isRead ? 'bg-blue-50' : ''
                                } hover:shadow-lg transition cursor-pointer`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">{getIcon(notif.type)}</div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeLabel(notif.type).color}`}>
                                                        {getTypeLabel(notif.type).text}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                        notif.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                                                        notif.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {notif.priority}
                                                    </span>
                                                    {!notif.isRead && (
                                                        <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-semibold">
                                                            New
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-gray-800">
                                                    {notif.message}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Click to view details
                                                </p>
                                            </div>
                                            <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                                                {formatDate(notif.createdAt)}
                                            </span>
                                        </div>
                                        {notif.metadata && (
                                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                                                {Object.entries(notif.metadata).map(([key, value]) => (
                                                    <p key={key}>
                                                        <span className="font-medium">{key}:</span> {value}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-lg shadow p-12 text-center">
                            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 text-lg">No notifications found</p>
                            <p className="text-gray-400 text-sm mt-2">
                                {filter === 'unread' && 'All caught up! No unread notifications.'}
                                {filter === 'read' && 'No read notifications yet.'}
                                {filter === 'all' && 'You have no notifications at this time.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Summary Stats */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow p-4 text-center">
                        <p className="text-sm text-gray-500 mb-1">Total</p>
                        <p className="text-2xl font-bold text-gray-800">{notifications.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 text-center">
                        <p className="text-sm text-gray-500 mb-1">Unread</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {notifications.filter(n => !n.isRead).length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 text-center">
                        <p className="text-sm text-gray-500 mb-1">High Priority</p>
                        <p className="text-2xl font-bold text-red-600">
                            {notifications.filter(n => n.priority === 'HIGH').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 text-center">
                        <p className="text-sm text-gray-500 mb-1">Today</p>
                        <p className="text-2xl font-bold text-green-600">
                            {notifications.filter(n => {
                                const notifDate = new Date(n.createdAt);
                                const today = new Date();
                                return notifDate.toDateString() === today.toDateString();
                            }).length}
                        </p>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Notifications;
