/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cormorant Garamond', 'serif'],
        display: ['Cinzel', 'serif'],
      },
      colors: {
        gold: {
          light: '#F3E5AB',
          DEFAULT: '#D4AF37',
          dark: '#996515',
        },
        velvet: {
          DEFAULT: '#1a0505',
          light: '#3d0c11',
          dark: '#0d0203',
        },
      },
    },
  },
  plugins: [],
}