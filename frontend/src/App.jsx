import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Order from './pages/Order';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import ShopRequests from './pages/admin/ShopRequests';
import Shops from './pages/admin/Shops';
import ShopDetails from './pages/admin/ShopDetails';
import Inventory from './pages/admin/Inventory';
import OrdersManufacturing from './pages/admin/OrdersManufacturing';
import Analytics from './pages/admin/Analytics';
import Notifications from './pages/admin/Notifications';
import UserNotifications from './pages/Notifications';
import EventManagement from './pages/admin/EventManagement';
import EventDetails from './pages/admin/EventDetails';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            setIsAuthenticated(!!token);
        };

        checkAuth();
        window.addEventListener('storage', checkAuth);

        // Custom event listener for same-tab updates
        const handleAuthChange = () => checkAuth();
        window.addEventListener('auth-change', handleAuthChange);

        return () => {
            window.removeEventListener('storage', checkAuth);
            window.removeEventListener('auth-change', handleAuthChange);
        };
    }, []);

    return (
        <Router>
            <Routes>
                <Route path="/" element={isAuthenticated ? (localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).role.includes('ADMIN') ? <Navigate to="/admin/dashboard" /> : <Home />) : <Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/order" element={<Order />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/landing" element={<Landing />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/notifications" element={<UserNotifications />} />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/shop-requests" element={<ShopRequests />} />
                <Route path="/admin/shops" element={<Shops />} />
                <Route path="/admin/shops/:id" element={<ShopDetails />} />
                <Route path="/admin/inventory" element={<Inventory />} />
                <Route path="/admin/orders" element={<OrdersManufacturing />} />
                <Route path="/admin/events" element={<EventManagement />} />
                <Route path="/admin/events/:id" element={<EventDetails />} />
                <Route path="/admin/analytics" element={<Analytics />} />
                <Route path="/admin/notifications" element={<Notifications />} />
            </Routes>
        </Router>
    );
}

export default App;
