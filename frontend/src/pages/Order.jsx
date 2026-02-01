import React, { useState } from 'react';
import heroImage from '../assets/hero_sweets.png';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Order = () => {
    const [formData, setFormData] = useState({
        eventName: '',
        contactPerson: '',
        contactNumber: '',
        eventLocation: '',
        itemsRequired: '',
        approxQuantity: '',
        eventDate: '',
        deliveryTime: '',
        notes: ''
    });

    const [status, setStatus] = useState({ type: '', message: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: 'loading', message: 'Submitting party order...' });

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setStatus({ type: 'error', message: 'Please login to place an order.' });
                return;
            }

            const response = await fetch('http://localhost:5000/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: 'Party order request submitted successfully! We will contact you soon.' });
                setFormData({
                    eventName: '',
                    contactPerson: '',
                    contactNumber: '',
                    eventLocation: '',
                    itemsRequired: '',
                    approxQuantity: '',
                    eventDate: '',
                    deliveryTime: '',
                    notes: ''
                });
            } else {
                setStatus({ type: 'error', message: data.message || 'Failed to submit order.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error. Please try again later.' });
        }
    };

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
                            Party Orders
                        </h1>
                        <p className="text-lg md:text-xl text-brand-yellow font-medium max-w-2xl bg-black/30 p-2 rounded backdrop-blur-sm">
                            Make your celebrations sweeter with Ammu Foods
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="container mx-auto px-4 py-12 -mt-10 relative z-10">
                    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-brand-red">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Event Details</h2>

                            {status.message && (
                                <div className={`mb-6 p-4 rounded-md ${status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : status.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
                                    {status.message}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
                                        <input
                                            type="date"
                                            name="eventDate"
                                            value={formData.eventDate}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                        <input
                                            type="tel"
                                            name="contactNumber"
                                            value={formData.contactNumber}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Location</label>
                                    <input
                                        type="text"
                                        name="eventLocation"
                                        value={formData.eventLocation}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Items Required</label>
                                        <textarea
                                            name="itemsRequired"
                                            value={formData.itemsRequired}
                                            onChange={handleChange}
                                            required
                                            placeholder="List the sweets/drinks you need..."
                                            rows="3"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Approx Quantity & Delivery Time</label>
                                        <div className="space-y-4">
                                            <input
                                                type="text"
                                                name="approxQuantity"
                                                value={formData.approxQuantity}
                                                onChange={handleChange}
                                                required
                                                placeholder="e.g. 500 pax or 50kg"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                            />
                                            <input
                                                type="time"
                                                name="deliveryTime"
                                                value={formData.deliveryTime}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleChange}
                                        rows="2"
                                        placeholder="Any special requests or details..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                    ></textarea>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        className="w-full bg-brand-red text-white font-bold py-3 px-4 rounded-md hover:bg-red-700 transition-colors shadow-lg transform hover:-translate-y-0.5 duration-200"
                                    >
                                        Submit Order Request
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
};

export default Order;
