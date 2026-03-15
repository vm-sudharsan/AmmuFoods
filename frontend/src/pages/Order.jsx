import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import heroImage from '../assets/hero_sweets.png';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getApiUrl } from '../utils/api';
import { Plus, Minus, Calendar, MapPin, Users, Clock, Package, Truck, CheckCircle, XCircle, Phone } from 'lucide-react';

const Order = () => {
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('place-order');
    const [products, setProducts] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState({});
    const [formData, setFormData] = useState({
        eventName: '',
        contactPerson: '',
        contactNumber: '',
        eventLocation: '',
        eventDate: '',
        deliveryTime: '',
        guestCount: '',
        notes: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(true);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [eventsError, setEventsError] = useState(null);

    // Check for tab parameter in URL
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'events') {
            setActiveTab('my-events');
        }
    }, [searchParams]);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (activeTab === 'my-events') {
            fetchUserEvents();
        }
    }, [activeTab]);

    const fetchProducts = async () => {
        try {
            const API_URL = getApiUrl();
            const response = await fetch(`${API_URL}/products`);
            const data = await response.json();
            if (response.ok) {
                setProducts(data.products || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setStatus({ type: 'error', message: 'Failed to load products' });
        } finally {
            setLoading(false);
        }
    };

    const fetchUserEvents = async () => {
        try {
            setEventsLoading(true);
            setEventsError(null);
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/events/my-events?t=${Date.now()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setEvents(data.events || []);
            } else {
                setEventsError('Failed to fetch event orders');
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            setEventsError('Failed to fetch event orders');
        } finally {
            setEventsLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleProductToggle = (productId) => {
        setSelectedProducts(prev => {
            if (prev[productId]) {
                const { [productId]: removed, ...rest } = prev;
                return rest;
            } else {
                return { ...prev, [productId]: 1 };
            }
        });
    };

    const handleQuantityChange = (productId, change) => {
        setSelectedProducts(prev => {
            const currentQty = prev[productId] || 0;
            const newQty = Math.max(1, currentQty + change);
            return { ...prev, [productId]: newQty };
        });
    };

    const handleQuantityInput = (productId, value) => {
        const numValue = parseInt(value) || 1;
        const validValue = Math.max(1, numValue);
        setSelectedProducts(prev => ({
            ...prev,
            [productId]: validValue
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: 'Submitting party order...' });

        // Check if at least one product is selected
        if (Object.keys(selectedProducts).length === 0) {
            setStatus({ type: 'error', message: 'Please select at least one product for your event.' });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setStatus({ type: 'error', message: 'Please login to place an order.' });
                return;
            }

            // Build items list and description
            const itemsList = Object.entries(selectedProducts).map(([productId, quantity]) => {
                const product = products.find(p => p._id === productId);
                return `${product?.name} (${quantity} ${product?.unit})`;
            }).join(', ');

            const approxQuantity = Object.entries(selectedProducts).map(([productId, quantity]) => {
                const product = products.find(p => p._id === productId);
                return `${quantity} ${product?.unit}`;
            }).join(', ');

            const API_URL = getApiUrl();
            const response = await fetch(`${API_URL}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    itemsRequired: itemsList,
                    approxQuantity: approxQuantity
                })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: 'Party order request submitted successfully! We will contact you soon. Please check your email for updates on this order.' });
                setFormData({
                    eventName: '',
                    contactPerson: '',
                    contactNumber: '',
                    eventLocation: '',
                    eventDate: '',
                    deliveryTime: '',
                    guestCount: '',
                    notes: ''
                });
                setSelectedProducts({});
            } else {
                setStatus({ type: 'error', message: data.message || 'Failed to submit order.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error. Please try again later.' });
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'NEW': 'bg-blue-100 text-blue-800',
            'CONTACTED': 'bg-yellow-100 text-yellow-800',
            'ACCEPTED': 'bg-green-100 text-green-800',
            'MANUFACTURING': 'bg-purple-100 text-purple-800',
            'PACKING': 'bg-orange-100 text-orange-800',
            'OUT_FOR_DELIVERY': 'bg-indigo-100 text-indigo-800',
            'COMPLETED': 'bg-emerald-100 text-emerald-800',
            'REJECTED': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'NEW': return <Clock size={16} />;
            case 'CONTACTED': return <Phone size={16} />;
            case 'ACCEPTED': return <CheckCircle size={16} />;
            case 'MANUFACTURING': return <Package size={16} />;
            case 'PACKING': return <Package size={16} />;
            case 'OUT_FOR_DELIVERY': return <Truck size={16} />;
            case 'COMPLETED': return <CheckCircle size={16} />;
            case 'REJECTED': return <XCircle size={16} />;
            default: return <Clock size={16} />;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading products...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col font-sans bg-gray-50">
            <Navbar />

            <div className="flex-grow">
                {/* Hero Section */}
                <div className="relative h-64 md:h-80">
                    <div className="absolute inset-0">
                        <img src={heroImage} alt="Background" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40" />
                    </div>
                    <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
                        <h1 className="text-3xl md:text-5xl font-serif font-bold text-white drop-shadow-md mb-2">
                            Order for Your Events
                        </h1>
                        <p className="text-lg md:text-xl text-brand-yellow font-medium max-w-2xl bg-black/30 p-2 rounded backdrop-blur-sm">
                            Make your celebrations sweeter with Ammu Foods
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="container mx-auto px-4 py-12 -mt-10 relative z-10">
                    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-brand-red">
                        {/* Tab Navigation */}
                        <div className="border-b border-gray-200">
                            <nav className="flex">
                                <button
                                    onClick={() => setActiveTab('place-order')}
                                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === 'place-order'
                                            ? 'border-brand-red text-brand-red bg-red-50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    Place Event Order
                                </button>
                                <button
                                    onClick={() => setActiveTab('my-events')}
                                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === 'my-events'
                                            ? 'border-brand-red text-brand-red bg-red-50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    My Event Orders
                                </button>
                            </nav>
                        </div>

                        {/* Tab Content */}
                        <div className="p-8">
                            {activeTab === 'place-order' ? (
                                <>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Event Details</h2>

                                    {status.message && (
                                        <div className={`mb-6 p-4 rounded-md ${
                                            status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
                                            status.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 
                                            'bg-blue-50 text-blue-800 border border-blue-200'
                                        }`}>
                                            {status.message}
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
                                        <input
                                            type="text"
                                            name="eventName"
                                            value={formData.eventName}
                                            onChange={handleChange}
                                            required
                                            placeholder="e.g. Wedding Reception, Birthday Party"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
                                        <input
                                            type="date"
                                            name="eventDate"
                                            value={formData.eventDate}
                                            onChange={handleChange}
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
                                        <input
                                            type="text"
                                            name="contactPerson"
                                            value={formData.contactPerson}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
                                        <input
                                            type="tel"
                                            name="contactNumber"
                                            value={formData.contactNumber}
                                            onChange={handleChange}
                                            required
                                            pattern="[0-9]{10}"
                                            placeholder="10-digit mobile number"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Location *</label>
                                    <input
                                        type="text"
                                        name="eventLocation"
                                        value={formData.eventLocation}
                                        onChange={handleChange}
                                        required
                                        placeholder="Venue address"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time *</label>
                                    <input
                                        type="time"
                                        name="deliveryTime"
                                        value={formData.deliveryTime}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Guest Count *</label>
                                    <input
                                        type="number"
                                        name="guestCount"
                                        value={formData.guestCount}
                                        onChange={handleChange}
                                        required
                                        min="1"
                                        placeholder="Expected number of guests"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                    />
                                </div>

                                {/* Products Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Select Products * 
                                        <span className="text-xs text-gray-500 ml-2">(Choose items and specify approx quantities)</span>
                                    </label>
                                    <div className="border border-gray-300 rounded-md p-4 max-h-96 overflow-y-auto bg-gray-50">
                                        {products.length > 0 ? (
                                            <div className="space-y-3">
                                                {products.map(product => (
                                                    <div key={product._id} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-brand-yellow transition-colors">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4 flex-grow">
                                                                {/* Checkbox */}
                                                                <input
                                                                    type="checkbox"
                                                                    id={`product-${product._id}`}
                                                                    checked={!!selectedProducts[product._id]}
                                                                    onChange={() => handleProductToggle(product._id)}
                                                                    className="w-5 h-5 text-brand-red focus:ring-brand-yellow rounded cursor-pointer"
                                                                />
                                                                
                                                                {/* Product Image */}
                                                                <div className="w-12 h-12 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                                                    {product.imageUrl ? (
                                                                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                                            No Img
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Product Info */}
                                                                <label htmlFor={`product-${product._id}`} className="flex-grow cursor-pointer">
                                                                    <h4 className="font-semibold text-gray-800">{product.name}</h4>
                                                                    <p className="text-sm text-gray-500">{product.description}</p>
                                                                    <p className="text-xs text-gray-600 mt-1">Unit: {product.unit}</p>
                                                                </label>
                                                            </div>

                                                            {/* Quantity Controls */}
                                                            {selectedProducts[product._id] && (
                                                                <div className="flex flex-col items-end gap-1 ml-4">
                                                                    <span className="text-xs text-gray-500 font-medium">Approx Qty</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleQuantityChange(product._id, -1)}
                                                                            className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                                                                        >
                                                                            <Minus size={16} />
                                                                        </button>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            value={selectedProducts[product._id]}
                                                                            onChange={(e) => handleQuantityInput(product._id, e.target.value)}
                                                                            className="w-16 text-center font-bold text-lg border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none py-1"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleQuantityChange(product._id, 1)}
                                                                            className="p-1.5 rounded-md bg-brand-yellow text-white hover:bg-yellow-600 transition-colors"
                                                                        >
                                                                            <Plus size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center text-gray-500 py-8">No products available</p>
                                        )}
                                    </div>
                                    
                                    {/* Selected Products Summary */}
                                    {Object.keys(selectedProducts).length > 0 && (
                                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Selected Items:</p>
                                            <div className="text-sm text-gray-600">
                                                {Object.entries(selectedProducts).map(([productId, quantity]) => {
                                                    const product = products.find(p => p._id === productId);
                                                    return (
                                                        <span key={productId} className="inline-block mr-3 mb-1">
                                                            • {product?.name}: {quantity} {product?.unit}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        rows="3"
                                        placeholder="Any special requests or details..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                    ></textarea>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={status.type === 'loading'}
                                        className="w-full bg-brand-red text-white font-bold py-3 px-4 rounded-md hover:bg-red-700 transition-colors shadow-lg transform hover:-translate-y-0.5 duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {status.type === 'loading' ? 'Submitting...' : 'Submit Order Request'}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">My Event Orders</h2>
                            
                            {eventsLoading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading your event orders...</p>
                                </div>
                            ) : eventsError ? (
                                <div className="text-center py-12">
                                    <div className="text-red-500 mb-4">
                                        <XCircle size={48} className="mx-auto" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Event Orders</h3>
                                    <p className="text-gray-600 mb-4">{eventsError}</p>
                                    <button
                                        onClick={fetchUserEvents}
                                        className="bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : events.length > 0 ? (
                                <div className="space-y-6">
                                    {events.map((event) => (
                                        <div key={event._id} className="border border-gray-200 rounded-lg overflow-hidden">
                                            {/* Event Header */}
                                            <div className="p-6 border-b border-gray-100 bg-gray-50">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                                            {event.eventName}
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar size={16} />
                                                                <span>{formatDate(event.eventDate)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <MapPin size={16} />
                                                                <span>{event.eventLocation}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Users size={16} />
                                                                <span>{event.guestCount} guests</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Phone size={16} />
                                                                <span>{event.contactPerson}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                                                            {getStatusIcon(event.status)}
                                                            {event.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Event Details */}
                                            <div className="p-6">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                    {/* Order Information */}
                                                    <div>
                                                        <h4 className="font-semibold text-gray-800 mb-3">Order Information</h4>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Order ID:</span>
                                                                <span className="font-medium">#{event._id.slice(-8)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-600">Submitted:</span>
                                                                <span>{formatDateTime(event.createdAt)}</span>
                                                            </div>
                                                            {event.estimatedCost && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Estimated Cost:</span>
                                                                    <span className="font-medium">₹{event.estimatedCost.toLocaleString()}</span>
                                                                </div>
                                                            )}
                                                            {event.finalCost && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Final Cost:</span>
                                                                    <span className="font-medium text-green-600">₹{event.finalCost.toLocaleString()}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Status History */}
                                                    <div>
                                                        <h4 className="font-semibold text-gray-800 mb-3">Status History</h4>
                                                        <div className="space-y-2">
                                                            {event.statusHistory && event.statusHistory.length > 0 ? (
                                                                event.statusHistory.slice(-3).reverse().map((history, index) => (
                                                                    <div key={index} className="flex items-center gap-3 text-sm">
                                                                        <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                                        <div className="flex-1">
                                                                            <div className="flex justify-between">
                                                                                <span className="font-medium">{history.status.replace('_', ' ')}</span>
                                                                                <span className="text-gray-500">{formatDateTime(history.timestamp)}</span>
                                                                            </div>
                                                                            {history.notes && (
                                                                                <p className="text-gray-600 text-xs mt-1">{history.notes}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p className="text-gray-500 text-sm">No status updates yet</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Requirements */}
                                                {event.requirements && (
                                                    <div className="mt-6">
                                                        <h4 className="font-semibold text-gray-800 mb-2">Requirements</h4>
                                                        <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                                                            {event.requirements}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Admin Notes */}
                                                {event.adminNotes && (
                                                    <div className="mt-4">
                                                        <h4 className="font-semibold text-gray-800 mb-2">Updates from Admin</h4>
                                                        <div className="bg-blue-50 p-3 rounded-lg">
                                                            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                                                                {event.adminNotes}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-800 mb-2">No Event Orders</h3>
                                    <p className="text-gray-600 mb-6">You haven't placed any event orders yet.</p>
                                    <button
                                        onClick={() => setActiveTab('place-order')}
                                        className="bg-brand-red text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
                                    >
                                        Place Your First Event Order
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Order;
