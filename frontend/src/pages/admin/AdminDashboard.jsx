import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { BarChart, Users, ShoppingBag, Package, Bell } from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        pendingShopRequests: 0,
        pendingOrders: 0,
        lowStockItems: 0,
        todaysRevenue: 0
    });

    useEffect(() => {
        // Fetch dashboard stats from backend
        // For now, using mock data or placeholder api calls
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/admin/dashboard', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    // Map backend response to local state structure if needed
                    // setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch admin dashboard stats", error);
            }
        };
        fetchStats();
    }, []);

    const cards = [
        { title: 'Pending Shop Requests', value: stats.pendingShopRequests || '5', icon: <Users size={24} />, color: 'bg-blue-50 text-blue-600', link: '/admin/shop-requests' },
        { title: 'Pending Orders', value: stats.pendingOrders || '12', icon: <ShoppingBag size={24} />, color: 'bg-yellow-50 text-brand-brown', link: '/admin/orders' },
        { title: 'Low Stock Items', value: stats.lowStockItems || '3', icon: <Package size={24} />, color: 'bg-red-50 text-brand-red', link: '/admin/inventory' },
        { title: 'Today\'s Revenue', value: `₹${stats.todaysRevenue || '15,000'}`, icon: <BarChart size={24} />, color: 'bg-green-50 text-green-600', link: '/admin/analytics' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
            <Navbar />

            <div className="flex-grow container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-serif font-bold text-gray-800">Admin Dashboard</h1>
                    <span className="text-sm text-gray-500">{new Date().toLocaleDateString()}</span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {cards.map((card, index) => (
                        <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-sm text-gray-500 font-medium mb-1">{card.title}</p>
                                <h3 className="text-2xl font-bold text-gray-800">{card.value}</h3>
                            </div>
                            <div className={`p-3 rounded-full ${card.color}`}>
                                {card.icon}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Activity / Quick Actions Placeholder */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-between group">
                                <span className="text-gray-700 font-medium">Review New Shop Requests</span>
                                <span className="text-blue-600 group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-between group">
                                <span className="text-gray-700 font-medium">Add New Product to Inventory</span>
                                <span className="text-blue-600 group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                            <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors flex items-center justify-between group">
                                <span className="text-gray-700 font-medium">View Manufacturing Report</span>
                                <span className="text-blue-600 group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                        </div>
                    </div>

                    {/* Notifications Preview */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Recent Notifications</h2>
                            <Bell size={20} className="text-gray-400" />
                        </div>
                        <div className="space-y-4">
                            <div className="border-l-4 border-blue-500 pl-4 py-1">
                                <p className="text-sm text-gray-800 font-medium">New Shop Request</p>
                                <p className="text-xs text-gray-500">Shop "Chennai Sweets" requested approval.</p>
                            </div>
                            <div className="border-l-4 border-yellow-500 pl-4 py-1">
                                <p className="text-sm text-gray-800 font-medium">Order Alert</p>
                                <p className="text-xs text-gray-500">Large order placed by User #123.</p>
                            </div>
                            <div className="border-l-4 border-green-500 pl-4 py-1">
                                <p className="text-sm text-gray-800 font-medium">System</p>
                                <p className="text-xs text-gray-500">Daily report generated successfully.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default AdminDashboard;
