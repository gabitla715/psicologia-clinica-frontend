/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EAF1F8',
          100: '#D2E1F0',
          200: '#A6C3E1',
          600: '#0A4A85',
          700: '#073A6B',
          800: '#052C52',
          900: '#031D38',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
