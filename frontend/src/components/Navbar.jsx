import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, User, Bell } from 'lucide-react';
import logo from '../assets/logo.png';
import NotificationDropdown from './NotificationDropdown';
import UserNotificationDropdown from './UserNotificationDropdown';

const Navbar = ({ landingPage = false }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState(null);
    const [userProfilePicture, setUserProfilePicture] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const checkLogin = () => {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            setIsLoggedIn(!!token);
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserRole(user.role);
                setUserName(user.name || '');
                setUserProfilePicture(user.profilePicture || null);
            } else {
                setUserRole(null);
                setUserName('');
                setUserProfilePicture(null);
            }
        };
        checkLogin();

        window.addEventListener('storage', checkLogin);
        window.addEventListener('auth-change', checkLogin); // Added listener for custom event
        return () => {
            window.removeEventListener('storage', checkLogin);
            window.removeEventListener('auth-change', checkLogin);
        };
    }, []);

    // Fetch unread notification count for admin users
    useEffect(() => {
        const fetchUnreadCount = async () => {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            
            if (!token || !userStr) {
                setUnreadCount(0);
                return;
            }

            const user = JSON.parse(userStr);
            const isAdmin = user.role === 'ADMIN' || user.role === 'DEVELOPER_ADMIN';
            
            try {
                let endpoint;
                if (isAdmin) {
                    endpoint = `${import.meta.env.VITE_API_URL}/admin/notifications/unread-count`;
                } else {
                    endpoint = `${import.meta.env.VITE_API_URL}/users/notifications/unread-count`;
                }

                const response = await fetch(endpoint, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setUnreadCount(data.count || 0);
                }
            } catch (error) {
                console.error('Failed to fetch unread count:', error);
            }
        };

        fetchUnreadCount();

        // Refresh unread count every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);

        // Listen for notification updates
        window.addEventListener('notification-update', fetchUnreadCount);

        return () => {
            clearInterval(interval);
            window.removeEventListener('notification-update', fetchUnreadCount);
        };
    }, [userRole]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setUserRole(null);
        setUserName('');
        setUserProfilePicture(null);
        setIsProfileDropdownOpen(false);
        navigate('/');
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('auth-change'));
    };

    // Admin Navigation Links (frequently used)
    const adminLinks = [
        { name: 'Dashboard', path: '/admin/dashboard' },
        { name: 'Events', path: '/admin/events' },
        { name: 'Shops', path: '/admin/shops' },
        { name: 'Packing', path: '/admin/orders' },
    ];

    // Standard User Navigation Links
    const userLinks = [
        { name: 'Home', path: '/' },
        { name: 'Order', path: '/order' },
        { name: 'Shop', path: '/shop' },
        { name: 'About Us', path: '/landing#about' },
    ];

    let currentLinks = userLinks;

    // Check for Admin Role
    const isAdmin = userRole === 'ADMIN' || userRole === 'DEVELOPER_ADMIN';
    
    if (isAdmin) {
        currentLinks = adminLinks;
    } else if (userRole === 'SHOP') {
        // Shop specific logic if any, currently mixing with user links but adding dashboard
        // currentLinks is userLinks by default
        // existing logic below adds Dashboard to it
    }

    // Add Shop Dashboard if user is a shop owner (and not admin)
    // Shop users now use /shop page for everything, no separate dashboard
    // Removed shop-dashboard logic

    return (
        <nav className="sticky top-0 z-50 bg-brand-beige/95 backdrop-blur-sm shadow-md border-b border-brand-yellow/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                        <img src={logo} alt="Ammu Foods Logo" className="h-12 w-auto" />
                        <span className="font-serif text-3xl font-bold text-brand-red tracking-tight">
                            Ammu <span className="text-brand-yellow">Foods</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    {!landingPage && (
                        <div className="hidden md:flex space-x-8 items-center">
                            {currentLinks.map((link) => (
                                <NavLink
                                    key={link.name}
                                    to={link.path}
                                    className={({ isActive }) =>
                                        `text-gray-800 hover:text-brand-red font-medium transition-colors duration-200 text-lg ${isActive ? 'text-brand-red font-semibold' : ''}`
                                    }
                                >
                                    {link.name}
                                </NavLink>
                            ))}
                            {/* Notification Bell Icon */}
                            {isLoggedIn && (
                                <>
                                    {isAdmin ? (
                                        <Link
                                            to="/admin/notifications"
                                            className="relative text-gray-800 hover:text-brand-red transition-colors duration-200"
                                            title="Notifications"
                                        >
                                            <Bell size={22} />
                                            {unreadCount > 0 && (
                                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                                    {unreadCount > 99 ? '99+' : unreadCount}
                                                </span>
                                            )}
                                        </Link>
                                    ) : (
                                        <UserNotificationDropdown 
                                            unreadCount={unreadCount}
                                            onCountUpdate={() => window.dispatchEvent(new Event('notification-update'))}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    <div className="hidden md:flex items-center space-x-6 text-brand-brown">
                        {isLoggedIn ? (
                            <div className="relative flex items-center gap-2">
                                {userName && (
                                    <span className="text-sm font-medium text-gray-700">
                                        Hello, {userName.split(' ')[0]}
                                    </span>
                                )}
                                <button
                                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                    className="hover:opacity-80 transition-opacity focus:outline-none flex items-center"
                                >
                                    {userProfilePicture ? (
                                        <img 
                                            src={userProfilePicture} 
                                            alt={userName}
                                            className="w-8 h-8 rounded-full object-cover border-2 border-brand-yellow"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-brand-yellow flex items-center justify-center text-brand-brown font-bold text-sm border-2 border-brand-yellow">
                                            {userName ? userName.charAt(0).toUpperCase() : <User size={18} />}
                                        </div>
                                    )}
                                </button>
                                {isProfileDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50 top-full">
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                        >
                                            Profile
                                        </Link>
                                        {isAdmin && (
                                            <>
                                                <Link
                                                    to="/admin/inventory"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    onClick={() => setIsProfileDropdownOpen(false)}
                                                >
                                                    Inventory
                                                </Link>
                                                <Link
                                                    to="/admin/analytics"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    onClick={() => setIsProfileDropdownOpen(false)}
                                                >
                                                    Analytics
                                                </Link>
                                            </>
                                        )}
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="hover:text-brand-red transition-colors">
                                <User size={22} />
                            </Link>
                        )}
                    </div>

                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-brand-brown hover:text-brand-red focus:outline-none"
                        >
                            {isOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-brand-beige border-t border-gray-100 absolute w-full shadow-lg">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        {!landingPage && currentLinks.map((link) => (
                            <NavLink
                                key={link.name}
                                to={link.path}
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) =>
                                    `block px-3 py-3 rounded-md text-base font-medium ${isActive ? 'bg-brand-yellow/10 text-brand-red' : 'text-gray-800 hover:bg-gray-50'}`
                                }
                            >
                                {link.name}
                            </NavLink>
                        ))}
                        
                        {/* Notifications link for mobile */}
                        {isLoggedIn && (
                            <NavLink
                                to={isAdmin ? "/admin/notifications" : "/notifications"}
                                onClick={() => setIsOpen(false)}
                                className={({ isActive }) =>
                                    `block px-3 py-3 rounded-md text-base font-medium relative ${isActive ? 'bg-brand-yellow/10 text-brand-red' : 'text-gray-800 hover:bg-gray-50'}`
                                }
                            >
                                <span className="flex items-center justify-between">
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ml-2">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </span>
                            </NavLink>
                        )}
                        
                        <div className="flex items-center space-x-6 px-3 py-4 border-t border-gray-200 mt-4">
                            {isLoggedIn ? (
                                <div className="flex items-center space-x-3 w-full">
                                    {userProfilePicture ? (
                                        <img 
                                            src={userProfilePicture} 
                                            alt={userName}
                                            className="w-10 h-10 rounded-full object-cover border-2 border-brand-yellow"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-brand-yellow flex items-center justify-center text-brand-brown font-bold border-2 border-brand-yellow">
                                            {userName ? userName.charAt(0).toUpperCase() : <User size={20} />}
                                        </div>
                                    )}
                                    <div className="flex flex-col space-y-2 flex-1">
                                        {userName && (
                                            <p className="text-sm font-medium text-gray-700">
                                                Hello, {userName.split(' ')[0]}
                                            </p>
                                        )}
                                        <Link 
                                            to="/profile" 
                                            className="text-gray-600 hover:text-brand-red font-medium text-sm"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Profile
                                        </Link>
                                        {isAdmin && (
                                            <>
                                                <Link 
                                                    to="/admin/inventory" 
                                                    className="text-gray-600 hover:text-brand-red font-medium text-sm"
                                                    onClick={() => setIsOpen(false)}
                                                >
                                                    Inventory
                                                </Link>
                                                <Link 
                                                    to="/admin/analytics" 
                                                    className="text-gray-600 hover:text-brand-red font-medium text-sm"
                                                    onClick={() => setIsOpen(false)}
                                                >
                                                    Analytics
                                                </Link>
                                            </>
                                        )}
                                        <button 
                                            onClick={handleLogout} 
                                            className="text-left text-gray-600 hover:text-brand-red font-medium text-sm"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <Link to="/login" className="text-gray-600 hover:text-brand-red"><User size={24} /></Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
