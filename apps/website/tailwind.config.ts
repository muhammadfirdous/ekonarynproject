import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F1F8F1',
          100: '#E8F5E9',
          200: '#C8E6C9',
          300: '#A5D6A7',
          500: '#4CAF50',
          700: '#2E7D32',
          900: '#1B5E20',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          500: '#6B7280',
          700: '#374151',
          900: '#111827',
          950: '#0A0F0A',
        },
        surface: '#FFFFFF',
        background: '#F7F9F7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)',
        'brand': '0 1px 3px rgba(27,94,32,0.3)',
        'brand-lg': '0 4px 12px rgba(27,94,32,0.25)',
        'glass': '0 4px 24px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
