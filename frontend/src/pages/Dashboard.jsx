import React, { useState, useEffect } from 'react';
import heroImage from '../assets/hero_sweets.png';

const Dashboard = () => {
    const [shopRequests, setShopRequests] = useState([]);
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('requests');
    const [status, setStatus] = useState({ type: '', message: '' });

    const fetchShopRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/admin/shop-requests', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setShopRequests(data.requests);
            }
        } catch (error) {
            console.error("Error fetching shop requests:", error);
        }
    };

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/admin/orders', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };

    useEffect(() => {
        fetchShopRequests();
        fetchOrders();
    }, []);

    const handleRequestAction = async (id, action) => {
        setStatus({ type: 'loading', message: `Processing ${action}...` });
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/admin/shop-requests/${id}/${action}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setStatus({ type: 'success', message: `Request ${action}ed successfully` });
                fetchShopRequests();
            } else {
                const data = await response.json();
                setStatus({ type: 'error', message: data.message || `Failed to ${action} request` });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error' });
        }
    };

    const handleOrderStatusUpdate = async (id, newStatus) => {
        setStatus({ type: 'loading', message: 'Updating status...' });
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/admin/orders/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                setStatus({ type: 'success', message: 'Order status updated' });
                fetchOrders();
            } else {
                const data = await response.json();
                setStatus({ type: 'error', message: data.message || 'Failed to update status' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error' });
        }
    };

    return (
        <div className="min-h-screen relative flex flex-col font-sans overflow-hidden bg-gray-50">
            {/* Background Image */}
            <div className="absolute inset-0 z-0 h-64">
                <img src={heroImage} alt="Background" className="w-full h-full object-cover blur-sm" />
                <div className="absolute inset-0 bg-black/30" />
            </div>

            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-extrabold text-white drop-shadow-md">Admin Dashboard</h1>
                    <div className="bg-white/90 backdrop-blur rounded-lg p-1 flex space-x-2">
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'requests' ? 'bg-brand-red text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Shop Requests
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-4 py-2 rounded-md transition-colors ${activeTab === 'orders' ? 'bg-brand-red text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            Orders
                        </button>
                    </div>
                </div>

                {status.message && (
                    <div className={`mb-4 p-4 rounded-md shadow ${status.type === 'success' ? 'bg-green-100 text-green-800' : status.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {status.message}
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {shopRequests.map(req => (
                            <div key={req._id} className="bg-white rounded-lg shadow-lg overflow-hidden border-t-4 border-brand-yellow">
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{req.shopName}</h3>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p><span className="font-medium">User:</span> {req.userId?.name} ({req.userId?.email})</p>
                                        <p><span className="font-medium">Location:</span> {req.location}</p>
                                        <p><span className="font-medium">Contact:</span> {req.contactNumber}</p>
                                        <p><span className="font-medium">Demand:</span> {req.expectedDailyDemand}</p>
                                        <p>
                                            <span className="font-medium">Status:</span>
                                            <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                    req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'}`}>
                                                {req.status}
                                            </span>
                                        </p>
                                    </div>
                                    {req.status === 'PENDING' && (
                                        <div className="mt-6 flex space-x-3">
                                            <button
                                                onClick={() => handleRequestAction(req._id, 'approve')}
                                                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleRequestAction(req._id, 'reject')}
                                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {shopRequests.length === 0 && <p className="text-gray-500 col-span-full text-center py-10 bg-white rounded-lg shadow">No shop requests found.</p>}
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {orders.map(order => (
                                <li key={order._id}>
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-brand-red truncate">
                                                Order #{order._id.slice(-6)}
                                            </p>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <select
                                                    value={order.status}
                                                    onChange={(e) => handleOrderStatusUpdate(order._id, e.target.value)}
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 border-0 focus:ring-2 focus:ring-brand-red ${order.status === 'DELIVERED' ? 'text-green-800' : 'text-gray-800'
                                                        }`}
                                                >
                                                    <option value="PLACED">PLACED</option>
                                                    <option value="APPROVED">APPROVED</option>
                                                    <option value="PACKED">PACKED</option>
                                                    <option value="DELIVERED">DELIVERED</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500">
                                                    Shop: {order.shopUserId?.name}
                                                </p>
                                                <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                                    Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                <p>Items: {order.items.map(i => `${i.productId?.name} x${i.quantity}`).join(', ')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                            {orders.length === 0 && <li className="px-4 py-10 text-center text-gray-500">No orders found.</li>}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
