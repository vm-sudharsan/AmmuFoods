import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import heroImage from '../assets/hero_sweets.png';
import { ShoppingBag, Clock, FileText } from 'lucide-react';

const ShopDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.role !== 'SHOP') {
                navigate('/');
            }
            setUser(parsedUser);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    if (!user) return null;

    const cards = [
        {
            title: 'Place Daily Order',
            description: 'Order products for your shop from our catalog.',
            icon: <ShoppingBag size={40} className="text-brand-red" />,
            action: () => navigate('/shop-order'),
            color: 'bg-red-50 hover:bg-red-100'
        },
        {
            title: 'Order History',
            description: 'View past orders and their status.',
            icon: <Clock size={40} className="text-brand-yellow" />,
            action: () => navigate('/profile'), // History is in profile for now
            color: 'bg-yellow-50 hover:bg-yellow-100'
        },
        // Placeholder for future features like Invoices or Statements
        {
            title: 'My Profile',
            description: 'Manage your account details and shop info.',
            icon: <FileText size={40} className="text-blue-500" />,
            action: () => navigate('/profile'),
            color: 'bg-blue-50 hover:bg-blue-100'
        }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-brand-beige">
            <Navbar />

            <div className="flex-grow">
                {/* Hero Section */}
                <div className="relative bg-brand-brown text-white py-12">
                    <div className="absolute inset-0 overflow-hidden">
                        <img src={heroImage} alt="Background" className="w-full h-full object-cover opacity-20 blur-sm" />
                    </div>
                    <div className="relative container mx-auto px-4 text-center">
                        <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4">Shop Dashboard</h1>
                        <p className="text-xl opacity-90">Welcome back, {user.name}</p>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-12 -mt-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {cards.map((card, index) => (
                            <div
                                key={index}
                                onClick={card.action}
                                className={`rounded-xl p-8 shadow-lg cursor-pointer transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 ${card.color}`}
                            >
                                <div className="mb-6 flex justify-center">
                                    <div className="p-4 bg-white rounded-full shadow-sm">
                                        {card.icon}
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 text-center mb-3">{card.title}</h3>
                                <p className="text-gray-600 text-center">{card.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ShopDashboard;
