/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
        scaleIn: { '0%': { transform: 'scale(0.95)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
        wiggle:  { '0%,100%': { transform: 'rotate(-3deg)' }, '50%': { transform: 'rotate(3deg)' } },
      },
      animation: {
        'fade-in':  'fadeIn 0.25s ease-in-out',
        'slide-up': 'slideUp 0.28s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'wiggle':   'wiggle 0.4s ease-in-out',
      },
      boxShadow: {
        'pink-sm': '0 1px 3px rgba(236,72,153,0.15)',
        'pink-md': '0 4px 12px rgba(236,72,153,0.25)',
        'pink-lg': '0 8px 24px rgba(236,72,153,0.3)',
      },
    },
  },
  plugins: [],
};
