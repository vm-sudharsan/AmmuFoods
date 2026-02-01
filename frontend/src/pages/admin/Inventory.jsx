import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const Inventory = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
            <Navbar />
            <div className="flex-grow container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-serif font-bold text-gray-800">Inventory Management</h1>
                    <button className="bg-brand-red text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
                        + Add New Product
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                    <p>Inventory management interface will be implemented here.</p>
                    <p>List of products, stock levels, edit/delete options.</p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Inventory;
