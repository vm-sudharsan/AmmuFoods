import React, { useState, useEffect } from 'react';
import heroImage from '../assets/hero_sweets.png';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getApiUrl } from '../utils/api';
import { Plus, Minus, ShoppingCart, Package, Clock, TrendingUp, AlertCircle } from 'lucide-react';

const Shop = () => {
    const [user, setUser] = useState(null);
    const [shopRequest, setShopRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Request form state
    const [formData, setFormData] = useState({
        ownerName: '',
        shopName: '',
        fullAddress: '',
        area: '',
        contactNumber: '',
        alternateNumber: '',
        expectedDailyDemand: '',
        preferredDeliveryTime: '',
        notes: ''
    });
    
    // Shop dashboard state
    const [activeTab, setActiveTab] = useState('order'); // order, history, analytics
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState({});
    const [deliveryDate, setDeliveryDate] = useState('');
    const [orders, setOrders] = useState([]);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const storedUser = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            if (!token) {
                setStatus({ type: 'error', message: 'Please login to continue.' });
                setLoading(false);
                return;
            }

            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }

            const API_URL = getApiUrl();

            // Fetch shop request status
            const shopResponse = await fetch(`${API_URL}/users/shop-request`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (shopResponse.ok) {
                const shopData = await shopResponse.json();
                setShopRequest(shopData.request);
                
                // If approved, fetch shop-related data
                if (shopData.request?.status === 'APPROVED') {
                    // Fetch products
                    const productsResponse = await fetch(`${API_URL}/products`);
                    if (productsResponse.ok) {
                        const productsData = await productsResponse.json();
                        setProducts(productsData.products || []);
                    }

                    // Fetch orders
                    const ordersResponse = await fetch(`${API_URL}/shop/orders`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (ordersResponse.ok) {
                        const ordersData = await ordersResponse.json();
                        setOrders(ordersData.orders || []);
                    }

                    // Set default delivery date to tomorrow (users can select any future date)
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setDeliveryDate(tomorrow.toISOString().split('T')[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setStatus({ type: 'error', message: 'Failed to load data' });
        } finally {
            setLoading(false);
        }
    };

    // Form handlers
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: 'Submitting request...' });

        try {
            const token = localStorage.getItem('token');
            const API_URL = getApiUrl();

            const response = await fetch(`${API_URL}/users/shop-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: 'Shop partnership request submitted successfully! We will review it shortly. Please check your email for updates on this request.' });
                setShopRequest(data.request);
                setFormData({
                    ownerName: '',
                    shopName: '',
                    fullAddress: '',
                    area: '',
                    contactNumber: '',
                    alternateNumber: '',
                    expectedDailyDemand: '',
                    preferredDeliveryTime: '',
                    notes: ''
                });
            } else {
                let errorMessage = data.message || 'Failed to submit request. Please try again.';
                if (data.errors && Array.isArray(data.errors)) {
                    errorMessage = data.errors.map(err => err.msg).join(', ');
                }
                setStatus({ type: 'error', message: errorMessage });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error. Please check your connection.' });
        }
    };

    // Shop dashboard handlers
    const handleQuantityChange = (productId, change) => {
        setCart(prev => {
            const currentQty = prev[productId] || 0;
            const newQty = Math.max(0, currentQty + change);
            if (newQty === 0) {
                const { [productId]: deleted, ...rest } = prev;
                return rest;
            }
            return { ...prev, [productId]: newQty };
        });
    };

    const handleQuantityInput = (productId, value) => {
        const numValue = parseInt(value) || 0;
        const validValue = Math.max(0, numValue);
        if (validValue === 0) {
            const { [productId]: deleted, ...rest } = cart;
            setCart(rest);
        } else {
            setCart(prev => ({
                ...prev,
                [productId]: validValue
            }));
        }
    };

    const calculateTotalItems = () => {
        return Object.values(cart).reduce((a, b) => a + b, 0);
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        const items = Object.entries(cart).map(([productId, quantity]) => ({
            productId,
            quantity
        }));

        if (items.length === 0) {
            setStatus({ type: 'error', message: "Please add at least one item to your order." });
            return;
        }

        setStatus({ type: 'loading', message: "Placing order..." });

        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/shop/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    products: items,
                    deliveryDate
                })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: "Order placed successfully!" });
                setCart({});
                // Refresh orders
                fetchData();
                setActiveTab('history');
            } else {
                setStatus({ type: 'error', message: data.message || "Failed to place order." });
            }
        } catch (error) {
            setStatus({ type: 'error', message: "Network error. Please try again." });
        }
    };

    const handleCancelPartnership = async () => {
        const reason = prompt('Please provide a reason for cancellation:');
        if (!reason) {
            return;
        }

        if (!confirm('Are you sure you want to request partnership cancellation? This action cannot be undone.')) {
            return;
        }

        setStatus({ type: 'loading', message: 'Submitting cancellation request...' });
        
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_URL}/users/shop-request/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: data.message });
                fetchData(); // Refresh data
            } else {
                setStatus({ type: 'error', message: data.message || 'Failed to submit cancellation request' });
            }
        } catch (error) {
            console.error('Error submitting cancellation request:', error);
            setStatus({ type: 'error', message: 'Network error. Please try again.' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Render request form if no request or rejected
    if (!shopRequest || shopRequest.status === 'REJECTED') {
        return (
            <div className="min-h-screen flex flex-col font-sans bg-gray-50">
                <Navbar />
                <div className="flex-grow">
                    <div className="relative h-64 md:h-80">
                        <div className="absolute inset-0">
                            <img src={heroImage} alt="Background" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40" />
                        </div>
                        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
                            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white drop-shadow-md mb-2">
                                Partner With Us
                            </h1>
                            <p className="text-lg md:text-xl text-brand-yellow font-medium max-w-2xl bg-black/30 p-2 rounded backdrop-blur-sm">
                                Open Your Ammu Foods Shop
                            </p>
                        </div>
                    </div>

                    <div className="container mx-auto px-4 py-12 -mt-10 relative z-10">
                        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-brand-red">
                            <div className="p-8">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Registration Details</h2>

                                {status.message && (
                                    <div className={`mb-6 p-4 rounded-md ${
                                        status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
                                        status.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 
                                        'bg-blue-50 text-blue-800 border border-blue-200'
                                    }`}>
                                        {status.message}
                                    </div>
                                )}

                                <form className="space-y-6" onSubmit={handleSubmit}>
                                    <div>
                                        <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700 mb-1">
                                            Owner Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="ownerName"
                                            name="ownerName"
                                            type="text"
                                            required
                                            minLength="2"
                                            maxLength="100"
                                            value={formData.ownerName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                            placeholder="Your full name"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-1">
                                            Shop Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="shopName"
                                            name="shopName"
                                            type="text"
                                            required
                                            minLength="2"
                                            maxLength="100"
                                            value={formData.shopName}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                            placeholder="Enter proposed shop name"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="fullAddress" className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Address <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            id="fullAddress"
                                            name="fullAddress"
                                            required
                                            minLength="10"
                                            maxLength="500"
                                            rows="3"
                                            value={formData.fullAddress}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                            placeholder="Complete shop address"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                                            Area/Locality <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="area"
                                            name="area"
                                            type="text"
                                            required
                                            minLength="2"
                                            maxLength="100"
                                            value={formData.area}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                            placeholder="City, Area"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                                Contact Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="contactNumber"
                                                name="contactNumber"
                                                type="tel"
                                                required
                                                pattern="[0-9]{10}"
                                                value={formData.contactNumber}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                                placeholder="10-digit mobile"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="alternateNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                                Alternate Number
                                            </label>
                                            <input
                                                id="alternateNumber"
                                                name="alternateNumber"
                                                type="tel"
                                                pattern="[0-9]{10}"
                                                value={formData.alternateNumber}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                                placeholder="Optional"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="expectedDailyDemand" className="block text-sm font-medium text-gray-700 mb-1">
                                            Expected Daily Demand <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            id="expectedDailyDemand"
                                            name="expectedDailyDemand"
                                            required
                                            rows="2"
                                            value={formData.expectedDailyDemand}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                            placeholder="e.g. 100 liters Payasam, 50 Beeda"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="preferredDeliveryTime" className="block text-sm font-medium text-gray-700 mb-1">
                                            Preferred Delivery Time
                                        </label>
                                        <input
                                            id="preferredDeliveryTime"
                                            name="preferredDeliveryTime"
                                            type="time"
                                            value={formData.preferredDeliveryTime}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                                            Additional Notes
                                        </label>
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            rows="3"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                            placeholder="Any special requirements..."
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            className="w-full bg-brand-red text-white font-bold py-3 px-4 rounded-md hover:bg-red-700 transition-colors shadow-lg"
                                        >
                                            Submit Partnership Request
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // Show pending status for new partnership request
    if (shopRequest.status === 'PENDING') {
        return (
            <div className="min-h-screen flex flex-col font-sans bg-gray-50">
                <Navbar />
                <div className="flex-grow container mx-auto px-4 py-12">
                    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl p-8 text-center">
                        <div className="mb-6">
                            <Clock size={64} className="mx-auto text-brand-yellow" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Request Under Review</h2>
                        <p className="text-gray-600 mb-6">
                            Your shop partnership request is currently being reviewed by our team. 
                            We'll notify you once a decision has been made. Please check your email for updates.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                            <p className="text-sm text-gray-700"><strong>Shop Name:</strong> {shopRequest.shopName}</p>
                            <p className="text-sm text-gray-700"><strong>Area:</strong> {shopRequest.area}</p>
                            <p className="text-sm text-gray-700"><strong>Status:</strong> <span className="text-yellow-600 font-semibold">Pending</span></p>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // Show cancellation pending status
    if (shopRequest.status === 'CANCELLATION_REQUESTED') {
        return (
            <div className="min-h-screen flex flex-col font-sans bg-gray-50">
                <Navbar />
                <div className="flex-grow container mx-auto px-4 py-12">
                    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl p-8 text-center">
                        <div className="mb-6">
                            <AlertCircle size={64} className="mx-auto text-yellow-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Cancellation Request Pending</h2>
                        <p className="text-gray-600 mb-6">
                            Your partnership cancellation request is being reviewed by our admin team. 
                            Your shop access will remain active until the request is approved. Please check your email for updates.
                        </p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left mb-6">
                            <p className="text-sm text-gray-700"><strong>Shop Name:</strong> {shopRequest.shopName}</p>
                            <p className="text-sm text-gray-700"><strong>Area:</strong> {shopRequest.area}</p>
                            <p className="text-sm text-gray-700"><strong>Cancellation Reason:</strong> {shopRequest.cancellationReason}</p>
                            <p className="text-sm text-gray-700"><strong>Status:</strong> <span className="text-yellow-600 font-semibold">Awaiting Admin Approval</span></p>
                        </div>
                        <p className="text-sm text-gray-500 italic">
                            Once approved, you'll be able to submit a new partnership request if needed.
                        </p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // Show cancelled status - allow new request
    if (shopRequest.status === 'CANCELLED') {
        return (
            <div className="min-h-screen flex flex-col font-sans bg-gray-50">
                <Navbar />
                <div className="flex-grow container mx-auto px-4 py-12">
                    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl p-8 text-center">
                        <div className="mb-6">
                            <AlertCircle size={64} className="mx-auto text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Partnership Ended</h2>
                        <p className="text-gray-600 mb-6">
                            Your partnership with Ammu Foods has been terminated. 
                            Thank you for being a part of our network.
                        </p>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left mb-6">
                            <p className="text-sm text-gray-700"><strong>Previous Shop:</strong> {shopRequest.shopName}</p>
                            <p className="text-sm text-gray-700"><strong>Partnership Duration:</strong> {new Date(shopRequest.partnershipStartDate).toLocaleDateString()} - {new Date(shopRequest.partnershipEndDate).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-700"><strong>Status:</strong> <span className="text-gray-600 font-semibold">Cancelled</span></p>
                        </div>
                        <button
                            onClick={() => {
                                setShopRequest(null);
                                setFormData({
                                    ownerName: '',
                                    shopName: '',
                                    fullAddress: '',
                                    area: '',
                                    contactNumber: '',
                                    alternateNumber: '',
                                    expectedDailyDemand: '',
                                    preferredDeliveryTime: '',
                                    notes: ''
                                });
                            }}
                            className="px-6 py-3 bg-brand-red text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                            Request New Partnership
                        </button>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // Show approved shop dashboard
    return (
        <div className="min-h-screen flex flex-col font-sans bg-gray-50">
            <Navbar />
            
            <div className="flex-grow">
                {/* Hero Section */}
                <div className="relative h-48 bg-brand-brown">
                    <div className="absolute inset-0">
                        <img src={heroImage} alt="Background" className="w-full h-full object-cover opacity-20" />
                    </div>
                    <div className="relative container mx-auto px-4 h-full flex flex-col justify-center">
                        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">
                            {shopRequest.shopName}
                        </h1>
                        <p className="text-white/90">Welcome back, {user?.name}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white border-b">
                    <div className="container mx-auto px-4">
                        <div className="flex gap-8">
                            <button
                                onClick={() => setActiveTab('order')}
                                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                                    activeTab === 'order' 
                                        ? 'border-brand-red text-brand-red' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Package size={20} className="inline mr-2" />
                                Place Order
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                                    activeTab === 'history' 
                                        ? 'border-brand-red text-brand-red' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <Clock size={20} className="inline mr-2" />
                                Order History
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                                    activeTab === 'analytics' 
                                        ? 'border-brand-red text-brand-red' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <TrendingUp size={20} className="inline mr-2" />
                                Analytics
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 py-8">
                    {status.message && (
                        <div className={`mb-6 p-4 rounded-md ${
                            status.type === 'success' ? 'bg-green-100 text-green-800' : 
                            status.type === 'error' ? 'bg-red-100 text-red-800' : 
                            status.type === 'info' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                            {status.message}
                        </div>
                    )}

                    {/* Place Order Tab */}
                    {activeTab === 'order' && (
                        <div className="max-w-6xl mx-auto">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Product List */}
                                <div className="lg:col-span-2 space-y-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-2xl font-bold text-gray-800">Available Products</h2>
                                        <div className="bg-brand-yellow/20 text-brand-brown px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                                            <ShoppingCart size={20} /> {calculateTotalItems()} Items
                                        </div>
                                    </div>
                                    
                                    {products.map(product => (
                                        <div key={product._id} className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                                    {product.imageUrl ? (
                                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800">{product.name}</h3>
                                                    <p className="text-sm text-gray-500">{product.description}</p>
                                                    <p className="text-sm font-medium text-brand-red mt-1">
                                                        Unit: {product.unit} | ₹{product.pricePerUnit}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleQuantityChange(product._id, -1)}
                                                    className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50 transition-colors"
                                                    disabled={!cart[product._id]}
                                                >
                                                    <Minus size={18} />
                                                </button>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={cart[product._id] || 0}
                                                    onChange={(e) => handleQuantityInput(product._id, e.target.value)}
                                                    className="w-16 text-center font-bold text-lg border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none py-1"
                                                />
                                                <button
                                                    onClick={() => handleQuantityChange(product._id, 1)}
                                                    className="p-1.5 rounded-md bg-brand-yellow text-white hover:bg-yellow-600 transition-colors"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Order Summary */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white p-6 rounded-xl shadow-lg sticky top-24 border-t-4 border-brand-red">
                                        <h3 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h3>

                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Delivery Date
                                                <span className="text-gray-500 text-xs ml-2">(Select any future date)</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={deliveryDate}
                                                onChange={(e) => setDeliveryDate(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow"
                                                min={new Date().toISOString().split('T')[0]}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                                            {Object.entries(cart).map(([id, qty]) => {
                                                const product = products.find(p => p._id === id);
                                                return (
                                                    <div key={id} className="flex justify-between text-sm">
                                                        <span className="text-gray-600">{product?.name}</span>
                                                        <span className="font-bold">x {qty}</span>
                                                    </div>
                                                );
                                            })}
                                            {Object.keys(cart).length === 0 && (
                                                <p className="text-gray-400 text-sm italic text-center py-2">No items selected</p>
                                            )}
                                        </div>

                                        <button
                                            onClick={handlePlaceOrder}
                                            disabled={Object.keys(cart).length === 0 || status.type === 'loading'}
                                            className={`w-full py-3 rounded-lg font-bold text-white shadow-md transition-all ${
                                                Object.keys(cart).length === 0
                                                    ? 'bg-gray-300 cursor-not-allowed'
                                                    : 'bg-brand-red hover:bg-red-700'
                                            }`}
                                        >
                                            {status.type === 'loading' ? 'Processing...' : 'Place Order'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order History Tab */}
                    {activeTab === 'history' && (
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Order History</h2>
                            
                            {orders && orders.length > 0 ? (
                                <div className="space-y-4">
                                    {orders.map(order => (
                                        <div key={order._id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-gray-800">Order #{order._id.slice(-6).toUpperCase()}</h3>
                                                    <p className="text-sm text-gray-500">
                                                        Placed: {new Date(order.createdAt).toLocaleDateString()} • 
                                                        Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'OUT_FOR_DELIVERY' ? 'bg-blue-100 text-blue-800' :
                                                    order.status === 'PACKED' ? 'bg-purple-100 text-purple-800' :
                                                    order.status === 'APPROVED' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                {order.products.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-gray-600">{item.productName}</span>
                                                        <span className="text-gray-800">{item.quantity} x ₹{item.pricePerUnit}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div className="mt-4 pt-4 border-t flex justify-between items-center">
                                                <span className="font-semibold text-gray-700">Total Amount:</span>
                                                <span className="text-xl font-bold text-brand-red">₹{order.totalAmount}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg p-12 text-center text-gray-500">
                                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-lg">No orders yet</p>
                                    <p className="text-sm mt-2">Place your first order to see it here</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && (
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Analytics</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
                                    <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                                    <p className="text-3xl font-bold text-gray-800">{orders.length}</p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
                                    <p className="text-sm text-gray-600 mb-1">Delivered</p>
                                    <p className="text-3xl font-bold text-gray-800">
                                        {orders.filter(o => o.status === 'DELIVERED').length}
                                    </p>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
                                    <p className="text-sm text-gray-600 mb-1">Pending</p>
                                    <p className="text-3xl font-bold text-gray-800">
                                        {orders.filter(o => ['PLACED', 'APPROVED', 'PACKED', 'OUT_FOR_DELIVERY'].includes(o.status)).length}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-4">Recent Activity</h3>
                                {orders.slice(0, 5).map(order => (
                                    <div key={order._id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                                        <div>
                                            <p className="font-medium text-gray-800">Order #{order._id.slice(-6).toUpperCase()}</p>
                                            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-brand-red">₹{order.totalAmount}</p>
                                            <p className="text-xs text-gray-500">{order.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cancel Partnership Section */}
                    <div className="max-w-4xl mx-auto mt-12 pt-8 border-t">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                            <div className="flex items-start gap-4">
                                <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-1" />
                                <div className="flex-grow">
                                    <h3 className="font-bold text-gray-800 mb-2">Cancel Partnership</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        If you wish to discontinue your partnership with Ammu Foods, you can submit a cancellation request. 
                                        Our team will review and process your request.
                                    </p>
                                    <button
                                        onClick={handleCancelPartnership}
                                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                    >
                                        Request Partnership Cancellation
                                    </button>
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

export default Shop;
