/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    red: '#CC1417',
                    yellow: '#FAAE3E',
                    green: '#04A96D',
                    brown: '#5D4037', // Dark brown from the mockup
                    beige: '#F5F5DC', // Light beige background
                }
            },
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
                script: ['Great Vibes', 'cursive'],
                cursive: ['Playball', 'cursive'],
            },
        },
    },
    plugins: [],
}
