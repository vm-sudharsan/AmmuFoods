import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, User } from 'lucide-react';
import logo from '../assets/logo.png';

const Navbar = ({ landingPage = false }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const checkLogin = () => {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            setIsLoggedIn(!!token);
            if (userStr) {
                const user = JSON.parse(userStr);
                setUserRole(user.role);
            } else {
                setUserRole(null);
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setUserRole(null);
        setIsProfileDropdownOpen(false);
        navigate('/');
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('auth-change'));
    };

    // Admin Navigation Links
    const adminLinks = [
        { name: 'Dashboard', path: '/admin/dashboard' },
        { name: 'Shop Requests', path: '/admin/shop-requests' },
        { name: 'Inventory', path: '/admin/inventory' },
        { name: 'Orders & Mfg', path: '/admin/orders' },
        { name: 'Analytics', path: '/admin/analytics' },
        { name: 'Notifications', path: '/admin/notifications' },
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
    if (userRole === 'ADMIN' || userRole === 'DEVELOPER_ADMIN') {
        currentLinks = adminLinks;
    } else if (userRole === 'SHOP') {
        // Shop specific logic if any, currently mixing with user links but adding dashboard
        // currentLinks is userLinks by default
        // existing logic below adds Dashboard to it
    }

    // Add Shop Dashboard if user is a shop owner (and not admin, assuming admins don't need shop dashboard in same view)
    if (userRole === 'SHOP') {
        // Check if it already exists to avoid duplicates
        const exists = currentLinks.find(link => link.path === '/shop-dashboard');
        if (!exists) {
            currentLinks.splice(2, 0, { name: 'Dashboard', path: '/shop-dashboard' });
        }
    }

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
                        </div>
                    )}

                    {/* Icons - Shown even on landing page for login, or maybe specific logic? User asked to "include these alone along with the sign in login option". 
                        The existing code shows User and Cart icons. 
                        If landing page, maybe we still want Login (User icon). 
                        Let's keep icons for now or specific landing icons?
                        User said: "remove the 5 options in the navbar". 
                        Implies keep the rest (Logo, Icons).
                    */}
                    <div className="hidden md:flex items-center space-x-6 text-brand-brown">

                        {isLoggedIn ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                    className="hover:text-brand-red transition-colors focus:outline-none flex items-center"
                                >
                                    <User size={22} />
                                </button>
                                {isProfileDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                        >
                                            Profile
                                        </Link>
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
                        {!landingPage && userRole !== 'ADMIN' && userRole !== 'DEVELOPER_ADMIN' && (
                            <Link to="/cart" className="relative hover:text-brand-red transition-colors">
                                <ShoppingCart size={22} />
                                <span className="absolute -top-2 -right-2 bg-brand-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    0
                                </span>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button - Hide if landingPage? Or show simple menu?
                        If links are hidden, menu is useless unless it has other things. 
                        The Icons are in the top bar on desktop, but inside menu on mobile? 
                        Wait, lines 88-89 are inside mobile menu.
                        If I hide navLinks in mobile menu, it will be empty except icons.
                    */}
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
                        <div className="flex items-center space-x-6 px-3 py-4 border-t border-gray-200 mt-4">

                            {isLoggedIn ? (
                                <div className="flex flex-col space-y-2">
                                    <Link to="/profile" className="text-gray-600 hover:text-brand-red font-medium">Profile</Link>
                                    <button onClick={handleLogout} className="text-left text-gray-600 hover:text-brand-red font-medium">Logout</button>
                                </div>
                            ) : (
                                <Link to="/login" className="text-gray-600 hover:text-brand-red"><User size={24} /></Link>
                            )}
                            {!landingPage && userRole !== 'ADMIN' && userRole !== 'DEVELOPER_ADMIN' && <button className="text-gray-600 hover:text-brand-red"><ShoppingCart size={24} /></button>}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
