/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0a',
          900: '#101010',
          850: '#141414',
          800: '#1a1a1a',
          700: '#242424',
          600: '#333333',
          500: '#4a4a4a',
        },
        acid: {
          DEFAULT: '#a8ff00',
          dim: '#7fbf00',
          deep: '#4a6b00',
        },
      },
      fontFamily: {
        sans: ['"DM Sans Variable"', '"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(168,255,0,0.18)',
      },
    },
  },
  plugins: [],
}
