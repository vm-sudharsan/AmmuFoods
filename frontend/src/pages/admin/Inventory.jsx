import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getApiUrl } from '../../utils/api';
import { Plus, Edit, Trash2, AlertTriangle } from 'lucide-react';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        unit: '',
        pricePerUnit: '',
        currentStock: '',
        minimumStockLevel: '',
        isAvailable: true
    });
    const [imageFile, setImageFile] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/products`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: 'Saving product...' });

        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            
            // Prepare data object
            const dataToSend = { ...formData };
            
            // Convert image to base64 if present
            if (imageFile) {
                const base64Image = await convertToBase64(imageFile);
                dataToSend.image = base64Image;
            }

            const url = editingProduct 
                ? `${API_URL}/products/${editingProduct._id}`
                : `${API_URL}/products`;
            
            const method = editingProduct ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSend)
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: `Product ${editingProduct ? 'updated' : 'created'} successfully!` });
                setShowModal(false);
                resetForm();
                fetchProducts();
            } else {
                setStatus({ type: 'error', message: data.message || 'Failed to save product' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error. Please try again.' });
        }
    };

    // Helper function to convert file to base64
    const convertToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            category: product.category,
            unit: product.unit,
            pricePerUnit: product.pricePerUnit,
            currentStock: product.currentStock,
            minimumStockLevel: product.minimumStockLevel,
            isAvailable: product.isAvailable
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setStatus({ type: 'success', message: 'Product deleted successfully!' });
                fetchProducts();
            } else {
                setStatus({ type: 'error', message: 'Failed to delete product' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error' });
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            category: '',
            unit: '',
            pricePerUnit: '',
            currentStock: '',
            minimumStockLevel: '',
            isAvailable: true
        });
        setImageFile(null);
        setEditingProduct(null);
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
            <Navbar />
            <div className="flex-grow container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-serif font-bold text-gray-800">Inventory Management</h1>
                    <button 
                        onClick={openAddModal}
                        className="bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                    >
                        <Plus size={20} /> Add New Product
                    </button>
                </div>

                {status.message && (
                    <div className={`mb-6 p-4 rounded-md ${
                        status.type === 'success' ? 'bg-green-100 text-green-800' : 
                        status.type === 'error' ? 'bg-red-100 text-red-800' : 
                        'bg-blue-100 text-blue-800'
                    }`}>
                        {status.message}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map(product => (
                        <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                            <div className="h-48 bg-gray-200 overflow-hidden">
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
                                    {product.currentStock < product.minimumStockLevel && (
                                        <AlertTriangle size={20} className="text-red-500" />
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                                <div className="space-y-1 text-sm mb-4">
                                    <p><span className="font-medium">Category:</span> {product.category}</p>
                                    <p><span className="font-medium">Unit:</span> {product.unit}</p>
                                    <p><span className="font-medium">Price:</span> ₹{product.pricePerUnit}</p>
                                    <p className={product.currentStock < product.minimumStockLevel ? 'text-red-600 font-bold' : ''}>
                                        <span className="font-medium">Stock:</span> {product.currentStock} / {product.minimumStockLevel}
                                    </p>
                                    <p>
                                        <span className="font-medium">Status:</span>{' '}
                                        <span className={product.isAvailable ? 'text-green-600' : 'text-red-600'}>
                                            {product.isAvailable ? 'Available' : 'Unavailable'}
                                        </span>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(product)}
                                        className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition flex items-center justify-center gap-1"
                                    >
                                        <Edit size={16} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product._id)}
                                        className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 transition flex items-center justify-center gap-1"
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {products.length === 0 && (
                    <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
                        <p className="text-lg mb-2">No products found</p>
                        <p>Click "Add New Product" to get started</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold mb-4">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Product Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-yellow"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Category *</label>
                                        <input
                                            type="text"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-yellow"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description *</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        required
                                        rows="3"
                                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-yellow"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Unit *</label>
                                        <input
                                            type="text"
                                            name="unit"
                                            value={formData.unit}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="kg, piece, box"
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-yellow"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Price per Unit *</label>
                                        <input
                                            type="number"
                                            name="pricePerUnit"
                                            value={formData.pricePerUnit}
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-yellow"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Current Stock *</label>
                                        <input
                                            type="number"
                                            name="currentStock"
                                            value={formData.currentStock}
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-yellow"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Minimum Stock Level *</label>
                                        <input
                                            type="number"
                                            name="minimumStockLevel"
                                            value={formData.minimumStockLevel}
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-brand-yellow"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Product Image</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="w-full px-3 py-2 border rounded-md"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="isAvailable"
                                        checked={formData.isAvailable}
                                        onChange={handleInputChange}
                                        className="mr-2"
                                    />
                                    <label className="text-sm font-medium">Product is available for orders</label>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-brand-red text-white rounded-md hover:bg-red-700"
                                    >
                                        {editingProduct ? 'Update Product' : 'Add Product'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default Inventory;
