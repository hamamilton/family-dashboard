/** @type {import('tailwindcss').Config} */
export default {
    // 1. Tells Tailwind exactly where to look for your CSS classes
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            // 2. Your custom animations and effects go here
            keyframes: {
                shimmer: {
                    '100%': { transform: 'translateX(100%)' },
                }
            },
            // (Optional) You can also define the animation shorthand here 
            // so you could just type 'animate-shimmer' instead of the bracket syntax
            animation: {
                shimmer: 'shimmer 2s infinite',
            }
        },
    },
    plugins: [],
}