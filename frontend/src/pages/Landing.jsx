import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import ammuLady from '../assets/ammu_lady.jpg';
import ellaneerPayasam from '../assets/ellaneer_payasam.png';
import sweetBeeda from "../assets/sweet_peeda.png";
import jigarthanda from '../assets/jigarthanda.png';

const Landing = () => {
    return (
        <div className="min-h-screen flex flex-col bg-brand-beige">
            <Navbar landingPage={true} />

            {/* Hero Section */}
            <div className="relative bg-[#FFF5E1] overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">

                    {/* Text and Food Items Content */}
                    <div className="flex-1 text-center md:text-left space-y-8 z-10 w-full">
                        {/* Logo/Brand Text Area */}
                        <div className="relative inline-block text-center md:text-left w-full md:w-auto">
                            <div className="flex flex-col items-center md:items-start">
                                <h1 className="text-5xl md:text-7xl font-serif font-bold text-brand-brown tracking-wide uppercase leading-tight">
                                    Ammu
                                </h1>
                                <h2 className="text-4xl md:text-6xl font-cursive text-brand-red -mt-2 md:-mt-4 relative left-0 md:left-2">
                                    Foods
                                </h2>
                            </div>
                        </div>

                        {/* Food Items Display */}
                        <div className="space-y-6 mt-8">
                            {/* Item 1: Ellaneer Payasam */}
                            <div className="flex items-center justify-center md:justify-start gap-4 md:gap-6 group bg-white/50 p-2 rounded-xl backdrop-blur-sm hover:bg-white/80 transition-all duration-300 w-full md:w-fit">
                                <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-brand-beige rounded-full p-1 border-2 border-brand-yellow/30 overflow-hidden shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <img src={ellaneerPayasam} alt="Ellaneer Payasam" className="w-full h-full object-contain" />
                                </div>
                                <p className="text-2xl md:text-4xl font-script text-brand-red opacity-90 group-hover:text-brand-brown transition-colors">
                                    Ellaneer Payasam,
                                </p>
                            </div>

                            {/* Item 2: Sweet Beeda */}
                            <div className="flex items-center justify-center md:justify-start gap-4 md:gap-6 group bg-white/50 p-2 rounded-xl backdrop-blur-sm hover:bg-white/80 transition-all duration-300 w-full md:w-fit md:ml-12">
                                <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-brand-beige rounded-full p-1 border-2 border-brand-yellow/30 overflow-hidden shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <img src={sweetBeeda} alt="Sweet Beeda" className="w-full h-full object-contain" />
                                </div>
                                <p className="text-2xl md:text-4xl font-script text-brand-brown opacity-90 group-hover:text-brand-red transition-colors">
                                    Sweet Beeda
                                </p>
                            </div>

                            {/* Item 3: Jigarthanda */}
                            <div className="flex items-center justify-center md:justify-start gap-4 md:gap-6 group bg-white/50 p-2 rounded-xl backdrop-blur-sm hover:bg-white/80 transition-all duration-300 w-full md:w-fit">
                                <span className="hidden md:block h-0.5 w-8 bg-brand-yellow self-center"></span>
                                <p className="text-2xl md:text-4xl font-script text-brand-red opacity-90 group-hover:text-brand-brown transition-colors">
                                    Jigarthanda
                                </p>
                                <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-brand-beige rounded-full p-1 border-2 border-brand-yellow/30 overflow-hidden shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <img src={jigarthanda} alt="Jigarthanda" className="w-full h-full object-contain" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 flex flex-col md:flex-row gap-4 justify-center md:justify-start">
                            <a href="/login" className="bg-brand-red text-white px-10 py-3 rounded-full font-bold text-xl hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-200 text-center">
                                Login / Sign Up
                            </a>
                        </div>
                    </div>

                    {/* Founder Image */}
                    <div className="flex-1 relative flex justify-center md:justify-end mt-12 md:mt-0 w-full">
                        <div className="relative z-10 w-full max-w-sm md:max-w-md">
                            {/* Main Image with styling */}
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform rotate-2 hover:rotate-0 transition-transform duration-500">
                                <img
                                    src={ammuLady}
                                    alt="Ammu Foods Founder"
                                    className="w-full h-auto object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                            </div>

                            {/* Decorative badge */}
                            <div className="absolute -bottom-6 -left-4 md:-left-6 bg-brand-yellow text-brand-brown font-bold font-serif p-4 rounded-full shadow-lg border-4 border-white transform -rotate-12 animate-pulse">
                                <span className="block text-center text-xs uppercase tracking-widest">Since</span>
                                <span className="block text-center text-2xl">2018</span>
                            </div>
                        </div>

                        {/* Background Elements */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-brand-yellow/10 rounded-full blur-3xl -z-0"></div>
                        <div className="absolute -top-10 -right-10 text-[10rem] text-brand-red/5 font-serif font-bold -z-0 select-none hidden md:block">
                            AF
                        </div>
                    </div>
                </div>
            </div>

            {/* About Section - "Authentic Taste of Tradition" */}
            <div id="about" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-4xl font-serif font-bold text-brand-brown mb-6">About Us</h2>
                    <h3 className="text-2xl font-serif text-brand-red mb-4">Authentic Taste of Tradition</h3>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
                        Experience the true flavors of homemade delicacies, prepared with the finest ingredients and love.
                        From our signature sweet to refreshing drinks, every bite is a celebration.
                        At Ammu Foods, we bring you the nostalgia of grandmother's kitchen with every serving.
                    </p>
                </div>
            </div>

            {/* Featured Delicacies/Products Overview */}
            <div id="products" className="py-16 bg-brand-beige/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-serif font-bold text-center text-brand-brown mb-12">Our Products</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <ProductCard
                            image={ellaneerPayasam}
                            title="Ellaneer Payasam"
                            weight="250ml"
                            price="149"
                            rating={4.8}
                            showQuickAdd={false}
                        />
                        <ProductCard
                            image={sweetBeeda}
                            title="Sweet Beeda"
                            weight="1 Box (12 pcs)"
                            price="199"
                            rating={4.9}
                            showQuickAdd={false}
                        />
                        <ProductCard
                            image={jigarthanda}
                            title="Jigarthanda"
                            weight="300ml"
                            price="179"
                            rating={4.7}
                            showQuickAdd={false}
                        />
                    </div>

                </div>
            </div>



            <Footer />
        </div>
    );
};

export default Landing;
