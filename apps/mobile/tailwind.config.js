/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1B5E20', light: '#2E7D32' },
        accent: '#4CAF50',
        'eco-light': '#E8F5E9',
        'eco-bg': '#F9F9F4',
        'eco-text': '#1C2A1C',
        'eco-gray': '#546E7A',
      },
    },
  },
  plugins: [],
};
