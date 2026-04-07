/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/renderer/**/*.{js,jsx,ts,tsx}",
        "./src/renderer/index.html",
    ],
    theme: {
        extend: {
            colors: {
                'trace-light': '#e7e7d9',
                'trace-dark': '#1e1e1e',
                'trace-orange': '#ec642b',
            },
            fontFamily: {
                sans: ['Cabinet Grotesk', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
