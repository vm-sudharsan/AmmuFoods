import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getApiUrl } from '../../utils/api';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, User, Phone, MapPin, Package, Calendar, TrendingUp, Edit2, Trash2 } from 'lucide-react';

const ShopDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [shop, setShop] = useState(null);
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        fetchShopDetails();
    }, [id]);

    const fetchShopDetails = async () => {
        setLoading(true);
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${API_URL}/admin/shop-requests/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                setShop(data.shop);
                setOrders(data.orders || []);
                setStats(data.stats || {});
            } else {
                setStatus({ type: 'error', message: 'Failed to fetch shop details' });
            }
        } catch (error) {
            console.error("Error fetching shop details", error);
            setStatus({ type: 'error', message: 'Network error' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelPartnership = async () => {
        const reason = prompt('Please provide a reason for cancellation:');
        if (!reason) return;

        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${API_URL}/admin/shop-requests/${id}/cancel`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            });

            if (response.ok) {
                setStatus({ type: 'success', message: 'Partnership cancelled successfully' });
                fetchShopDetails();
            } else {
                const data = await response.json();
                setStatus({ type: 'error', message: data.message || 'Failed to cancel partnership' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error' });
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            'PENDING': 'bg-yellow-100 text-yellow-800',
            'APPROVED': 'bg-blue-100 text-blue-800',
            'DELIVERED': 'bg-green-100 text-green-800',
            'CANCELLED': 'bg-red-100 text-red-800',
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Navbar />
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-gray-500">Loading...</div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!shop) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Navbar />
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-gray-500">Shop not found</div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
            <Navbar />
            <div className="flex-grow container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/admin/shops')}
                        className="flex items-center gap-2 text-brand-red hover:text-red-700 mb-4"
                    >
                        <ArrowLeft size={20} />
                        Back to Shops
                    </button>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Store className="text-brand-red" size={32} />
                            <div>
                                <h1 className="text-3xl font-serif font-bold text-gray-800">{shop.shopName}</h1>
                                <p className="text-gray-500">{shop.area}</p>
                            </div>
                        </div>
                        {shop.status === 'APPROVED' && shop.partnershipStatus === 'ACTIVE' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => navigate(`/admin/shops/${id}/edit`)}
                                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                                >
                                    <Edit2 size={18} />
                                    Edit
                                </button>
                                <button
                                    onClick={handleCancelPartnership}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    <Trash2 size={18} />
                                    Cancel Partnership
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {status.message && (
                    <div className={`mb-6 p-4 rounded-lg ${
                        status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {status.message}
                    </div>
                )}

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.totalOrders || 0}</p>
                            </div>
                            <Package className="text-blue-500" size={32} />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Completed</p>
                                <p className="text-2xl font-bold text-green-600">{stats.completedOrders || 0}</p>
                            </div>
                            <TrendingUp className="text-green-500" size={32} />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders || 0}</p>
                            </div>
                            <Calendar className="text-yellow-500" size={32} />
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
                                <p className="text-2xl font-bold text-brand-red">₹{stats.totalRevenue || 0}</p>
                            </div>
                            <TrendingUp className="text-brand-red" size={32} />
                        </div>
                    </div>
                </div>

                {/* Shop Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Shop Information</h2>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <Store className="text-gray-400 mt-1" size={20} />
                                <div>
                                    <p className="text-sm text-gray-500">Shop Name</p>
                                    <p className="text-gray-800 font-medium">{shop.shopName}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <User className="text-gray-400 mt-1" size={20} />
                                <div>
                                    <p className="text-sm text-gray-500">Owner</p>
                                    <p className="text-gray-800 font-medium">{shop.shopOwnerName}</p>
                                    <p className="text-sm text-gray-500">{shop.userEmail}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="text-gray-400 mt-1" size={20} />
                                <div>
                                    <p className="text-sm text-gray-500">Contact</p>
                                    <p className="text-gray-800 font-medium">{shop.contactNumber}</p>
                                    {shop.alternateContact && (
                                        <p className="text-sm text-gray-600">{shop.alternateContact}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="text-gray-400 mt-1" size={20} />
                                <div>
                                    <p className="text-sm text-gray-500">Address</p>
                                    <p className="text-gray-800 font-medium">{shop.shopAddress}</p>
                                    <p className="text-sm text-gray-600">{shop.area}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Partnership Details</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 ${
                                    shop.status === 'APPROVED' && shop.partnershipStatus === 'ACTIVE'
                                        ? 'bg-green-100 text-green-800'
                                        : shop.status === 'CANCELLED'
                                        ? 'bg-gray-100 text-gray-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {shop.status === 'APPROVED' && shop.partnershipStatus === 'ACTIVE' ? 'Active Partner' : 
                                     shop.status === 'CANCELLED' ? 'Ex-Partner' : shop.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Daily Stock Needed</p>
                                <p className="text-gray-800 font-medium">{shop.dailyStockNeeded}</p>
                            </div>
                            {shop.preferredDeliveryTime && (
                                <div>
                                    <p className="text-sm text-gray-500">Preferred Delivery Time</p>
                                    <p className="text-gray-800 font-medium">{shop.preferredDeliveryTime}</p>
                                </div>
                            )}
                            {shop.partnershipStartDate && (
                                <div>
                                    <p className="text-sm text-gray-500">Partnership Start Date</p>
                                    <p className="text-gray-800 font-medium">{formatDate(shop.partnershipStartDate)}</p>
                                </div>
                            )}
                            {shop.partnershipEndDate && (
                                <div>
                                    <p className="text-sm text-gray-500">Partnership End Date</p>
                                    <p className="text-gray-800 font-medium">{formatDate(shop.partnershipEndDate)}</p>
                                </div>
                            )}
                            {shop.adminNotes && (
                                <div>
                                    <p className="text-sm text-gray-500">Admin Notes</p>
                                    <p className="text-gray-800">{shop.adminNotes}</p>
                                </div>
                            )}
                            {shop.cancellationReason && (
                                <div>
                                    <p className="text-sm text-gray-500">Cancellation Reason</p>
                                    <p className="text-gray-800">{shop.cancellationReason}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Order History */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-800">Order History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.map(order => (
                                    <tr key={order._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            #{order._id.slice(-6).toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {order.items && order.items.length > 0 
                                                ? order.items.map(i => `${i.productId?.name || 'Unknown'} (${i.quantity})`).join(', ')
                                                : 'No items'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(order.deliveryDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                            ₹{order.totalAmount || 0}
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                            No orders found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ShopDetails;
