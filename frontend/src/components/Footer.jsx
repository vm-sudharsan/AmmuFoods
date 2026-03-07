import React from 'react';
import { Instagram, MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-brand-brown text-brand-beige pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand Info */}
                    <div className="space-y-4">
                        <h2 className="text-3xl font-serif font-bold text-white">Ammu <span className="text-brand-yellow">Foods</span></h2>
                        <p className="text-sm opacity-80 leading-relaxed">
                            Authentic Indian sweets , made with love and traditional recipes. Bringing the taste of celebration to your doorstep.
                        </p>
                        <div className="flex space-x-4 pt-2">
                            <a href="https://www.instagram.com/ammufoods.ac?igsh=MXRrZDRuZmQ2Z2xiYg%3D%3D" target="_blank" rel="noopener noreferrer" className="hover:text-brand-yellow transition-colors"><Instagram size={20} /></a>

                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Quick Links</h3>
                        <ul className="space-y-3 text-sm opacity-80">
                            <li><a href="#" className="hover:text-brand-yellow transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-brand-yellow transition-colors">Shop All</a></li>
                            <li><a href="#" className="hover:text-brand-yellow transition-colors">Track Order</a></li>
                            <li><a href="#" className="hover:text-brand-yellow transition-colors">Contact Support</a></li>

                        </ul>
                    </div>

                    {/* Information */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Information</h3>
                        <ul className="space-y-3 text-sm opacity-80">
                            <li><a href="#" className="hover:text-brand-yellow transition-colors">Terms & Conditions</a></li>
                            <li><a href="#" className="hover:text-brand-yellow transition-colors">Refund and Returns Policy</a></li>
                            <li><a href="#" className="hover:text-brand-yellow transition-colors">Shipping Policy</a></li>
                            <li><a href="#" className="hover:text-brand-yellow transition-colors">Privacy Policy</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider">Contact Us</h3>
                        <ul className="space-y-4 text-sm opacity-80">
                            <li className="flex items-start">
                                <MapPin size={18} className="mr-3 mt-1 flex-shrink-0 text-brand-yellow" />
                                <span>7/602, Kumaran nagar Sulthanpet Sulur Coimbatore 641669</span>
                            </li>
                            <li className="flex items-center">
                                <Phone size={18} className="mr-3 flex-shrink-0 text-brand-yellow" />
                                <span>99949 36495</span>
                            </li>
                            <li className="flex items-center">
                                <Mail size={18} className="mr-3 flex-shrink-0 text-brand-yellow" />
                                <span>ammufoods2018@gmail.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-brand-beige/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs opacity-60">
                    <p>&copy; {new Date().getFullYear()} Ammu Foods Pvt Ltd. All rights reserved.</p>
                    <div className="mt-2 md:mt-0 space-x-4">
                        <a href="#" className="hover:text-brand-yellow">Terms of Service</a>
                        <a href="#" className="hover:text-brand-yellow">Sitemap</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
