import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
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
      borderRadius: {
        DEFAULT: '8px',
        card: '12px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
