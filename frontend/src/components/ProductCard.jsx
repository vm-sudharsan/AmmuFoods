import React from 'react';
import { Star } from 'lucide-react';

const ProductCard = ({ image, title, weight, price, rating = 4.5, showQuickAdd = true }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
            <div className="relative h-64 overflow-hidden">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center shadow-sm">
                    <Star size={14} className="text-brand-yellow fill-current" />
                    <span className="ml-1 text-xs font-bold text-gray-800">{rating}</span>
                </div>
            </div>

            <div className="p-5">
                <div className="text-xs text-brand-brown font-semibold uppercase tracking-wider mb-1">{weight}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 font-serif group-hover:text-brand-red transition-colors">{title}</h3>

                <div className="flex justify-between items-center mt-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Price</span>
                        <span className="text-xl font-bold text-brand-red">₹{price}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
