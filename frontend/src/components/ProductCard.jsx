import React from 'react';
import { ShoppingBag, Star } from 'lucide-react';

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
                {/* Quick Add Overlay */}
                {showQuickAdd && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button className="bg-brand-red text-white px-6 py-2 rounded-full font-bold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:bg-red-700 flex items-center">
                            <ShoppingBag size={18} className="mr-2" />
                            Quick Add
                        </button>
                    </div>
                )}
            </div>

            <div className="p-5">
                <div className="text-xs text-brand-brown font-semibold uppercase tracking-wider mb-1">{weight}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 font-serif group-hover:text-brand-red transition-colors">{title}</h3>

                <div className="flex justify-between items-center mt-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Price</span>
                        <span className="text-xl font-bold text-brand-red">₹{price}</span>
                    </div>
                    {showQuickAdd && (
                        <button className="p-2 rounded-full border border-gray-200 hover:bg-brand-red hover:text-white hover:border-brand-red transition-all text-brand-red">
                            <ShoppingBag size={20} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
