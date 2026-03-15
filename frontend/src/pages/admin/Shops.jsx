import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getApiUrl } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { Store, Clock, CheckCircle, XCircle, Edit2, Trash2, Eye } from 'lucide-react';

const Shops = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('new');
    const [requests, setRequests] = useState([]);
    const [myShops, setMyShops] = useState([]);
    const [allShops, setAllShops] = useState([]);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${API_URL}/admin/shop-requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                const allRequests = data.requests || [];
                
                // Filter by status - New Requests includes both PENDING and CANCELLATION_REQUESTED
                setRequests(allRequests.filter(r => r.status === 'PENDING' || r.status === 'CANCELLATION_REQUESTED'));
                
                // My Shops includes ACTIVE partnerships AND those with cancellation pending (still active until approved)
                setMyShops(allRequests.filter(r => 
                    r.status === 'APPROVED' && r.partnershipStatus === 'ACTIVE' ||
                    r.status === 'CANCELLATION_REQUESTED' && r.partnershipStatus === 'CANCELLATION_PENDING'
                ));
                
                setAllShops(allRequests);
            }
        } catch (error) {
            console.error("Error fetching shop data", error);
            setStatus({ type: 'error', message: 'Failed to fetch shop data' });
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action, additionalData = {}) => {
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${API_URL}/admin/shop-requests/${id}/${action}`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(additionalData)
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: data.message || `Action completed successfully` });
                fetchAllData();
            } else {
                setStatus({ type: 'error', message: data.message || 'Action failed' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error' });
        } finally {
            setLoading(false);
        }
    };

    const handleApproveCancellation = async (id) => {
        if (!confirm('Are you sure you want to approve this cancellation request? The partnership will be terminated.')) {
            return;
        }
        await handleAction(id, 'approve-cancellation');
    };

    const handleRejectCancellation = async (id) => {
        if (!confirm('Are you sure you want to reject this cancellation request? The partnership will remain active.')) {
            return;
        }
        // For now, we'll just reject by not doing anything
        // You could add a reject-cancellation endpoint if needed
        setStatus({ type: 'info', message: 'Cancellation request rejected. Partnership remains active.' });
    };

    const handleCancelPartnership = async (id) => {
        const reason = prompt('Please provide a reason for cancellation:');
        if (!reason) return;

        await handleAction(id, 'cancel', { reason });
    };

    const viewShopDetails = (id) => {
        navigate(`/admin/shops/${id}`);
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getPartnershipDuration = (shop) => {
        if (!shop.partnershipStartDate) return 'N/A';
        
        const start = formatDate(shop.partnershipStartDate);
        
        if (shop.partnershipStatus === 'ACTIVE') {
            return `Since ${start}`;
        } else if (shop.partnershipEndDate) {
            const end = formatDate(shop.partnershipEndDate);
            return `${start} - ${end}`;
        }
        
        return start;
    };

    const getStatusBadge = (shop) => {
        if (shop.status === 'APPROVED' && shop.partnershipStatus === 'ACTIVE') {
            return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Partner</span>;
        } else if (shop.status === 'CANCELLED') {
            return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">Ex-Partner</span>;
        } else if (shop.status === 'REJECTED') {
            return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">Rejected</span>;
        } else if (shop.status === 'PENDING') {
            return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Pending</span>;
        }
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">{shop.status}</span>;
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
            <Navbar />
            <div className="flex-grow container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Store className="text-brand-red" size={32} />
                        <h1 className="text-3xl font-serif font-bold text-gray-800">Shops Management</h1>
                    </div>
                </div>

                {status.message && (
                    <div className={`mb-6 p-4 rounded-lg ${
                        status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {status.message}
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('new')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'new'
                                        ? 'border-brand-red text-brand-red'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Clock size={18} />
                                    New Requests ({requests.length})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('myshops')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'myshops'
                                        ? 'border-brand-red text-brand-red'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={18} />
                                    My Shops ({myShops.length})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'all'
                                        ? 'border-brand-red text-brand-red'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Store size={18} />
                                    All ({allShops.length})
                                </div>
                            </button>
                        </nav>
                    </div>
                </div>

                {/* New Requests Tab */}
                {activeTab === 'new' && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Daily Stock</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {requests.map(req => (
                                    <tr key={req._id} className={`hover:bg-gray-50 ${req.status === 'CANCELLATION_REQUESTED' ? 'bg-red-50' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {req.status === 'CANCELLATION_REQUESTED' ? (
                                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                    Cancellation
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                    New Partner
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{req.shopName}</div>
                                            {req.status === 'CANCELLATION_REQUESTED' && req.cancellationReason && (
                                                <div className="text-xs text-red-600 mt-1">Reason: {req.cancellationReason}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{req.shopOwnerName}</div>
                                            <div className="text-xs text-gray-500">{req.userEmail}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.area}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.dailyStockNeeded}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {req.status === 'CANCELLATION_REQUESTED' 
                                                ? formatDate(req.cancellationRequestedAt)
                                                : formatDate(req.createdAt)
                                            }
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => viewShopDetails(req._id)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            {req.status === 'CANCELLATION_REQUESTED' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleApproveCancellation(req._id)}
                                                        disabled={loading}
                                                        className="text-green-600 hover:text-green-900 mr-3"
                                                        title="Approve Cancellation"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectCancellation(req._id)}
                                                        disabled={loading}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Reject Cancellation"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleAction(req._id, 'approve')}
                                                        disabled={loading}
                                                        className="text-green-600 hover:text-green-900 mr-3"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(req._id, 'reject')}
                                                        disabled={loading}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {requests.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                            No pending requests
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* My Shops Tab */}
                {activeTab === 'myshops' && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Daily Stock</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partnership</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {myShops.map(shop => (
                                    <tr key={shop._id} className={`hover:bg-gray-50 ${shop.status === 'CANCELLATION_REQUESTED' ? 'bg-yellow-50' : ''}`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{shop.shopName}</div>
                                            {shop.status === 'CANCELLATION_REQUESTED' && (
                                                <span className="inline-block mt-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                                    Cancellation Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{shop.shopOwnerName}</div>
                                            <div className="text-xs text-gray-500">{shop.userEmail}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shop.area}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shop.dailyStockNeeded}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {getPartnershipDuration(shop)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => viewShopDetails(shop._id)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            {shop.status !== 'CANCELLATION_REQUESTED' && (
                                                <>
                                                    <button
                                                        onClick={() => navigate(`/admin/shops/${shop._id}/edit`)}
                                                        className="text-yellow-600 hover:text-yellow-900 mr-3"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelPartnership(shop._id)}
                                                        disabled={loading}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Cancel Partnership"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {myShops.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                            No active partnerships
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* All Shops Tab */}
                {activeTab === 'all' && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {allShops.map(shop => (
                                    <tr key={shop._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => viewShopDetails(shop._id)}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{shop.shopName}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{shop.shopOwnerName}</div>
                                            <div className="text-xs text-gray-500">{shop.userEmail}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{shop.area}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {getPartnershipDuration(shop)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(shop)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => viewShopDetails(shop._id)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {allShops.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                            No shops found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default Shops;
