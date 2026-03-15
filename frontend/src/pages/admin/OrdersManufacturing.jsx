import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getApiUrl } from '../../utils/api';
import { Package, CheckCircle, Clock, MapPin, Phone, User } from 'lucide-react';

const OrdersManufacturing = () => {
    const [activeTab, setActiveTab] = useState('forPacking');
    const [allProducts, setAllProducts] = useState([]);
    const [packingData, setPackingData] = useState([]);
    const [forPackingOrders, setForPackingOrders] = useState([]);
    const [packedOrders, setPackedOrders] = useState([]);
    const [deliveredOrders, setDeliveredOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            // Fetch all products for inventory
            const productsRes = await fetch(`${API_URL}/products`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (productsRes.ok) {
                const data = await productsRes.json();
                setAllProducts(data.products || []);
            }

            // Fetch orders for packing (PLACED, APPROVED, MANUFACTURING)
            const forPackingRes = await fetch(`${API_URL}/admin/orders?status=PLACED,APPROVED,MANUFACTURING&deliveryDate=${tomorrowStr}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            let forPackingOrdersData = [];
            if (forPackingRes.ok) {
                const data = await forPackingRes.json();
                forPackingOrdersData = data.orders || [];
                setForPackingOrders(forPackingOrdersData);
            }

            // Fetch packed orders (PACKING status)
            const packedRes = await fetch(`${API_URL}/admin/orders?status=PACKING&deliveryDate=${tomorrowStr}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            let packedOrdersData = [];
            if (packedRes.ok) {
                const data = await packedRes.json();
                packedOrdersData = data.orders || [];
                setPackedOrders(packedOrdersData);
            }

            // Fetch delivered orders
            const deliveredRes = await fetch(`${API_URL}/admin/orders?status=DELIVERED&deliveryDate=${tomorrowStr}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (deliveredRes.ok) {
                const data = await deliveredRes.json();
                setDeliveredOrders(data.orders || []);
            }

            // Calculate packing requirements from ONLY unpacked orders (For Packing tab)
            const productTotals = {};
            
            forPackingOrdersData.forEach(order => {
                order.products?.forEach(item => {
                    const productId = item.productId?._id || item.productId;
                    if (!productTotals[productId]) {
                        productTotals[productId] = {
                            productId: productId,
                            productName: item.productName,
                            unit: item.unit || 'piece',
                            totalQuantity: 0
                        };
                    }
                    productTotals[productId].totalQuantity += item.quantity;
                });
            });

            setPackingData(Object.values(productTotals));

        } catch (error) {
            console.error("Error fetching data", error);
            setStatus({ type: 'error', message: 'Failed to fetch data' });
        } finally {
            setLoading(false);
        }
    };


    const handleMarkPacked = async (orderId) => {
        if (!confirm('Mark this order as packed?')) return;
        
        setLoading(true);
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'PACKING' })
            });

            if (response.ok) {
                setStatus({ type: 'success', message: 'Order marked as packed!' });
                fetchAllData(); // Refresh data
                window.dispatchEvent(new Event('notification-update')); // Update notification count
            } else {
                const data = await response.json();
                setStatus({ type: 'error', message: data.message || 'Failed to update' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error' });
        } finally {
            setLoading(false);
        }
    };

    const handleMarkDelivered = async (orderId) => {
        if (!confirm('Mark this order as delivered?')) return;
        
        setLoading(true);
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'DELIVERED' })
            });

            if (response.ok) {
                setStatus({ type: 'success', message: 'Order marked as delivered! Email sent to shop.' });
                fetchAllData(); // Refresh data
                window.dispatchEvent(new Event('notification-update')); // Update notification count
            } else {
                const data = await response.json();
                setStatus({ type: 'error', message: data.message || 'Failed to update' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error' });
        } finally {
            setLoading(false);
        }
    };

    const getTimeLeft = (deliveryDate) => {
        const now = new Date();
        const delivery = new Date(deliveryDate);
        const diff = delivery - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        
        if (hours < 0) return 'Overdue';
        if (hours < 24) return `${hours}h left`;
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h left`;
    };

    const getProductQuantity = (order, productId) => {
        const product = order.products?.find(p => p.productId?._id === productId || p.productId === productId);
        return product ? product.quantity : 0;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
            <Navbar />
            <div className="flex-grow container mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Package className="text-brand-red" size={32} />
                    <h1 className="text-3xl font-serif font-bold text-gray-800">Packing</h1>
                </div>

                {status.message && (
                    <div className={`mb-4 p-3 rounded-lg ${
                        status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {status.message}
                    </div>
                )}

                {/* Packing Requirements */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="bg-gradient-to-r from-brand-red to-red-600 px-4 py-3 text-white">
                        <h2 className="text-lg font-semibold">No. of Packing to be Done (Tomorrow)</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Total Ordered</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {packingData.map((item, index) => {
                                    return (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{item.productName}</div>
                                                <div className="text-xs text-gray-500">{item.unit}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-lg font-bold text-brand-red">{item.totalQuantity}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {packingData.length === 0 && (
                                    <tr>
                                        <td colSpan="2" className="px-4 py-8 text-center">
                                            <div className="text-green-600 font-semibold text-lg">✓ Everything is ready and packed!</div>
                                            <div className="text-gray-500 text-sm mt-1">No more packing needed for tomorrow</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>


                {/* Tabs */}
                <div className="bg-white rounded-lg shadow mb-4">
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            <button
                                onClick={() => setActiveTab('forPacking')}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'forPacking'
                                        ? 'border-brand-red text-brand-red'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Package size={18} />
                                    For Packing ({forPackingOrders.length})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('packed')}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'packed'
                                        ? 'border-brand-red text-brand-red'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Package size={18} />
                                    Packed ({packedOrders.length})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('delivered')}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'delivered'
                                        ? 'border-brand-red text-brand-red'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={18} />
                                    Delivered ({deliveredOrders.length})
                                </div>
                            </button>
                        </nav>
                    </div>
                </div>

                {/* For Packing Tab */}
                {activeTab === 'forPacking' && (
                    <div className="space-y-4">
                        {forPackingOrders.length > 0 ? (
                            forPackingOrders.map((order) => (
                                <div key={order._id} className="bg-white rounded-lg shadow overflow-hidden">
                                    {/* Row 1: Order Info + Quantities */}
                                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-3 border-b border-blue-200">
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                            <div className="flex items-center gap-4 flex-wrap">
                                                <div>
                                                    <div className="text-xs text-gray-500">Shop Name</div>
                                                    <div className="font-bold text-gray-900">{order.shopRequestId?.shopName || order.shopName}</div>
                                                </div>
                                                <div className="border-l pl-4">
                                                    <div className="text-xs text-gray-500">Delivery Date</div>
                                                    <div className="font-semibold text-gray-900">{formatDate(order.deliveryDate)}</div>
                                                </div>
                                                <div className="border-l pl-4">
                                                    <div className="text-xs text-gray-500">Order ID</div>
                                                    <div className="font-mono text-sm font-semibold text-gray-900">#{order._id?.slice(-6).toUpperCase()}</div>
                                                </div>
                                                <div className="border-l pl-4">
                                                    <div className="text-xs text-gray-500">Time Left</div>
                                                    <div className="font-semibold text-orange-600 flex items-center gap-1">
                                                        <Clock size={14} />
                                                        {getTimeLeft(order.deliveryDate)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Product Quantities Grid */}
                                    <div className="px-4 py-3 bg-gray-50 border-b">
                                        <div className="text-xs font-semibold text-gray-600 mb-2">ORDER QUANTITIES:</div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                            {allProducts.map((product) => {
                                                const qty = getProductQuantity(order, product._id);
                                                return (
                                                    <div key={product._id} className={`px-3 py-2 rounded ${qty > 0 ? 'bg-green-100 border border-green-300' : 'bg-white border border-gray-200'}`}>
                                                        <div className="text-xs text-gray-600 truncate">{product.name}</div>
                                                        <div className={`text-lg font-bold ${qty > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                                                            {qty > 0 ? qty : '-'}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Row 2: Shop Details + Action */}
                                    <div className="px-4 py-3 bg-white">
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                            <div className="flex items-center gap-6 flex-wrap">
                                                <div className="flex items-center gap-2">
                                                    <User size={16} className="text-gray-400" />
                                                    <div>
                                                        <div className="text-xs text-gray-500">Owner</div>
                                                        <div className="font-medium text-gray-900">{order.shopRequestId?.shopOwnerName || order.contactPerson}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone size={16} className="text-gray-400" />
                                                    <div>
                                                        <div className="text-xs text-gray-500">Phone</div>
                                                        <div className="font-medium text-gray-900">{order.shopRequestId?.contactNumber || order.contactNumber}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={16} className="text-gray-400" />
                                                    <div>
                                                        <div className="text-xs text-gray-500">Address</div>
                                                        <div className="font-medium text-gray-900 max-w-md truncate">
                                                            {order.shopRequestId?.shopAddress || order.deliveryAddress}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={16} className="text-gray-400" />
                                                    <div>
                                                        <div className="text-xs text-gray-500">Area</div>
                                                        <div className="font-medium text-gray-900">{order.shopRequestId?.area || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleMarkPacked(order._id)}
                                                disabled={loading}
                                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-semibold"
                                            >
                                                <Package size={20} />
                                                Mark as Packed
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                                No orders for packing
                            </div>
                        )}
                    </div>
                )}

                {/* Packed Tab */}
                {activeTab === 'packed' && (
                    <div className="space-y-4">
                        {packedOrders.length > 0 ? (
                            packedOrders.map((order) => (
                                <div key={order._id} className="bg-white rounded-lg shadow overflow-hidden">
                                    {/* Row 1: Order Info + Quantities */}
                                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-4 py-3 border-b border-purple-200">
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                            <div className="flex items-center gap-4 flex-wrap">
                                                <div>
                                                    <div className="text-xs text-gray-500">Shop Name</div>
                                                    <div className="font-bold text-gray-900">{order.shopRequestId?.shopName || order.shopName}</div>
                                                </div>
                                                <div className="border-l pl-4">
                                                    <div className="text-xs text-gray-500">Delivery Date</div>
                                                    <div className="font-semibold text-gray-900">{formatDate(order.deliveryDate)}</div>
                                                </div>
                                                <div className="border-l pl-4">
                                                    <div className="text-xs text-gray-500">Order ID</div>
                                                    <div className="font-mono text-sm font-semibold text-gray-900">#{order._id?.slice(-6).toUpperCase()}</div>
                                                </div>
                                                <div className="border-l pl-4">
                                                    <div className="text-xs text-gray-500">Time Left</div>
                                                    <div className="font-semibold text-orange-600 flex items-center gap-1">
                                                        <Clock size={14} />
                                                        {getTimeLeft(order.deliveryDate)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Product Quantities Grid */}
                                    <div className="px-4 py-3 bg-gray-50 border-b">
                                        <div className="text-xs font-semibold text-gray-600 mb-2">PACKED QUANTITIES:</div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                            {allProducts.map((product) => {
                                                const qty = getProductQuantity(order, product._id);
                                                return (
                                                    <div key={product._id} className={`px-3 py-2 rounded ${qty > 0 ? 'bg-green-100 border border-green-300' : 'bg-white border border-gray-200'}`}>
                                                        <div className="text-xs text-gray-600 truncate">{product.name}</div>
                                                        <div className={`text-lg font-bold ${qty > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                                                            {qty > 0 ? qty : '-'}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Row 2: Shop Details + Action */}
                                    <div className="px-4 py-3 bg-white">
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                            <div className="flex items-center gap-6 flex-wrap">
                                                <div className="flex items-center gap-2">
                                                    <User size={16} className="text-gray-400" />
                                                    <div>
                                                        <div className="text-xs text-gray-500">Owner</div>
                                                        <div className="font-medium text-gray-900">{order.shopRequestId?.shopOwnerName || order.contactPerson}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone size={16} className="text-gray-400" />
                                                    <div>
                                                        <div className="text-xs text-gray-500">Phone</div>
                                                        <div className="font-medium text-gray-900">{order.shopRequestId?.contactNumber || order.contactNumber}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={16} className="text-gray-400" />
                                                    <div>
                                                        <div className="text-xs text-gray-500">Address</div>
                                                        <div className="font-medium text-gray-900 max-w-md truncate">
                                                            {order.shopRequestId?.shopAddress || order.deliveryAddress}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={16} className="text-gray-400" />
                                                    <div>
                                                        <div className="text-xs text-gray-500">Area</div>
                                                        <div className="font-medium text-gray-900">{order.shopRequestId?.area || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleMarkDelivered(order._id)}
                                                disabled={loading}
                                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-semibold"
                                            >
                                                <CheckCircle size={20} />
                                                Mark as Delivered
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                                No packed orders
                            </div>
                        )}
                    </div>
                )}


                {/* Delivered Tab */}
                {activeTab === 'delivered' && (
                    <div className="space-y-4">
                        {deliveredOrders.length > 0 ? (
                            deliveredOrders.map((order) => (
                                <div key={order._id} className="bg-white rounded-lg shadow overflow-hidden">
                                    {/* Order Info */}
                                    <div className="bg-gradient-to-r from-green-50 to-green-100 px-4 py-3 border-b border-green-200">
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                            <div className="flex items-center gap-4 flex-wrap">
                                                <div>
                                                    <div className="text-xs text-gray-500">Shop Name</div>
                                                    <div className="font-bold text-gray-900">{order.shopRequestId?.shopName || order.shopName}</div>
                                                </div>
                                                <div className="border-l pl-4">
                                                    <div className="text-xs text-gray-500">Delivered On</div>
                                                    <div className="font-semibold text-gray-900">{formatDate(order.deliveryDate)}</div>
                                                </div>
                                                <div className="border-l pl-4">
                                                    <div className="text-xs text-gray-500">Order ID</div>
                                                    <div className="font-mono text-sm font-semibold text-gray-900">#{order._id?.slice(-6).toUpperCase()}</div>
                                                </div>
                                                <div className="border-l pl-4">
                                                    <div className="text-xs text-gray-500">Amount</div>
                                                    <div className="font-semibold text-green-600">₹{order.totalAmount}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded-full">
                                                <CheckCircle size={16} />
                                                <span className="text-sm font-semibold">Delivered</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Product Quantities Grid */}
                                    <div className="px-4 py-3 bg-gray-50 border-b">
                                        <div className="text-xs font-semibold text-gray-600 mb-2">DELIVERED QUANTITIES:</div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                            {allProducts.map((product) => {
                                                const qty = getProductQuantity(order, product._id);
                                                return (
                                                    <div key={product._id} className={`px-3 py-2 rounded ${qty > 0 ? 'bg-green-100 border border-green-300' : 'bg-white border border-gray-200'}`}>
                                                        <div className="text-xs text-gray-600 truncate">{product.name}</div>
                                                        <div className={`text-lg font-bold ${qty > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                                                            {qty > 0 ? qty : '-'}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Shop Details */}
                                    <div className="px-4 py-3 bg-white">
                                        <div className="flex items-center gap-6 flex-wrap">
                                            <div className="flex items-center gap-2">
                                                <User size={16} className="text-gray-400" />
                                                <div>
                                                    <div className="text-xs text-gray-500">Owner</div>
                                                    <div className="font-medium text-gray-900">{order.shopRequestId?.shopOwnerName || order.contactPerson}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone size={16} className="text-gray-400" />
                                                <div>
                                                    <div className="text-xs text-gray-500">Phone</div>
                                                    <div className="font-medium text-gray-900">{order.shopRequestId?.contactNumber || order.contactNumber}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} className="text-gray-400" />
                                                <div>
                                                    <div className="text-xs text-gray-500">Address</div>
                                                    <div className="font-medium text-gray-900 max-w-md truncate">
                                                        {order.shopRequestId?.shopAddress || order.deliveryAddress}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                                No delivered orders yet
                            </div>
                        )}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default OrdersManufacturing;
