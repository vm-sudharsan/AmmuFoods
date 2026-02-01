import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const OrdersManufacturing = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
            <Navbar />
            <div className="flex-grow container mx-auto px-4 py-8">
                <h1 className="text-3xl font-serif font-bold text-gray-800 mb-6">Orders & Manufacturing</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Active Orders</h2>
                        <p className="text-gray-500">List of all active user and shop orders.</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold mb-4">Manufacturing Plan</h2>
                        <p className="text-gray-500">Tomorrow's manufacturing requirements based on orders.</p>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default OrdersManufacturing;
