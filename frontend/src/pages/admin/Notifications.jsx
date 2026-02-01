import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const Notifications = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
            <Navbar />
            <div className="flex-grow container mx-auto px-4 py-8">
                <h1 className="text-3xl font-serif font-bold text-gray-800 mb-6">Notifications</h1>

                <div className="space-y-4">
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                        <div className="flex justify-between">
                            <h3 className="font-bold">New Shop Request</h3>
                            <span className="text-xs text-gray-400">2 hours ago</span>
                        </div>
                        <p className="text-gray-600">Please review the request from "Chennai Sweets".</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                        <div className="flex justify-between">
                            <h3 className="font-bold">Low Stock Alert</h3>
                            <span className="text-xs text-gray-400">5 hours ago</span>
                        </div>
                        <p className="text-gray-600">Ellaneer Payasam is running low.</p>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Notifications;
