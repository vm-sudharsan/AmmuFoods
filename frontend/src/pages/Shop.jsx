import React, { useState } from 'react';
import heroImage from '../assets/hero_sweets.png';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Shop = () => {
    const [formData, setFormData] = useState({
        shopName: '',
        location: '',
        expectedDailyDemand: '',
        contactNumber: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });

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
            if (!token) {
                setStatus({ type: 'error', message: 'Please login to submit a shop request.' });
                return;
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            const response = await fetch('http://localhost:5000/users/shop-request', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: 'Shop partnership request submitted successfully! We will review it shortly.' });
                setFormData({
                    shopName: '',
                    location: '',
                    expectedDailyDemand: '',
                    contactNumber: ''
                });
            } else {
                setStatus({
                    type: 'error',
                    message: data.message || 'Failed to submit request. Please try again.'
                });
            }
        } catch (error) {
            setStatus({
                type: 'error',
                message: 'Network error. Please check your connection.'
            });
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
                            Partner With Us
                        </h1>
                        <p className="text-lg md:text-xl text-brand-yellow font-medium max-w-2xl bg-black/30 p-2 rounded backdrop-blur-sm">
                            Open Your Ammu Foods Shop
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="container mx-auto px-4 py-12 -mt-10 relative z-10">
                    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border-t-4 border-brand-red">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Registration Details</h2>

                            {status.message && (
                                <div className={`mb-6 p-4 rounded-md ${status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : status.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
                                    {status.message}
                                </div>
                            )}

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div>
                                    <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Shop Name
                                    </label>
                                    <input
                                        id="shopName"
                                        name="shopName"
                                        type="text"
                                        required
                                        value={formData.shopName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                        placeholder="Enter proposed shop name"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                                        Location
                                    </label>
                                    <input
                                        id="location"
                                        name="location"
                                        type="text"
                                        required
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                        placeholder="City, Area"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="expectedDailyDemand" className="block text-sm font-medium text-gray-700 mb-1">
                                        Expected Daily Demand
                                    </label>
                                    <input
                                        id="expectedDailyDemand"
                                        name="expectedDailyDemand"
                                        type="text"
                                        required
                                        value={formData.expectedDailyDemand}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                        placeholder="e.g. 100 liters Payasam, 50 Beeda"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Number
                                    </label>
                                    <input
                                        id="contactNumber"
                                        name="contactNumber"
                                        type="tel"
                                        required
                                        value={formData.contactNumber}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-brand-yellow focus:border-brand-yellow focus:outline-none"
                                        placeholder="Your phone number"
                                    />
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        className="w-full bg-brand-red text-white font-bold py-3 px-4 rounded-md hover:bg-red-700 transition-colors shadow-lg transform hover:-translate-y-0.5 duration-200"
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
};

export default Shop;
