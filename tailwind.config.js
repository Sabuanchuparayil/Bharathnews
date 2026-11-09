const typography = require('@tailwindcss/typography');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-amaranth)', 'sans-serif'],
        display: ['var(--font-amaranth)', 'sans-serif'],
        malayalam: ['var(--font-manjari)', 'var(--font-amaranth)', 'sans-serif'],
        body: ['var(--font-amaranth)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f2fbfb',
          100: '#d7f3f2',
          200: '#aee6e4',
          300: '#78d2cf',
          400: '#3db8b4',
          500: '#149e9a',
          600: '#0D7377',
          700: '#0b5c60',
          800: '#0e4a4d',
          900: '#103e40',
          950: '#062426',
        },
        accent: {
          emerald: '#0D7377',
          amber: '#E8A838',
          rose: '#DC2626',
          sky: '#0ea5e9',
        },
        surface: {
          0: '#ffffff',
          1: '#FAFAF7',
          2: '#F3F1EA',
          3: '#E7E5E4',
        },
        'dark-surface': {
          0: '#1A1A2E',
          1: '#23233a',
          2: '#2e2e48',
          3: '#3d3d58',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.12)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        card: '0 2px 8px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.06), 0 16px 40px rgba(0, 0, 0, 0.1)',
        floating: '0 20px 60px rgba(0, 0, 0, 0.15)',
      },
      backdropBlur: {
        glass: '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-up': 'fadeUp 0.6s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        shimmer: 'shimmer 2s infinite linear',
        'pulse-soft': 'pulseSoft 2s infinite ease-in-out',
        float: 'float 6s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
        slideDown: { '0%': { transform: 'translateY(-10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        scaleIn: { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
          },
        },
      },
    },
  },
  plugins: [typography],
};
