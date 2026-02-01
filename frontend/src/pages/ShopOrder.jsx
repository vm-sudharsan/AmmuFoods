import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ShopOrder = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState({});
    const [deliveryDate, setDeliveryDate] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('http://localhost:5000/products'); // Public route
                const data = await response.json();
                setProducts(data.products || []);
            } catch (error) {
                console.error("Failed to fetch products", error);
                setStatus({ type: 'error', message: "Failed to load products." });
            } finally {
                setLoading(false);
            }
        };

        const checkAuth = () => {
            const userStr = localStorage.getItem('user');
            if (!userStr || JSON.parse(userStr).role !== 'SHOP') {
                // double check role, though route protection might handle it generally
                // navigate('/'); 
            }
        };
        checkAuth();

        fetchProducts();

        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDeliveryDate(tomorrow.toISOString().split('T')[0]);
    }, [navigate]);

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

    const calculateTotalItems = () => {
        return Object.values(cart).reduce((a, b) => a + b, 0);
    };

    const handleSubmit = async (e) => {
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
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    items,
                    deliveryDate
                })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: "Order placed successfully!" });
                setCart({});
                setTimeout(() => navigate('/profile'), 2000);
            } else {
                setStatus({ type: 'error', message: data.message || "Failed to place order." });
            }
        } catch (error) {
            setStatus({ type: 'error', message: "Network error. Please try again." });
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
            <Navbar />

            <div className="flex-grow container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 font-serif">Daily Shop Order</h1>
                        <div className="bg-brand-yellow/20 text-brand-brown px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                            <ShoppingCart size={20} /> <span>{calculateTotalItems()} Items</span>
                        </div>
                    </div>

                    {status.message && (
                        <div className={`mb-6 p-4 rounded-md ${status.type === 'success' ? 'bg-green-100 text-green-800' : status.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                            {status.message}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Product List */}
                        <div className="md:col-span-2 space-y-4">
                            {products.map(product => (
                                <div key={product._id} className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between border border-gray-100">
                                    <div className="flex items-center gap-4">
                                        {/* Placeholder for product image if available, logic needed if no image */}
                                        <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                            {product.imageUrl ?
                                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" /> :
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                                            }
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{product.name}</h3>
                                            <p className="text-sm text-gray-500">{product.description}</p>
                                            <p className="text-sm font-medium text-brand-red mt-1">
                                                {/* Price formatting if needed */}
                                                Available Unit: {product.unit}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleQuantityChange(product._id, -1)}
                                            className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50"
                                            disabled={!cart[product._id]}
                                        >
                                            <Minus size={18} />
                                        </button>
                                        <span className="w-8 text-center font-bold text-lg">{cart[product._id] || 0}</span>
                                        <button
                                            onClick={() => handleQuantityChange(product._id, 1)}
                                            className="p-1 rounded-full bg-brand-yellow text-white hover:bg-yellow-600 shadow-sm"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary & Submit */}
                        <div className="md:col-span-1">
                            <div className="bg-white p-6 rounded-xl shadow-lg sticky top-24 border-t-4 border-brand-red">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Order Details</h3>

                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
                                    <input
                                        type="date"
                                        value={deliveryDate}
                                        onChange={(e) => setDeliveryDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow"
                                        min={new Date().toISOString().split('T')[0]}
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
                                    onClick={handleSubmit}
                                    disabled={Object.keys(cart).length === 0 || status.type === 'loading'}
                                    className={`w-full py-3 rounded-lg font-bold text-white shadow-md transition-all ${Object.keys(cart).length === 0
                                            ? 'bg-gray-300 cursor-not-allowed'
                                            : 'bg-brand-red hover:bg-red-700 transform hover:-translate-y-1'
                                        }`}
                                >
                                    {status.type === 'loading' ? 'Processing...' : 'Place Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ShopOrder;
