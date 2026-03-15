import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../utils/api';

const UserNotificationDropdown = ({ unreadCount, onCountUpdate }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/users/notifications?t=${Date.now()}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
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

    const handleBellClick = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            fetchNotifications();
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            
            await fetch(`${API_URL}/users/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setNotifications(prev => 
                prev.map(n => 
                    n._id === notificationId ? { ...n, isRead: true } : n
                )
            );

            if (onCountUpdate) {
                onCountUpdate();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        // Mark as read if not already read
        if (!notification.isRead) {
            await markAsRead(notification._id);
        }

        // Close dropdown
        setIsOpen(false);

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
                // Stay on current page
                break;
        }
    };
    const markAllAsRead = async () => {
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            
            await fetch(`${API_URL}/users/notifications/mark-all-read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setNotifications(prev => 
                prev.map(n => ({ ...n, isRead: true }))
            );

            if (onCountUpdate) {
                onCountUpdate();
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
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

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleBellClick}
                className="relative text-gray-800 hover:text-brand-red transition-colors duration-200"
                title="Notifications"
            >
                <Bell size={22} />
                {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                        <div className="flex items-center gap-2">
                            {notifications.some(n => !n.isRead) && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                    <CheckCheck size={14} />
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">Loading...</div>
                        ) : notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <div
                                    key={notif._id}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${
                                        !notif.isRead ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getTypeLabel(notif.type).color}`}>
                                                    {getTypeLabel(notif.type).text}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    notif.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                                                    notif.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {notif.priority}
                                                </span>
                                                {!notif.isRead && (
                                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium text-gray-800 mb-1">
                                                {notif.message}
                                            </p>
                                            {notif.metadata && (
                                                <div className="text-xs text-gray-600 mb-1">
                                                    {Object.entries(notif.metadata).slice(0, 2).map(([key, value]) => (
                                                        <span key={key} className="mr-3">
                                                            <span className="font-medium">{key}:</span> {value}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <span className="text-xs text-gray-400">
                                                {formatDate(notif.createdAt)}
                                            </span>
                                        </div>
                                        {!notif.isRead && (
                                            <button
                                                onClick={() => markAsRead(notif._id)}
                                                className="text-blue-600 hover:text-blue-700 p-1"
                                                title="Mark as read"
                                            >
                                                <Check size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <Bell size={48} className="mx-auto text-gray-300 mb-2" />
                                <p>No notifications</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserNotificationDropdown;