/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mango: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F'
        },
        olive: {
          50: '#F2F7F2',
          100: '#E1EDE0',
          200: '#C2DBC0',
          300: '#9AC297',
          400: '#6FA46B',
          500: '#4D8548',
          600: '#3A6B36',
          700: '#2D5A27',
          800: '#23461E',
          900: '#193415'
        },
        cream: {
          50: '#FDFBF7',
          100: '#FAF6ED',
          200: '#F4ECE0',
          300: '#EAE0D0'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};
