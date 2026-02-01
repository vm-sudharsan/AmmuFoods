import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import heroImage from '../assets/hero_sweets.png';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [events, setEvents] = useState([]);
    const [shopOrders, setShopOrders] = useState([]);
    const [shopRequest, setShopRequest] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            if (!token) {
                navigate('/login');
                return;
            }

            if (storedUser) {
                setUser(JSON.parse(storedUser));
            } else {
                setUser({ name: 'Valued Customer', email: 'user@example.com' });
            }

            try {
                // Fetch User Events
                const eventResponse = await fetch('http://localhost:5000/events/my-events', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (eventResponse.ok) {
                    const eventData = await eventResponse.json();
                    setEvents(eventData.events || []);
                }

                // Fetch Shop Request Status
                const shopResponse = await fetch('http://localhost:5000/users/shop-request', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (shopResponse.ok) {
                    const shopData = await shopResponse.json();
                    setShopRequest(shopData.request);
                }

                // Fetch Shop Orders if user is SHOP
                if (storedUser && JSON.parse(storedUser).role === 'SHOP') {
                    const orderResponse = await fetch('http://localhost:5000/orders/my-orders', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (orderResponse.ok) {
                        const orderData = await orderResponse.json();
                        setShopOrders(orderData.orders || []);
                    }
                }
            } catch (error) {
                console.error("Error fetching profile data:", error);
            }
        };

        fetchData();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/landing');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen flex flex-col bg-brand-beige font-sans">
            <Navbar />

            <div className="flex-grow">
                {/* Hero/Header Section */}
                <div className="relative bg-brand-red text-white py-16">
                    <div className="absolute inset-0 overflow-hidden">
                        <img src={heroImage} alt="Background" className="w-full h-full object-cover opacity-20 blur-sm" />
                    </div>
                    <div className="relative container mx-auto px-4 text-center">
                        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">My Profile</h1>
                        <p className="text-lg opacity-90">Manage your account and view your orders</p>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-12 -mt-10 relative z-10">
                    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
                        <div className="md:flex">
                            {/* Sidebar / User Info Summary */}
                            <div className="md:w-1/3 bg-gray-50 p-8 border-r border-gray-100 flex flex-col items-center justify-center text-center">
                                <div className="w-32 h-32 bg-brand-yellow rounded-full flex items-center justify-center text-4xl font-bold text-brand-brown mb-4 shadow-inner">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                                <p className="text-gray-500 mb-6">{user.email}</p>
                                <button
                                    onClick={handleLogout}
                                    className="px-6 py-2 border-2 border-brand-red text-brand-red font-medium rounded-full hover:bg-brand-red hover:text-white transition-colors duration-200"
                                >
                                    Sign Out
                                </button>
                            </div>

                            {/* Details Section */}
                            <div className="md:w-2/3 p-8">
                                <div className="mb-10">
                                    <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Account Details</h3>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500">Full Name</label>
                                                <p className="text-lg text-gray-900">{user.name}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500">Email Address</label>
                                                <p className="text-lg text-gray-900">{user.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Shop Request Status */}
                                {shopRequest && (
                                    <div className="mb-10">
                                        <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2 flex items-center justify-between">
                                            <span>Shop Partnership Status</span>
                                            <span className={`px-3 py-1 rounded-full text-sm ${shopRequest.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                shopRequest.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {shopRequest.status}
                                            </span>
                                        </h3>
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <p className="font-semibold text-gray-900">{shopRequest.shopName}</p>
                                            <p className="text-sm text-gray-600">{shopRequest.location}</p>
                                            <p className="text-sm text-gray-500 mt-2">Submitted on: {new Date(shopRequest.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Shop Orders Section (Only for Shop Owners) */}
                                {user.role === 'SHOP' && (
                                    <div className="mb-10">
                                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                                            <h3 className="text-xl font-bold text-gray-800">Shop Orders</h3>
                                            <button
                                                onClick={() => navigate('/shop-order')}
                                                className="bg-brand-red text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 transition"
                                            >
                                                Place Daily Order
                                            </button>
                                        </div>

                                        {shopOrders.length > 0 ? (
                                            <div className="space-y-4">
                                                {shopOrders.map(order => (
                                                    <div key={order._id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h4 className="font-bold text-gray-800">Order #{order._id.slice(-6).toUpperCase()}</h4>
                                                                <p className="text-sm text-gray-500">
                                                                    Placed: {new Date(order.createdAt).toLocaleDateString()} •
                                                                    Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                                                order.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {order.status}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 text-sm text-gray-700">
                                                            <span className="font-medium">Items:</span> {order.items.map(i => `${i.productId?.name} x${i.quantity}`).join(', ')}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 italic">No shop orders found.</p>
                                        )}
                                    </div>
                                )}

                                {/* Party Order History */}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Recent Party Orders</h3>
                                    {events.length > 0 ? (
                                        <div className="space-y-4">
                                            {events.map((event) => (
                                                <div key={event._id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="font-bold text-brand-brown">{event.eventName}</h4>
                                                            <p className="text-sm text-gray-500">{new Date(event.eventDate).toLocaleDateString()} • {event.eventLocation}</p>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${event.status === 'CLOSED' ? 'bg-green-100 text-green-800' :
                                                            event.status === 'CONTACTED' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {event.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-700 mt-2"><span className="font-medium">Items:</span> {event.itemsRequired}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic">No party orders found.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Profile;
