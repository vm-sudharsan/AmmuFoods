import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getApiUrl } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle, Package, Truck, Eye, Edit2, MessageSquare } from 'lucide-react';

const EventManagement = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('new');
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        filterEvents();
    }, [activeTab, events]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/events`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setEvents(data.events || []);
        } catch (error) {
            console.error('Error fetching events:', error);
            setStatus({ type: 'error', message: 'Failed to fetch events' });
        } finally {
            setLoading(false);
        }
    };

    const filterEvents = () => {
        if (activeTab === 'all') {
            setFilteredEvents(events);
        } else {
            const statusMap = {
                'new': 'NEW',
                'contacted': 'CONTACTED',
                'accepted': 'ACCEPTED',
                'manufacturing': 'MANUFACTURING',
                'packing': 'PACKING',
                'delivery': 'OUT_FOR_DELIVERY',
                'completed': 'COMPLETED'
            };
            setFilteredEvents(events.filter(e => e.status === statusMap[activeTab]));
        }
    };

    const handleMoveToNextStatus = async (eventId, currentStatus) => {
        const statusFlow = {
            'NEW': 'CONTACTED',
            'CONTACTED': 'ACCEPTED',
            'ACCEPTED': 'MANUFACTURING',
            'MANUFACTURING': 'PACKING',
            'PACKING': 'OUT_FOR_DELIVERY',
            'OUT_FOR_DELIVERY': 'COMPLETED'
        };

        const nextStatus = statusFlow[currentStatus];
        if (!nextStatus) {
            setStatus({ type: 'error', message: 'Event is already completed' });
            return;
        }

        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/events/${eventId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: nextStatus })
            });

            if (response.ok) {
                setStatus({ type: 'success', message: `Event moved to ${nextStatus}` });
                fetchEvents();
            } else {
                const data = await response.json();
                setStatus({ type: 'error', message: data.message || 'Failed to update status' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error' });
        }
    };

    const viewEventDetails = (id) => {
        navigate(`/admin/events/${id}`);
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            'NEW': 'bg-blue-100 text-blue-800',
            'CONTACTED': 'bg-yellow-100 text-yellow-800',
            'ACCEPTED': 'bg-green-100 text-green-800',
            'MANUFACTURING': 'bg-purple-100 text-purple-800',
            'PACKING': 'bg-orange-100 text-orange-800',
            'OUT_FOR_DELIVERY': 'bg-indigo-100 text-indigo-800',
            'COMPLETED': 'bg-gray-100 text-gray-800',
            'REJECTED': 'bg-red-100 text-red-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const getTabCount = (tabName) => {
        if (tabName === 'all') return events.length;
        const statusMap = {
            'new': 'NEW',
            'contacted': 'CONTACTED',
            'accepted': 'ACCEPTED',
            'manufacturing': 'MANUFACTURING',
            'packing': 'PACKING',
            'delivery': 'OUT_FOR_DELIVERY',
            'completed': 'COMPLETED'
        };
        return events.filter(e => e.status === statusMap[tabName]).length;
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
            <Navbar />
            <div className="flex-grow container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Calendar className="text-brand-red" size={32} />
                        <h1 className="text-3xl font-serif font-bold text-gray-800">Event Management</h1>
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
                        <nav className="flex -mb-px overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('new')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    activeTab === 'new'
                                        ? 'border-brand-red text-brand-red'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Clock size={18} />
                                    New Requests ({getTabCount('new')})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('contacted')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    activeTab === 'contacted'
                                        ? 'border-brand-red text-brand-red'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={18} />
                                    Contacted ({getTabCount('contacted')})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('accepted')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    activeTab === 'accepted'
                                        ? 'border-brand-red text-brand-red'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={18} />
                                    Accepted ({getTabCount('accepted')})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('manufacturing')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    activeTab === 'manufacturing'
                                        ? 'border-brand-red text-brand-red'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Package size={18} />
                                    Manufacturing ({getTabCount('manufacturing')})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('packing')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    activeTab === 'packing'
                                        ? 'border-brand-red text-brand-red'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Package size={18} />
                                    Packing ({getTabCount('packing')})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('delivery')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    activeTab === 'delivery'
                                        ? 'border-brand-red text-brand-red'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Truck size={18} />
                                    Out for Delivery ({getTabCount('delivery')})
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    activeTab === 'all'
                                        ? 'border-brand-red text-brand-red'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Calendar size={18} />
                                    All ({getTabCount('all')})
                                </div>
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Events Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredEvents.map(event => (
                                <tr key={event._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{event.eventName}</div>
                                        <div className="text-xs text-gray-500">Guest Count: {event.guestCount}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{event.contactPerson}</div>
                                        <div className="text-xs text-gray-500">{event.contactNumber}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(event.eventDate)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {event.eventLocation}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(event.status)}`}>
                                            {event.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => viewEventDetails(event._id)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        {event.status !== 'COMPLETED' && event.status !== 'REJECTED' && (
                                            <button
                                                onClick={() => handleMoveToNextStatus(event._id, event.status)}
                                                className="text-green-600 hover:text-green-900"
                                                title="Move to Next Status"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredEvents.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        No events found
                                    </td>
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

export default EventManagement;
