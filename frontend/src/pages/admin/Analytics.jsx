import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getApiUrl } from '../../utils/api';
import { TrendingUp, Package, Store, DollarSign, Calendar } from 'lucide-react';

const Analytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${API_URL}/analytics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
            <Navbar />
            <div className="flex-grow container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-serif font-bold text-gray-800">Analytics & Reports</h1>
                    <div className="flex gap-2 items-center">
                        <Calendar size={20} className="text-gray-500" />
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="px-3 py-2 border rounded-md"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="px-3 py-2 border rounded-md"
                        />
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
                            <DollarSign className="text-green-500" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-gray-800">
                            ₹{analytics?.totalRevenue?.toLocaleString() || 0}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {analytics?.totalOrders || 0} orders
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 text-sm font-medium">Avg Order Value</h3>
                            <TrendingUp className="text-blue-500" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-gray-800">
                            ₹{analytics?.avgOrderValue?.toFixed(2) || 0}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Per order</p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 text-sm font-medium">Active Shops</h3>
                            <Store className="text-purple-500" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-gray-800">
                            {analytics?.totalShops || 0}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {analytics?.newShopsThisMonth || 0} new this month
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-gray-500 text-sm font-medium">Products Sold</h3>
                            <Package className="text-orange-500" size={24} />
                        </div>
                        <p className="text-3xl font-bold text-gray-800">
                            {analytics?.totalProductsSold || 0}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Total units</p>
                    </div>
                </div>

                {/* Top Products */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Top Products by Revenue</h2>
                        <div className="space-y-3">
                            {analytics?.topProducts?.slice(0, 5).map((product, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-lg text-gray-400">#{index + 1}</span>
                                        <div>
                                            <p className="font-medium text-gray-800">{product.name}</p>
                                            <p className="text-sm text-gray-500">{product.totalQuantity} units sold</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-brand-red">₹{product.totalRevenue?.toLocaleString()}</p>
                                </div>
                            )) || <p className="text-gray-500 text-center py-4">No data available</p>}
                        </div>
                    </div>

                    {/* Top Shops */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Top Shops by Orders</h2>
                        <div className="space-y-3">
                            {analytics?.topShops?.slice(0, 5).map((shop, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-lg text-gray-400">#{index + 1}</span>
                                        <div>
                                            <p className="font-medium text-gray-800">{shop.shopName || shop.name}</p>
                                            <p className="text-sm text-gray-500">{shop.orderCount} orders</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-brand-red">₹{shop.totalRevenue?.toLocaleString()}</p>
                                </div>
                            )) || <p className="text-gray-500 text-center py-4">No data available</p>}
                        </div>
                    </div>
                </div>

                {/* Product Performance Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-bold">Product Performance</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units Sold</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {analytics?.topProducts?.map((product, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {product.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {product.category}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                            {product.totalQuantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                            ₹{product.totalRevenue?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                            {product.orderCount}
                                        </td>
                                    </tr>
                                )) || (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                            No product data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Growth Metrics */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Growth Metrics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Revenue Growth</p>
                            <p className="text-2xl font-bold text-green-600">
                                {analytics?.revenueGrowth?.toFixed(1) || 0}%
                            </p>
                            <p className="text-xs text-gray-500 mt-1">vs previous period</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">New Customers</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {analytics?.newCustomers || 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">in selected period</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Order Growth</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {analytics?.orderGrowth?.toFixed(1) || 0}%
                            </p>
                            <p className="text-xs text-gray-500 mt-1">vs previous period</p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Analytics;
