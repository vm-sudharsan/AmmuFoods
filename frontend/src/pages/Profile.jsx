import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import heroImage from '../assets/hero_sweets.png';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../utils/api';
import { Camera, Edit2, Save, X, Trash2 } from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [events, setEvents] = useState([]);
    const [shopOrders, setShopOrders] = useState([]);
    const [shopRequest, setShopRequest] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState({ name: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            if (!token) {
                navigate('/login');
                return;
            }

            if (storedUser) {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setEditedData({ name: userData.name, phone: userData.phone || '' });
            }

            try {
                const API_URL = getApiUrl();
                
                // Fetch fresh user profile data
                const profileResponse = await fetch(`${API_URL}/users/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (profileResponse.ok) {
                    const profileData = await profileResponse.json();
                    setUser(profileData.user);
                    setEditedData({ 
                        name: profileData.user.name, 
                        phone: profileData.user.phone || '' 
                    });
                    // Update localStorage with fresh data
                    localStorage.setItem('user', JSON.stringify(profileData.user));
                }

                // Fetch User Events
                const eventResponse = await fetch(`${API_URL}/events/my-events`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (eventResponse.ok) {
                    const eventData = await eventResponse.json();
                    setEvents(eventData.events || []);
                }

                // Fetch Shop Request Status
                const shopResponse = await fetch(`${API_URL}/users/shop-request`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (shopResponse.ok) {
                    const shopData = await shopResponse.json();
                    setShopRequest(shopData.request);
                }

                // Fetch Shop Orders if user is SHOP
                if (storedUser && JSON.parse(storedUser).role === 'SHOP') {
                    try {
                        const orderResponse = await fetch(`${API_URL}/shop/orders`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (orderResponse.ok) {
                            const orderData = await orderResponse.json();
                            setShopOrders(Array.isArray(orderData.orders) ? orderData.orders : []);
                        } else {
                            setShopOrders([]);
                        }
                    } catch (orderError) {
                        console.error("Error fetching shop orders:", orderError);
                        setShopOrders([]);
                    }
                }
            } catch (error) {
                console.error("Error fetching profile data:", error);
                setEvents([]);
                setShopOrders([]);
            }
        };

        fetchData();
    }, [navigate]);

    const handleEditToggle = () => {
        if (isEditing) {
            // Cancel editing - reset to original values
            setEditedData({ name: user.name, phone: user.phone || '' });
        }
        setIsEditing(!isEditing);
        setMessage({ type: '', text: '' });
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editedData)
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.dispatchEvent(new Event('auth-change'));
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setIsEditing(false);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                uploadProfilePicture(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadProfilePicture = async (base64Image) => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_URL}/users/profile/picture`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ image: base64Image })
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.dispatchEvent(new Event('auth-change'));
                setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
                setImagePreview(null);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to upload image' });
                setImagePreview(null);
            }
        } catch (error) {
            console.error("Error uploading profile picture:", error);
            setMessage({ type: 'error', text: 'Failed to upload image' });
            setImagePreview(null);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProfilePicture = async () => {
        if (!window.confirm('Are you sure you want to delete your profile picture?')) {
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_URL}/users/profile/picture`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.dispatchEvent(new Event('auth-change'));
                setMessage({ type: 'success', text: 'Profile picture deleted successfully!' });
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to delete image' });
            }
        } catch (error) {
            console.error("Error deleting profile picture:", error);
            setMessage({ type: 'error', text: 'Failed to delete image' });
        } finally {
            setLoading(false);
        }
    };

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
                    {/* Message Display */}
                    {message.text && (
                        <div className={`max-w-5xl mx-auto mb-4 p-4 rounded-lg ${
                            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
                        <div className="md:flex">
                            {/* Sidebar / User Info Summary */}
                            <div className="md:w-1/3 bg-gray-50 p-8 border-r border-gray-100 flex flex-col items-center justify-center text-center">
                                <div className="relative mb-4">
                                    {user.profilePicture || imagePreview ? (
                                        <img 
                                            src={imagePreview || user.profilePicture} 
                                            alt={user.name}
                                            className="w-32 h-32 rounded-full object-cover shadow-lg border-4 border-brand-yellow"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 bg-brand-yellow rounded-full flex items-center justify-center text-4xl font-bold text-brand-brown shadow-inner">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    
                                    {/* Camera Icon for Upload */}
                                    <label 
                                        htmlFor="profile-picture-upload" 
                                        className="absolute bottom-0 right-0 bg-brand-red text-white p-2 rounded-full cursor-pointer hover:bg-red-700 transition-colors shadow-lg"
                                    >
                                        <Camera size={18} />
                                        <input 
                                            id="profile-picture-upload"
                                            type="file" 
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                            disabled={loading}
                                        />
                                    </label>

                                    {/* Delete Picture Button */}
                                    {user.profilePicture && (
                                        <button
                                            onClick={handleDeleteProfilePicture}
                                            disabled={loading}
                                            className="absolute top-0 right-0 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-lg"
                                            title="Delete profile picture"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
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
                                    <div className="flex justify-between items-center mb-6 border-b pb-2">
                                        <h3 className="text-xl font-bold text-gray-800">Account Details</h3>
                                        {!isEditing ? (
                                            <button
                                                onClick={handleEditToggle}
                                                className="flex items-center gap-2 text-brand-red hover:text-red-700 font-medium transition-colors"
                                            >
                                                <Edit2 size={18} />
                                                Edit Profile
                                            </button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSaveProfile}
                                                    disabled={loading}
                                                    className="flex items-center gap-2 bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                                >
                                                    <Save size={18} />
                                                    Save
                                                </button>
                                                <button
                                                    onClick={handleEditToggle}
                                                    disabled={loading}
                                                    className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                                                >
                                                    <X size={18} />
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editedData.name}
                                                        onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red"
                                                        disabled={loading}
                                                    />
                                                ) : (
                                                    <p className="text-lg text-gray-900">{user.name}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
                                                <p className="text-lg text-gray-900">{user.email}</p>
                                                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                                                {isEditing ? (
                                                    <input
                                                        type="tel"
                                                        value={editedData.phone}
                                                        onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                                                        placeholder="Enter 10-digit phone number"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red"
                                                        disabled={loading}
                                                        maxLength={10}
                                                    />
                                                ) : (
                                                    <p className="text-lg text-gray-900">{user.phone || 'Not provided'}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500 mb-1">Account Role</label>
                                                <p className="text-lg text-gray-900 capitalize">{user.role?.toLowerCase() || 'User'}</p>
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
                                                onClick={() => navigate('/shop')}
                                                className="bg-brand-red text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 transition"
                                            >
                                                Place Daily Order
                                            </button>
                                        </div>

                                        {shopOrders && shopOrders.length > 0 ? (
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
                                                            <span className="font-medium">Items:</span> {order.items && order.items.length > 0 ? order.items.map(i => `${i.productId?.name || 'Unknown'} x${i.quantity}`).join(', ') : 'No items'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 italic">No shop orders found.</p>
                                        )}
                                    </div>
                                )}

                                {/* Event Order History */}
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Recent Event Orders</h3>
                                    <p className="text-sm text-blue-600 mb-3 italic">💌 Check your email for updates on your event orders</p>
                                    {events && events.length > 0 ? (
                                        <div className="space-y-4">
                                            {events.map((event) => (
                                                <div key={event._id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h4 className="font-bold text-brand-brown">{event.eventName}</h4>
                                                            <p className="text-sm text-gray-500">{new Date(event.eventDate).toLocaleDateString()} • {event.eventLocation}</p>
                                                        </div>
                                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                                            event.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                            event.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                                                            event.status === 'CONTACTED' ? 'bg-yellow-100 text-yellow-800' :
                                                            event.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {event.status}
                                                        </span>
                                                    </div>
                                                    {event.specialInstructions && (
                                                        <p className="text-sm text-gray-700 mt-2">
                                                            <span className="font-medium">Details:</span> {event.specialInstructions}
                                                        </p>
                                                    )}
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        <span className="font-medium">Delivery:</span> {event.deliveryTime}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic">No event orders found.</p>
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
