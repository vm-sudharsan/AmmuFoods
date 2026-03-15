import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getApiUrl } from '../../utils/api';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Phone, MapPin, Clock, Package, MessageSquare, Edit2, Save, X } from 'lucide-react';

const EventDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [newNote, setNewNote] = useState('');
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        fetchEventDetails();
    }, [id]);

    const fetchEventDetails = async () => {
        setLoading(true);
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/events/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                setEvent(data.event);
                setEditForm({
                    eventName: data.event.eventName,
                    contactPerson: data.event.contactPerson,
                    contactNumber: data.event.contactNumber,
                    eventLocation: data.event.eventLocation,
                    eventDate: data.event.eventDate?.split('T')[0],
                    deliveryTime: data.event.deliveryTime,
                    guestCount: data.event.guestCount || '',
                    specialInstructions: data.event.specialInstructions
                });
            } else {
                setStatus({ type: 'error', message: 'Failed to fetch event details' });
            }
        } catch (error) {
            console.error("Error fetching event details", error);
            setStatus({ type: 'error', message: 'Network error' });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/events/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                setStatus({ type: 'success', message: `Event status updated to ${newStatus}` });
                fetchEventDetails();
            } else {
                const data = await response.json();
                setStatus({ type: 'error', message: data.message || 'Failed to update status' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error' });
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) {
            setStatus({ type: 'error', message: 'Note cannot be empty' });
            return;
        }

        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/events/${id}/notes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ note: newNote })
            });

            if (response.ok) {
                setStatus({ type: 'success', message: 'Note added successfully' });
                setNewNote('');
                setShowNoteModal(false);
                fetchEventDetails();
            } else {
                const data = await response.json();
                setStatus({ type: 'error', message: data.message || 'Failed to add note' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error' });
        }
    };

    const handleSaveEdit = async () => {
        try {
            const API_URL = getApiUrl();
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/events/${id}/details`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editForm)
            });

            if (response.ok) {
                setStatus({ type: 'success', message: 'Event updated successfully' });
                setIsEditing(false);
                fetchEventDetails();
            } else {
                const data = await response.json();
                setStatus({ type: 'error', message: data.message || 'Failed to update event' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error' });
        }
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

    const getNextStatus = (currentStatus) => {
        const statusFlow = {
            'NEW': 'CONTACTED',
            'CONTACTED': 'ACCEPTED',
            'ACCEPTED': 'MANUFACTURING',
            'MANUFACTURING': 'PACKING',
            'PACKING': 'OUT_FOR_DELIVERY',
            'OUT_FOR_DELIVERY': 'COMPLETED'
        };
        return statusFlow[currentStatus];
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Navbar />
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-gray-500">Loading...</div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Navbar />
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-gray-500">Event not found</div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
            <Navbar />
            <div className="flex-grow container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/admin/events')}
                        className="flex items-center gap-2 text-brand-red hover:text-red-700 mb-4"
                    >
                        <ArrowLeft size={20} />
                        Back to Events
                    </button>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Calendar className="text-brand-red" size={32} />
                            <div>
                                <h1 className="text-3xl font-serif font-bold text-gray-800">{event.eventName}</h1>
                                <p className="text-gray-500">{event.eventLocation}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                                >
                                    <Edit2 size={18} />
                                    Edit
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleSaveEdit}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        <Save size={18} />
                                        Save
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditForm({
                                                eventName: event.eventName,
                                                contactPerson: event.contactPerson,
                                                contactNumber: event.contactNumber,
                                                eventLocation: event.eventLocation,
                                                eventDate: event.eventDate?.split('T')[0],
                                                deliveryTime: event.deliveryTime,
                                                guestCount: event.guestCount || '',
                                                specialInstructions: event.specialInstructions
                                            });
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                    >
                                        <X size={18} />
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {status.message && (
                    <div className={`mb-6 p-4 rounded-lg ${
                        status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                        {status.message}
                    </div>
                )}

                {/* Event Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Event Information</h2>
                        <div className="space-y-3">
                            {isEditing ? (
                                <>
                                    <div>
                                        <label className="text-sm text-gray-500">Event Name</label>
                                        <input
                                            type="text"
                                            value={editForm.eventName}
                                            onChange={(e) => setEditForm({...editForm, eventName: e.target.value})}
                                            className="w-full mt-1 px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Event Date</label>
                                        <input
                                            type="date"
                                            value={editForm.eventDate}
                                            onChange={(e) => setEditForm({...editForm, eventDate: e.target.value})}
                                            className="w-full mt-1 px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Location</label>
                                        <input
                                            type="text"
                                            value={editForm.eventLocation}
                                            onChange={(e) => setEditForm({...editForm, eventLocation: e.target.value})}
                                            className="w-full mt-1 px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Delivery Time</label>
                                        <input
                                            type="text"
                                            value={editForm.deliveryTime}
                                            onChange={(e) => setEditForm({...editForm, deliveryTime: e.target.value})}
                                            className="w-full mt-1 px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Guest Count</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={editForm.guestCount}
                                            onChange={(e) => setEditForm({...editForm, guestCount: e.target.value})}
                                            className="w-full mt-1 px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-start gap-3">
                                        <Calendar className="text-gray-400 mt-1" size={20} />
                                        <div>
                                            <p className="text-sm text-gray-500">Event Date</p>
                                            <p className="text-gray-800 font-medium">{formatDate(event.eventDate)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <MapPin className="text-gray-400 mt-1" size={20} />
                                        <div>
                                            <p className="text-sm text-gray-500">Location</p>
                                            <p className="text-gray-800 font-medium">{event.eventLocation}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock className="text-gray-400 mt-1" size={20} />
                                        <div>
                                            <p className="text-sm text-gray-500">Delivery Time</p>
                                            <p className="text-gray-800 font-medium">{event.deliveryTime}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Package className="text-gray-400 mt-1" size={20} />
                                        <div>
                                            <p className="text-sm text-gray-500">Guest Count</p>
                                            <p className="text-gray-800 font-medium">{event.guestCount || 'Not specified'}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Contact Information</h2>
                        <div className="space-y-3">
                            {isEditing ? (
                                <>
                                    <div>
                                        <label className="text-sm text-gray-500">Contact Person</label>
                                        <input
                                            type="text"
                                            value={editForm.contactPerson}
                                            onChange={(e) => setEditForm({...editForm, contactPerson: e.target.value})}
                                            className="w-full mt-1 px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Contact Number</label>
                                        <input
                                            type="text"
                                            value={editForm.contactNumber}
                                            onChange={(e) => setEditForm({...editForm, contactNumber: e.target.value})}
                                            className="w-full mt-1 px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-start gap-3">
                                        <User className="text-gray-400 mt-1" size={20} />
                                        <div>
                                            <p className="text-sm text-gray-500">Contact Person</p>
                                            <p className="text-gray-800 font-medium">{event.contactPerson}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Phone className="text-gray-400 mt-1" size={20} />
                                        <div>
                                            <p className="text-sm text-gray-500">Contact Number</p>
                                            <p className="text-gray-800 font-medium">{event.contactNumber}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <User className="text-gray-400 mt-1" size={20} />
                                        <div>
                                            <p className="text-sm text-gray-500">Customer</p>
                                            <p className="text-gray-800 font-medium">{event.userName}</p>
                                            <p className="text-sm text-gray-500">{event.userEmail}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status and Actions */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Status Management</h2>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(event.status)}`}>
                            {event.status.replace('_', ' ')}
                        </span>
                    </div>
                    {event.status !== 'COMPLETED' && event.status !== 'REJECTED' && getNextStatus(event.status) && (
                        <button
                            onClick={() => handleStatusUpdate(getNextStatus(event.status))}
                            className="px-6 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700"
                        >
                            Move to {getNextStatus(event.status).replace('_', ' ')}
                        </button>
                    )}
                </div>

                {/* Special Instructions */}
                {event.specialInstructions && (
                    <div className="bg-white rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Special Instructions</h2>
                        {isEditing ? (
                            <textarea
                                value={editForm.specialInstructions}
                                onChange={(e) => setEditForm({...editForm, specialInstructions: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg"
                                rows="4"
                            />
                        ) : (
                            <p className="text-gray-700 whitespace-pre-wrap">{event.specialInstructions}</p>
                        )}
                    </div>
                )}

                {/* Admin Notes */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Admin Notes</h2>
                        <button
                            onClick={() => setShowNoteModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <MessageSquare size={18} />
                            Add Note
                        </button>
                    </div>
                    {event.adminNotes ? (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-700 whitespace-pre-wrap">{event.adminNotes}</p>
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No notes yet</p>
                    )}
                </div>

                {/* Add Note Modal */}
                {showNoteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold mb-4">Add Note</h3>
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg mb-4"
                                rows="4"
                                placeholder="Enter your note..."
                            />
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => {
                                        setShowNoteModal(false);
                                        setNewNote('');
                                    }}
                                    className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddNote}
                                    className="px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700"
                                >
                                    Add Note
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
};

export default EventDetails;
