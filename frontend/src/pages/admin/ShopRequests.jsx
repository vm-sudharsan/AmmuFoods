import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getApiUrl } from '../../utils/api';

const ShopRequests = () => {
    const [requests, setRequests] = useState([]);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/admin/shop-requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setRequests(data.requests || []);
            }
        } catch (error) {
            console.error("Error fetching shop requests", error);
        }
    };

    const handleAction = async (id, action) => {
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/admin/shop-requests/${id}/${action}`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            if (response.ok) {
                setStatus({ type: 'success', message: `Request ${action}d successfully` });
                fetchRequests();
            } else {
                const data = await response.json();
                setStatus({ type: 'error', message: data.message || 'Action failed' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error' });
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
            <Navbar />
            <div className="flex-grow container mx-auto px-4 py-8">
                <h1 className="text-3xl font-serif font-bold text-gray-800 mb-6">Shop Requests</h1>

                {status.message && (
                    <div className={`mb-6 p-4 rounded-md ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {status.message}
                    </div>
                )}

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.map(req => (
                                <tr key={req._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.shopName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {req.shopOwnerName}<br/>
                                        <span className="text-xs text-gray-400">{req.userEmail || req.userId?.email}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.area}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.dailyStockNeeded}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                req.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {req.status === 'PENDING' && (
                                            <>
                                                <button onClick={() => handleAction(req._id, 'approve')} className="text-green-600 hover:text-green-900 mr-4">Approve</button>
                                                <button onClick={() => handleAction(req._id, 'reject')} className="text-red-600 hover:text-red-900">Reject</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No requests found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ShopRequests;
