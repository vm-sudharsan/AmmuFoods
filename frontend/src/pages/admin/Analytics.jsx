import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const Analytics = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
            <Navbar />
            <div className="flex-grow container mx-auto px-4 py-8">
                <h1 className="text-3xl font-serif font-bold text-gray-800 mb-6">Analytics & Reports</h1>

                <div className="bg-white rounded-lg shadow p-6 text-center">
                    <p className="text-gray-500">Charts and sales reports will be displayed here.</p>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Analytics;
